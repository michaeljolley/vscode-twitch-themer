import * as vscode from 'vscode';
import { IListRecipient } from './IListRecipient';
import { ITheme } from './ITheme';
import { IWhisperMessage } from '../chat/IWhisperMessage';
import { keytar } from '../Common';
import { KeytarKeys, AccessState, UserLevel, ThemeNotAvailableReasons } from '../Enum';
import { API } from '../api/API';
import { IChatMessage } from '../chat/IChatMessage';
import { Logger } from '../Logger';
import { OnMessageFlags } from 'comfy.js';
import { ICommand } from './ICommand';

/**
 * Manages all logic associated with retrieving themes,
 * changing themes, etc.
 */
export class Themer {
  private _accessState: AccessState = AccessState.Viewers;
  private _installState: AccessState = AccessState.Followers;
  private _autoInstall: boolean = false;
  private _originalTheme: ITheme | undefined;
  private _availableThemes: Array<ITheme> = [];
  private _listRecipients: Array<IListRecipient> = [];
  private _followers: Array<IListRecipient> = [];
  private _commands: ICommand = {};
  private _redemptionHoldPeriodMinutes: number = 5;
  private _pauseThemer: boolean = false;

  private sendWhisperEventEmitter = new vscode.EventEmitter<IWhisperMessage>();
  private sendMessageEventEmitter = new vscode.EventEmitter<string>();

  /** Event that fires when themer needs to send a whisper */
  public onSendWhisper = this.sendWhisperEventEmitter.event;

  /** Event that fires when themer needs to send a message */
  public onSendMessage = this.sendMessageEventEmitter.event;

