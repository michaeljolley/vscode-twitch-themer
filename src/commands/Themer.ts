import * as vscode from 'vscode';
import { Userstate } from 'tmi.js';
import { IListRecipient } from './IListRecipient';
import { ITheme } from './ITheme';
import { IWhisperMessage } from '../chat/IWhisperMessage';
import { keytar } from '../Common';
import { KeytarKeys, AccessState, UserLevel, ThemeNotAvailableReasons } from '../Enum';
import { API } from '../api/API';
import { IChatMessage } from '../chat/IChatMessage';
import { Logger } from '../Logger';
import { LogLevel } from '../Enum';

/**
 * Manages all logic associated with retrieveing themes,
 * changing themes, etc.
 */
export class Themer {
  private _accessState: AccessState = AccessState.Viewers;
  private _installState: AccessState = AccessState.Followers;
  private _autoInstall: boolean = false;
  private _originalTheme: string | undefined;
  private _availableThemes: Array<ITheme> = [];
  private _listRecipients: Array<IListRecipient> = [];
  private _followers: Array<IListRecipient> = [];
  private _currentUserLogin: string | undefined;

  private sendWhisperEventEmitter = new vscode.EventEmitter<IWhisperMessage>();
  private sendMessageEventEmitter = new vscode.EventEmitter<string>();

  /** Event that fires when themer needs to send a whisper */
  public onSendWhisper = this.sendWhisperEventEmitter.event;

  /** Event that fires when themer needs to send a message */
  public onSendMesssage = this.sendMessageEventEmitter.event;