  /**
   * constructor
   * @param _state - The global state of the extension
   * @param logger - The logger used when logging events
   */
  constructor(private _state: vscode.Memento, private logger: Logger) {
    /**
     * Gather command names from the extension settings
     */
    this.initCommands();
    // If this extension configuration changes, ensure the command trigger is updated
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration('twitchThemer')) {
        this.initCommands();
      }
    });

    /**
     * Get the configuration to auto-install or not
     */
    this._autoInstall = vscode.workspace
      .getConfiguration()
      .get<boolean>('twitchThemer.autoInstall') || false;

    /**
     * Initialize the list of available themes for users
     */
    this.loadThemes();

    /**
     * Get the current theme so we can reset it later
     * via command or when disconnecting from chat
     */
    const theme: string = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme') || 'Visual Studio Dark+';

    this._originalTheme = this._availableThemes.filter(
      f =>
        f.label.toLocaleLowerCase() === theme.toLocaleLowerCase() ||
        (f.themeId &&
          f.themeId.toLocaleLowerCase() === theme.toLocaleLowerCase())
    )[0];

    /**
     * Gets the access state from the workspace
     */
    this._accessState = vscode.workspace
      .getConfiguration()
      .get('twitchThemer.accessState', AccessState.Viewers);

    /**
     * Rehydrate the banned users from the extensions global state
     */
    this._state
      .get('bannedUsers', [])
      .forEach(username =>
        this._listRecipients.push({ username, banned: true })
      );

    /**
     * Executes whenever a new extension is installed.
     * Unfortunately this event does not fire with the
     * new extension as a param, so we must assume that maybe it was
     * a theme, and we need to refresh the available themes.
     */
    vscode.extensions.onDidChange(() => {
      // Reload the available themes.
      this.loadThemes();
    });
  }

  public handleConnectionChanges(signedIn: boolean) {
    if (signedIn) {
      this.loadThemes();
    } else {
      if (this._originalTheme) {
        this.setTheme('Themer', this._originalTheme);
      }
    }
  }

  /**
   * Updates access state of extension
   * @param accessState - New access state
   */
  public handleAccessStateChanged(accessState: AccessState) {
    this._accessState = accessState;
  }

  private getUserLevel(onMessageFlags: OnMessageFlags): UserLevel {
    if (onMessageFlags.broadcaster) return UserLevel.broadcaster;
    if (onMessageFlags.mod) return UserLevel.moderator;
    if (onMessageFlags.vip) return UserLevel.vip;
    if (onMessageFlags.subscriber) return UserLevel.subscriber;
    return UserLevel.viewer;
  }

  /**
   * Attempts to process commands received by users in Twitch chat
   * @param chatMessage - User & message received from Twitch
   */
  public async handleCommands(chatMessage: IChatMessage) {
    let message: string = chatMessage.message.replace(',', '');

    let username: string | undefined;

    /** Determine if the param is a (un)ban request */
    const ban = message.match(/((?:!)?ban) (\w*)/);
    if (ban) {
      message = ban[1] || ''; // Change the param to 'ban' or 'unban'
      username = ban[2]; // The username to ban
    }

    const params: string[] = message.split(' ');
    let command: string = '';
    if (params.length > 0) {
      command = params[0];
    }

    this.logger.debug(`Executing command: '${command === '' ? 'sendThemes' : command}'`);

    switch (command) {
      case '':
        await this.sendThemes(chatMessage.user);
        break;
      case this._commands['current']:
        await this.currentTheme();
        break;
      case this._commands['reset']:
        await this.resetTheme(chatMessage.user, chatMessage.extra.userId, chatMessage.flags);
        break;
      case this._commands['random']:
        await this.randomTheme(chatMessage.user, chatMessage.extra.userId, chatMessage.flags, chatMessage.message);
        break;
      case this._commands['help']:
        await this.help();
        break;
      case this._commands['refresh']:
        await this.refreshThemes(chatMessage.flags);
        break;
      case this._commands['repo']:
        await this.repo();
        break;
      case this._commands["install"]:
        await this.installTheme(chatMessage.user, chatMessage.flags, chatMessage.message);
        break;
      case this._commands['ban']:
        if (username !== undefined) {
          await this.ban(chatMessage.flags, username);
        }
        break;
      case `!${this._commands["ban"]}`:
        if (username !== undefined) {
          await this.unban(chatMessage.flags, username);
        }
        break;
      default:
        await this.changeTheme(chatMessage.user, chatMessage.extra.userId, chatMessage.flags, message);
        break;
    }
  }

  /**
   * Retrieves an IListRecipient
   * @param twitchUser The user to retrieve from the list of recipients
   * @param banned (optional) Include only recipients that are banned
   */
  private getRecipient(
    twitchUser: string,
    banned?: boolean
  ): IListRecipient | undefined {
    return this._listRecipients.filter(
      f =>
        f.username.toLocaleLowerCase() === twitchUser.toLocaleLowerCase() &&
        f.banned === banned
    )[0];
  }

  /**
   * Updates the state of the extension
   */
  private updateState() {
    const bannedUsers = this._listRecipients
      .filter(recipient => recipient.banned && recipient.banned === true)
      .map(recipient => recipient.username);

    this._state.update('bannedUsers', bannedUsers);
  }

  /**
   * Bans a user from using the themer plugin.
   * @param onMessageFlags The user requesting the ban
   * @param username The user to ban
   */
  private async ban(onMessageFlags: OnMessageFlags, username: string) {
    if (this.getUserLevel(onMessageFlags) > UserLevel.viewer) {
      const recipient = this.getRecipient(username);
      if (recipient === undefined) {
        this._listRecipients.push({
          username: username.toLocaleLowerCase(),
          banned: true
        });
      } else {
        const index = this._listRecipients.indexOf(recipient);
        recipient.banned = true;
        this._listRecipients.splice(index, 1, recipient);
      }
      this.updateState();
    }
  }

  /**
   * Unbans a user allowing them to use the themer plugin.
   * @param onMessageFlags The user flags of the user requesting the unban
   * @param username The user to unban
   */
  private async unban(onMessageFlags: OnMessageFlags, username: string) {
    if (this.getUserLevel(onMessageFlags) > UserLevel.viewer) {
      const recipient = this.getRecipient(username, true);
      if (recipient !== undefined) {
        const index = this._listRecipients.indexOf(recipient);
        recipient.banned = false;
        this._listRecipients.splice(index, 1, recipient);
        this.updateState();
      }
    }
  }

  /**
   * Send a whisper to the requesting user with a list of available themes
   * @param user - User that will receive whisper of available themes
   */
  private async sendThemes(user: string) {

    /** Ensure that we haven't sent them the list recently. */
    const lastSent = this.getRecipient(user);

    if (lastSent && lastSent.banned && lastSent.banned === true) {
      return;
    }

    if (lastSent && lastSent.lastSent) {
      if (lastSent.lastSent.getDate() > new Date().getDate() + -1) {
        return;
      } else {
        lastSent.lastSent = new Date();
      }
    } else {
      this._listRecipients.push({
        username: user,
        lastSent: new Date()
      });
    }

    /** Get list of available themes and whisper them to user */
    const themeNames = this._availableThemes.map(m => m.label);

    let message = "Available themes are: ";
    /** Iterate over the theme names and add to the message
     *  checking if the length is still under 499. If so, check if the
     *  next theme name can fit and stay under 499 characters 
     */
    for (var name of themeNames) {
      if (message.length < 499 && name.length <= (499 - message.length)) {
        message += `${name}, `;
      } else {
        /** If no more theme names can be added, go ahead and send the first message 
         * and start over building the next message */
        this.sendWhisperEventEmitter.fire({
          user,
          message: message.replace(/(^[,\s]+)|([,\s]+$)/g, '')
        });
        message = `${name}, `;
      }
    };

    /** Send the final message */
    this.sendWhisperEventEmitter.fire({
      user,
      message: message.replace(/(^[,\s]+)|([,\s]+$)/g, '')
    });
  }

  /**
   * Resets the theme to the one that was active when the extension was loaded
   * @param twitchUser - pass through the twitch user state
   */
  public async resetTheme(user: string, userId: string, onMessageFlags: OnMessageFlags) {
    if (this._originalTheme) {
      await this.changeTheme(user, userId, onMessageFlags, this._originalTheme.label);
    }
  }

  /**
   * Refreshes the list of available themes
   * @param onMessageFlags - User flags of user requesting to refresh the theme list
   */
  private async refreshThemes(onMessageFlags: OnMessageFlags) {
    /** We only refresh the list of themes
     * if the requester was a moderator/broadcaster
     */
    if (this.getUserLevel(onMessageFlags) > UserLevel.viewer) {
      this.loadThemes();
    }
  }

  private initCommands() {
    const configuration = vscode.workspace.getConfiguration('twitchThemer');
    this._commands['install'] = configuration.get<string>("installCommand") || "install";
    this._commands['current'] = configuration.get<string>("currentCommand") || "current";
    this._commands['help'] = configuration.get<string>("helpCommand") || "help";
    this._commands['random'] = configuration.get<string>("randomCommand") || "random";
    this._commands['dark'] = configuration.get<string>("darkCommand") || "dark";
    this._commands['light'] = configuration.get<string>("lightCommand") || "light";
    this._commands['refresh'] = configuration.get<string>("refreshCommand") || "refresh";
    this._commands['repo'] = configuration.get<string>("repoCommand") || "repo";
    this._commands['ban'] = configuration.get<string>("banCommand") || "ban";
    this._redemptionHoldPeriodMinutes = configuration.get<number>("redemptionHoldPeriodMinutes") || 5;
  }

  private async loadThemes() {
    vscode.extensions.all
      .filter(
        f =>
          f.packageJSON.contributes &&
          f.packageJSON.contributes.themes &&
          f.packageJSON.contributes.themes.length > 0
      )
      .forEach((fe: any) => {
        const iThemes = fe.packageJSON.contributes.themes.map((m: any) => {
          return { extensionId: fe.id, label: m.label, themeId: m.id, isDark: m.uiTheme !== 'vs' };
        });

        this._availableThemes = this._availableThemes.concat
          .apply(this._availableThemes, iThemes)
          .filter(() => true);
      });

    /**
     * The only reasons to refresh the list of themes is because
     * the user has added or removed theme extensions. Since the
     * list of available themes has changed we should allow users
     * to re-request the list of themes so they can continue playing.
     */
    this.clearListRecipients();
  }

  public setPauseStatus(isPaused: boolean) {
    this._pauseThemer = isPaused;
  }

  private isBanned(twitchUserName: string): boolean {
    if (twitchUserName) {
      const recipient = this.getRecipient(twitchUserName.toLocaleLowerCase(), true);
      if (recipient && recipient.banned && recipient.banned === true) {
        return true;
      }
    }
    return false;
  }

  /**
   * Installs the requested THEME and switches to the theme once installed
   * @param twitchUser - pass through twitch user state
   * @param message - message sent via chat
   */
  private async installTheme(user: string, onMessageFlags: OnMessageFlags, message: string): Promise<void> {

    /** Ensure the user hasn't been banned before installing the theme */
    if (this.isBanned(user)) {
      return;
    }

    following: if (this._installState === AccessState.Followers) {
      if (this.getUserLevel(onMessageFlags) === UserLevel.broadcaster) {
        break following;
      } else if (
        this._followers.find(
          x => x.username === user.toLocaleLowerCase()
        )
      ) {
        break following;
      } else if (
        (await API.isTwitchUserFollowing(user, this.logger))
      ) {
        this._followers.push({
          username: user.toLocaleLowerCase()
        });
        break following;
      } else {
        return;
      }
    } else {
      break following;
    }

    subscriber: if (this._installState === AccessState.Subscribers) {
      if (this.getUserLevel(onMessageFlags) === UserLevel.broadcaster) {
        break subscriber;
      } else if (onMessageFlags.subscriber) {
        break subscriber;
      } else {
        return;
      }
    } else {
      break subscriber;
    }

    moderator: if (this._installState === AccessState.Subscribers) {
      if (this.getUserLevel(onMessageFlags) === UserLevel.broadcaster) {
        break moderator;
      } else if (onMessageFlags.mod) {
        break moderator;
      } else {
        return;
      }
    } else {
      break moderator;
    }

    const theme = message.split(' ')[1];

    // Verify that the extension isn't already installed
    // If the extension is installed, send a message to chat
    // and return.
    const ithemes = this._availableThemes.filter((value: ITheme) => value.extensionId.toLocaleLowerCase() === theme.toLocaleLowerCase());
    if (ithemes.length > 0) {
      const uniqueThemeLabels = Array.from(new Set(ithemes.map(t => t.label)));
      const msg = `@${user}, '${theme}' is already installed. To switch to it, send: !theme ${uniqueThemeLabels.join(' -or- !theme ')}`;
      this.sendMessageEventEmitter.fire(msg);
      return;
    }

    // Verify that the extension exists
    const isValidExtResult = await API.isValidExtensionName(theme, this.logger);
    if (!isValidExtResult.available) {
      // Handle non-existing extension
      if (isValidExtResult.reason) {
        switch (isValidExtResult.reason) {
          case ThemeNotAvailableReasons.notFound:
            this.logger.error(`The requested theme could not be found in the marketplace.`);
            break;
          case ThemeNotAvailableReasons.noRepositoryFound:
            this.logger.error(`The requested theme does not include a public repository.`);
            break;
          case ThemeNotAvailableReasons.packageJsonNotDownload:
            this.logger.error(`The requested theme's package.json could not be downloaded.`);
            break;
          case ThemeNotAvailableReasons.packageJsonMalformed:
            this.logger.error(`The requested theme's package.json could not be parsed.`);
            break;
          case ThemeNotAvailableReasons.noThemesContributed:
            this.logger.error(`The requested theme extension does not contribute any themes.`);
            break;
          default:
            this.logger.error(`The requested theme could not be downloaded. Unknown reason.`);
            break;
        }
      }
      return;
    }

    try {
      // Authorize the install of the extension if we do not allow for auto-installed extensions.
      if (!this._autoInstall) {
        const msg = `${user} wants to install theme(s) ${isValidExtResult.label ? isValidExtResult.label.join(', ') : theme}.`;
        this.logger.log(`${msg}`);
        let choice = await vscode.window.showInformationMessage(msg, 'Accept', 'Deny', 'Preview');
        switch (choice) {
          case 'Preview':
            // Open marketplace
            vscode.env.openExternal(vscode.Uri.parse(`https://marketplace.visualstudio.com/items?itemName=${theme}`));
            choice = await vscode.window.showInformationMessage(msg, 'Accept', 'Deny');
            if (choice === 'Deny') {
              this.logger.log(`User denied installing theme(s).`);
              return;
            }
            break;
          case 'Deny':
            this.logger.log(`User denied installing theme(s).`);
            return;
        }
      }

      // Install the theme
      this.logger.log('Installing theme...');
      await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        theme
      );
      this.logger.log('Theme extension install request complete.');

      const msg = `@${user}, the theme(s) '${isValidExtResult.label!.join(', ')}' were installed successfully.`;
      this.sendMessageEventEmitter.fire(msg);
    }
    catch (err) {
      // Handle the error
      this.logger.error(err);
      return;
    }
  }

  /**
   * Changes the theme to a random option from all available themes
   * @param twitchUser - pass through twitch user state
   * @param message - message sent via chat
   */
  private async randomTheme(user: string, userId: string, onMessageFlags: OnMessageFlags, message: string) {

    const currentTheme = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme');

    const params = message.split(' ');
    let filter: number = 0;
    if (params.length > 1) {
      switch (params[1].toLocaleLowerCase()) {
        case this._commands['dark']:
          filter = 1;
          break;
        case this._commands['light']:
          filter = 2;
          break;
        default:
          break;
      }
    }

    const themes = this._availableThemes.filter(f => {
      switch (filter) {
        case 1:
          return f.isDark && f.label !== currentTheme && f.themeId !== currentTheme;
        case 2:
          return !f.isDark && f.label !== currentTheme && f.themeId !== currentTheme;
        default:
          return true && f.label !== currentTheme && f.themeId !== currentTheme;
      }
    });

    if (themes.length > 0) {
      const max = themes.length;
      const randomNumber = Math.floor(Math.random() * max);
      const chosenTheme = themes[randomNumber].label;
      await this.changeTheme(user, userId, onMessageFlags, chosenTheme);
    }
  }

  /**
   * Changes the active theme to the one specified
   * @param twitchUser - User state of who requested the theme be applied
   * @param themeName - Name of the theme to be applied
   */
  private async changeTheme(user: string, userId: string, onMessageFlags: OnMessageFlags, themeName: string) {
    let userAccessState = AccessState.Viewers;
    const userLevel = this.getUserLevel(onMessageFlags);

    if (userLevel === UserLevel.broadcaster) {
      userAccessState = AccessState.Broadcaster;
    } else if (userLevel === UserLevel.moderator) {
      userAccessState = AccessState.Moderators;
    } else if (userLevel === UserLevel.vip) {
      userAccessState = AccessState.VIPs;
    } else if (onMessageFlags.subscriber) {
      userAccessState = AccessState.Subscribers;
    } else if (this._followers.find(x => x.username === user.toLocaleLowerCase())) {
      userAccessState = AccessState.Followers;
    } else if (await API.isTwitchUserFollowing(userId.toLocaleLowerCase(), this.logger)) {
      this._followers.push({ username: user.toLocaleLowerCase() });
      userAccessState = AccessState.Followers;
    }
    if (userAccessState < this._accessState) {
      return;
    }

    /** Ensure the user hasn't been banned before changing the theme */
    if (this.isBanned(user)) {
      return;
    }

    /** Find theme based on themeName and change theme if it is found */
    const theme = this._availableThemes.filter(
      f =>
        f.label.toLocaleLowerCase() === themeName.toLocaleLowerCase() ||
        (f.themeId &&
          f.themeId.toLocaleLowerCase() === themeName.toLocaleLowerCase())
    )[0];

    if (theme) {

      if (this._pauseThemer) {
        this.sendMessageEventEmitter.fire(
          `${user}, theme changes are paused. Please try again in a few minutes.`
        );
      } else {
        await this.setTheme(user, theme);

        if (onMessageFlags.customReward) {
          // start a "pause" timer 
          this.setPauseStatus(true);
          this.sendMessageEventEmitter.fire(
            `${user} has redeemed pausing the theme on ${themeName} for ${this._redemptionHoldPeriodMinutes} minute${(this._redemptionHoldPeriodMinutes === 1 ? '' : 's')}.`
          );
          setTimeout(() => {
            this.setPauseStatus(false);
            this.sendMessageEventEmitter.fire(
              `Twitch Themer has resumed listening for requests.`
            );
          }, this._redemptionHoldPeriodMinutes * 60000);
        }
      }

    } else {
      this.sendMessageEventEmitter.fire(
        `${user}, ${themeName} is not a valid theme name or \
        isn't installed.  You can use !theme to get a list of available themes.`
      );
    }
  }

  private async setTheme(user: string, theme: ITheme) {
    const themeExtension = vscode.extensions.getExtension(theme.extensionId);

    if (themeExtension !== undefined) {
      const conf = vscode.workspace.getConfiguration();
      await themeExtension.activate().then(async f => {
        await conf.update(
          'workbench.colorTheme',
          theme.themeId || theme.label,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `Theme changed to ${theme.label} by ${user}`
        );
      });
    }
  }

  /**
   * Announces to chat the currently active theme
   */
  private async currentTheme() {
    const currentTheme = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme');
    this.sendMessageEventEmitter.fire(`The current theme is ${currentTheme}`);
  }

  /**
   * Announces to chat info about the extensions GitHub repository
   */
  private async repo() {
    const repoMessage = 'You can find the source code for this VS \
        Code extension at https://github.com/builders-club/vscode-twitch-themer . \
        Feel free to fork & contribute.';
    this.sendMessageEventEmitter.fire(repoMessage);
  }

  /**
   * Announces to chat a message with a brief explanation of how to use the commands
   */
  private async help() {
    const helpMessage: string = `You can change the theme of the stream's VS\
              Code by sending '!theme random'. You can also choose a theme\
              specifically. Send '!theme' to be whispered a list of available\
              themes.`;
    this.sendMessageEventEmitter.fire(helpMessage);
  }

  /**
   * Clears the list of recipients so they can request the list of themes again
   */
  private clearListRecipients() {
    this._listRecipients = [];
  }
}