  /**
   * constructor
   * @param _state - The global state of the extension
   * @param logger - The logger used when logging events
   */
  constructor(private _state: vscode.Memento, private logger: Logger) {
    /**
     * Get the current theme so we can reset it later
     * via command or when disconnecting from chat
     */
    this._originalTheme = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme');

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

  public async handleAuthStatusChanged(signedIn: boolean) {
    if (signedIn) {
      if (keytar) {
        const login = await keytar.getPassword(
          KeytarKeys.service,
          KeytarKeys.userLogin
        );
        this._currentUserLogin = login ? login : undefined;
        const tempUserState: Userstate = {
          username: this._currentUserLogin,
          'display-name': this._currentUserLogin,
          badges: { broadcaster: '1' }
        };
        this.refreshThemes(tempUserState);
      }
    } else {
      const tempUserState: Userstate = {
        username: this._currentUserLogin,
        'display-name': this._currentUserLogin,
        badges: { broadcaster: '1' }
      };
      this._currentUserLogin = undefined;
      this.resetTheme(tempUserState);
    }
  }

  public async handleChatConnectionChanged(signedIn: boolean) {
    if (signedIn) {
      if (keytar) {
        const login = await keytar.getPassword(
          KeytarKeys.service,
          KeytarKeys.userLogin
        );
        this._currentUserLogin = login ? login : undefined;
        const tempUserState: Userstate = {
          username: this._currentUserLogin,
          'display-name': this._currentUserLogin,
          badges: { broadcaster: '1' }
        };
        this.refreshThemes(tempUserState);
      }
    } else {
      const tempUserState: Userstate = {
        username: this._currentUserLogin,
        'display-name': this._currentUserLogin,
        badges: { broadcaster: '1' }
      };
      this.resetTheme(tempUserState);
    }
  }

  /**
   * Updates access state of extension
   * @param accessState - New access state
   */
  public handleAccessStateChanged(accessState: AccessState) {
    this._accessState = accessState;
  }

  private getUserLevel(userState: Userstate): UserLevel {
    if (userState.badges) {
      if (userState.badges.broadcaster) {
        return UserLevel.broadcaster;
      } else if (userState.badges.moderator) {
        return UserLevel.moderator;
      }
    }

    return UserLevel.viewer;
  }

  /**
   * Attempts to process commands received by users in Twitch chat
   * @param chatMessage - User & message received from Twitch
   */
  public async handleCommands(chatMessage: IChatMessage) {
    const twitchUser: Userstate = chatMessage.userState;
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
        await this.sendThemes(twitchUser);
        break;
      case 'current':
        await this.currentTheme();
        break;
      case 'reset':
        await this.resetTheme(twitchUser);
        break;
      case 'random':
        await this.randomTheme(twitchUser, message);
        break;
      case 'help':
        await this.help();
        break;
      case 'refresh':
        await this.refreshThemes(twitchUser);
        break;
      case 'repo':
        await this.repo();
        break;
      case "install":
        await this.installTheme(twitchUser, message);
        break;  
      case 'ban':
        if (username !== undefined) {
          await this.ban(twitchUser, username);
        }
        break;
      case '!ban':
        if (username !== undefined) {
          await this.unban(twitchUser, username);
        }
        break;
      default:
        await this.changeTheme(twitchUser, message);
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
   * @param twitchUser The user requesting the ban
   * @param username The user to ban
   */
  private async ban(twitchUser: Userstate, username: string) {
    if (this.getUserLevel(twitchUser) > UserLevel.viewer) {
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
   * @param twitchUser The user requesting the unban
   * @param username The user to unban
   */
  private async unban(twitchUser: Userstate, username: string) {
    if (this.getUserLevel(twitchUser) > UserLevel.viewer) {
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
   * @param twitchUser - User that will receive whisper of available themes
   */
  private async sendThemes(twitchUser: Userstate) {
    const twitchUserName: string = twitchUser.username.toLocaleLowerCase();

    /** Ensure that we haven't sent them the list recently. */
    const lastSent = this.getRecipient(twitchUserName);

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
        username: twitchUserName,
        lastSent: new Date()
      });
    }

    /** Get list of available themes and whisper them to user */
    const themeNames = this._availableThemes.map(m => m.label);

    let message = "Available themes are: ";
    /** Iterate over the themme names and add to the message
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
        user: twitchUserName,
        message: message.replace(/(^[,\s]+)|([,\s]+$)/g, '')
      });
      message = `${name}, `;
    }
  };

  /** Send the final message */
  this.sendWhisperEventEmitter.fire({
        user: twitchUserName,
        message: message.replace(/(^[,\s]+)|([,\s]+$)/g, '')
      });
  }

  /**
   * Resets the theme to the one that was active when the extension was loaded
   * @param twitchUser - pass through the twitch user state
   */
  public async resetTheme(twitchUser: Userstate) {
    if (this._originalTheme) {
      await this.changeTheme(twitchUser, this._originalTheme);
    }
  }

  /**
   * Refreshes the list of available themes
   * @param twitchUser - Userstate of user requesting to refresh the theme list
   */
  private async refreshThemes(twitchUser: Userstate) {
    /** We only refresh the list of themes
     * if the requester was a moderator/broadcaster
     */
    if (this.getUserLevel(twitchUser) > UserLevel.viewer) {
      this.loadThemes();
    }
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

  private isBanned(twitchUserName: string): boolean {
    if (twitchUserName) {
      const recipient = this.getRecipient(twitchUserName, true);
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
  private async installTheme(twitchUser: Userstate, message: string): Promise<void> {
    const twitchUserName: string = twitchUser.username;
    const twitchDisplayName: string = twitchUser['display-name']
      ? twitchUser['display-name']
      : twitchUserName;
    
    /** Ensure the user hasn't been banned before installing the theme */
    if (this.isBanned(twitchUserName)) {
      return;
    }

    following: if (this._installState === AccessState.Followers) {
      if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
        break following;
      } else if (
        this._followers.find(
          x => x.username === twitchUserName.toLocaleLowerCase()
        )
      ) {
        break following;
      } else if (
        twitchUser &&
        (await API.isTwitchUserFollowing(twitchUser['user-id'], this.logger))
      ) {
        this._followers.push({
          username: twitchUserName ? twitchUserName.toLocaleLowerCase() : ''
        });
        break following;
      } else {
        return;
      }
    } else {
      break following;
    }

    subscriber: if (this._installState === AccessState.Subscribers) {
      if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
        break subscriber;
      } else if (twitchUser && twitchUser['subscriber']) {
        break subscriber;
      } else {
        return;
      }
    } else {
      break subscriber;
    }

    moderator: if (this._installState === AccessState.Subscribers) {
      if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
        break moderator;
      } else if (twitchUser && twitchUser['subscriber']) {
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
    if (ithemes.length > 0)
    {
      const uniqueThemeLabels = Array.from(new Set(ithemes.map(t => t.label)));
      const msg = `@${twitchDisplayName}, '${theme}' is already installed. To switch to it, send: !theme ${uniqueThemeLabels.join(' -or- !theme ')}`;
      this.sendMessageEventEmitter.fire(msg);
      return;
    }

    // Verify that the extension exists
    const isValidExtResult = await API.isValidExtensionName(theme);
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
        const msg = `${twitchDisplayName} wants to install theme(s) ${isValidExtResult.label ? isValidExtResult.label.join(', ') : theme}.`;
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

      const msg = `@${twitchDisplayName}, the theme(s) '${isValidExtResult.label!.join(', ')}' were installed successfully.`;
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
  private async randomTheme(twitchUser: Userstate, message: string) {

    const currentTheme = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme');

    const params = message.split(' ');
    let filter: number = 0;
    if (params.length > 1) {
      switch (params[1].toLocaleLowerCase()) {
        case 'dark':
          filter = 1;
          break;
        case 'light':
          filter = 2;
          break;
        default:
          break;
      }
    }

    const themes = this._availableThemes.filter(f => {
      switch(filter) {
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
      await this.changeTheme(twitchUser, chosenTheme);
    }
  }

  /**
   * Changes the active theme to the one specified
   * @param twitchUser - User state of who requested the theme be applied
   * @param themeName - Name of the theme to be applied
   */
  private async changeTheme(twitchUser: Userstate, themeName: string) {
    const twitchUserName: string = twitchUser.username;
    const twitchDisplayName: string = twitchUser['display-name']
      ? twitchUser['display-name']
      : twitchUserName;

    following: if (this._accessState === AccessState.Followers) {
      if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
        break following;
      } else if (
        this._followers.find(
          x => x.username === twitchUserName.toLocaleLowerCase()
        )
      ) {
        break following;
      } else if (
        twitchUser &&
        (await API.isTwitchUserFollowing(twitchUser['user-id'], this.logger))
      ) {
        this._followers.push({
          username: twitchUserName ? twitchUserName.toLocaleLowerCase() : ''
        });
        break following;
      } else {
        return;
      }
    } else {
      break following;
    }

    subscriber: if (this._accessState === AccessState.Subscribers) {
      if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
        break subscriber;
      } else if (twitchUser && twitchUser['subscriber']) {
        break subscriber;
      } else {
        return;
      }
    } else {
      break subscriber;
    }

    /** Ensure the user hasn't been banned before changing the theme */
    if (this.isBanned(twitchUserName)) {
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
            `Theme changed to ${theme.label} by ${twitchDisplayName}`
          );
        });
      }
    } else {
      this.sendMessageEventEmitter.fire(
        `${twitchDisplayName}, ${themeName} is not a valid theme name or \
        isn't installed.  You can use !theme to get a list of available themes.`
      );
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
        Code extension at https://github.com/MichaelJolley/vscode-twitch-themer. \
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
