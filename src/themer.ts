import * as vscode from "vscode";
import { OnMessageFlags } from "comfy.js";
import API from "./api";
import Logger from "./logger";
import { ListRecipient } from "./types/listRecipient";
import { Theme } from "./types/theme";
import {
  AccessState,
  ThemeNotAvailableReasons,
  LogLevel,
  messageHelp,
  messageRepo,
  messageCurrent,
  messageInvalidTheme,
  messageOnPaused,
  messagePaused,
  messageInstalled,
  messageThemeExists,
} from "./constants";
import { ChatMessage } from "./types/chatMessage";
import { Command } from "./types/command";

/**
 * Manages all logic associated with retrieving themes,
 * changing themes, etc.
 */
export default class Themer {
  private _accessState: AccessState = AccessState.viewer;
  private _installState: AccessState = AccessState.follower;
  private _autoInstall: boolean = false;
  private _originalTheme: Theme | undefined;
  private _availableThemes: Array<Theme> = [];
  private _listRecipients: Array<ListRecipient> = [];
  private _followers: Array<ListRecipient> = [];
  private _commands: Command = {};
  private _redemptionHoldId: string = "";
  private _redemptionHoldPeriodMinutes: number = 5;
  private _pauseThemer: boolean = false;

  private sendMessageEventEmitter = new vscode.EventEmitter<string>();

  /** Event that fires when themer needs to send a message */
  public onSendMessage = this.sendMessageEventEmitter.event;

  /**
   * constructor
   * @param _state - The global state of the extension
   * @param logger - The logger used when logging events
   */
  constructor(private _state: vscode.Memento) {
    /**
     * Gather command names from the extension settings
     */
    this.initializeConfiguration();

    /**
     * Initialize the list of available themes for users
     */
    this.loadThemes();

    /**
     * Get the current theme so we can reset it later
     * via command or when disconnecting from chat
     */
    const theme: string =
      vscode.workspace.getConfiguration().get("workbench.colorTheme") ||
      "Visual Studio Dark+";

    this._originalTheme = this._availableThemes.filter(
      (f) =>
        f.label.toLocaleLowerCase() === theme.toLocaleLowerCase() ||
        (f.themeId &&
          f.themeId.toLocaleLowerCase() === theme.toLocaleLowerCase())
    )[0];

    /**
     * Rehydrate the banned users from the extensions global state
     */
    this._state
      .get("bannedUsers", [])
      .forEach((username) =>
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

  public initializeConfiguration() {
    const configuration = vscode.workspace.getConfiguration("twitchThemer");
    this._commands["install"] =
      configuration.get<string>("installCommand") || "install";
    this._commands["current"] =
      configuration.get<string>("currentCommand") || "current";
    this._commands["help"] = configuration.get<string>("helpCommand") || "help";
    this._commands["random"] =
      configuration.get<string>("randomCommand") || "random";
    this._commands["dark"] = configuration.get<string>("darkCommand") || "dark";
    this._commands["light"] =
      configuration.get<string>("lightCommand") || "light";
    this._commands["refresh"] =
      configuration.get<string>("refreshCommand") || "refresh";
    this._commands["repo"] = configuration.get<string>("repoCommand") || "repo";
    this._commands["ban"] = configuration.get<string>("banCommand") || "ban";
    this._redemptionHoldPeriodMinutes =
      configuration.get<number>("redemptionHoldPeriodMinutes") || 5;
    this._redemptionHoldId = vscode.workspace
      .getConfiguration()
      .get("twitchThemer.redemptionHoldId", "");

    /**
     * Get the configuration to auto-install or not
     */
    this._autoInstall =
      vscode.workspace
        .getConfiguration()
        .get<boolean>("twitchThemer.autoInstall") || false;

    /**
     * Gets the access state from the workspace
     */
    this._accessState = vscode.workspace
      .getConfiguration()
      .get("twitchThemer.accessState", AccessState.viewer);
  }

  public handleConnectionChanges(signedIn: boolean) {
    if (signedIn) {
      this.loadThemes();
    } else {
      if (this._originalTheme) {
        this.setTheme("Themer", this._originalTheme);
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

  private getUserLevel(onMessageFlags: OnMessageFlags): AccessState {
    // eslint-disable-next-line curly
    if (onMessageFlags.broadcaster) return AccessState.broadcaster;
    // eslint-disable-next-line curly
    if (onMessageFlags.mod) return AccessState.moderator;
    // eslint-disable-next-line curly
    if (onMessageFlags.vip) return AccessState.vip;
    // eslint-disable-next-line curly
    if (onMessageFlags.subscriber) return AccessState.subscriber;
    return AccessState.viewer;
  }

  /**
   * Attempts to process commands received by users in Twitch chat
   * @param chatMessage - User & message received from Twitch
   */
  public async handleCommands(chatMessage: ChatMessage) {
    let message: string = chatMessage.message.replace(",", "");

    let username: string | undefined;

    /** Determine if the param is a (un)ban request */
    const ban = message.match(/((?:!)?ban) (\w*)/);
    if (ban) {
      message = ban[1] || ""; // Change the param to 'ban' or 'unban'
      username = ban[2]; // The username to ban
    }

    const params: string[] = message.split(" ");
    let command: string = "";
    if (params.length > 0) {
      command = params[0];
    }

    Logger.log(
      LogLevel.info,
      `Executing command: '${command === "" ? "help" : command}'`
    );

    switch (command) {
      case "":
        await this.help();
        break;
      case this._commands["current"]:
        await this.currentTheme();
        break;
      case this._commands["reset"]:
        await this.resetTheme(
          chatMessage.user,
          chatMessage.extra.userId,
          chatMessage.flags
        );
        break;
      case this._commands["random"]:
        await this.randomTheme(
          chatMessage.user,
          chatMessage.extra.userId,
          chatMessage.flags,
          chatMessage.message
        );
        break;
      case this._commands["help"]:
        await this.help();
        break;
      case this._commands["refresh"]:
        await this.refreshThemes(chatMessage.flags);
        break;
      case this._commands["repo"]:
        await this.repo();
        break;
      case this._commands["install"]:
        await this.installTheme(
          chatMessage.user,
          chatMessage.extra.userId,
          chatMessage.flags,
          chatMessage.message
        );
        break;
      case this._commands["ban"]:
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
        await this.changeTheme(
          chatMessage.user,
          chatMessage.extra.userId,
          chatMessage.flags,
          message,
          chatMessage.extra.customRewardId
        );
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
  ): ListRecipient | undefined {
    return this._listRecipients.filter(
      (f) =>
        f.username.toLocaleLowerCase() === twitchUser.toLocaleLowerCase() &&
        f.banned === banned
    )[0];
  }

  /**
   * Updates the state of the extension
   */
  private updateState() {
    const bannedUsers = this._listRecipients
      .filter((recipient) => recipient.banned && recipient.banned === true)
      .map((recipient) => recipient.username);

    this._state.update("bannedUsers", bannedUsers);
  }

  /**
   * Bans a user from using the themer plugin.
   * @param onMessageFlags The user requesting the ban
   * @param username The user to ban
   */
  private async ban(onMessageFlags: OnMessageFlags, username: string) {
    if (this.getUserLevel(onMessageFlags) > AccessState.viewer) {
      const recipient = this.getRecipient(username);
      if (recipient === undefined) {
        this._listRecipients.push({
          username: username.toLocaleLowerCase(),
          banned: true,
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
    if (this.getUserLevel(onMessageFlags) > AccessState.viewer) {
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
   * Resets the theme to the one that was active when the extension was loaded
   * @param twitchUser - pass through the twitch user state
   */
  public async resetTheme(
    user: string,
    userId: string,
    onMessageFlags: OnMessageFlags
  ) {
    if (this._originalTheme) {
      await this.changeTheme(
        user,
        userId,
        onMessageFlags,
        this._originalTheme.label
      );
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
    if (this.getUserLevel(onMessageFlags) > AccessState.viewer) {
      this.loadThemes();
    }
  }

  private async loadThemes() {
    vscode.extensions.all
      .filter(
        (f) =>
          f.packageJSON.contributes &&
          f.packageJSON.contributes.themes &&
          f.packageJSON.contributes.themes.length > 0
      )
      .forEach((fe: any) => {
        const iThemes = fe.packageJSON.contributes.themes.map((m: any) => {
          return {
            extensionId: fe.id,
            label: m.label,
            themeId: m.id,
            isDark: m.uiTheme !== "vs",
          };
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
      const recipient = this.getRecipient(
        twitchUserName.toLocaleLowerCase(),
        true
      );
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
  private async installTheme(
    user: string,
    userId: string,
    onMessageFlags: OnMessageFlags,
    message: string
  ): Promise<void> {
    /** Ensure the user hasn't been banned before installing the theme */
    if (this.isBanned(user)) {
      return;
    }

    following: if (this._installState === AccessState.follower) {
      if (this.getUserLevel(onMessageFlags) === AccessState.broadcaster) {
        break following;
      } else if (
        this._followers.find((x) => x.username === user.toLocaleLowerCase())
      ) {
        break following;
      } else if (await API.isTwitchUserFollowing(userId)) {
        this._followers.push({
          username: user.toLocaleLowerCase(),
        });
        break following;
      } else {
        return;
      }
    } else {
      break following;
    }

    subscriber: if (this._installState === AccessState.subscriber) {
      if (this.getUserLevel(onMessageFlags) === AccessState.broadcaster) {
        break subscriber;
      } else if (onMessageFlags.subscriber) {
        break subscriber;
      } else {
        return;
      }
    } else {
      break subscriber;
    }

    moderator: if (this._installState === AccessState.subscriber) {
      if (this.getUserLevel(onMessageFlags) === AccessState.broadcaster) {
        break moderator;
      } else if (onMessageFlags.mod) {
        break moderator;
      } else {
        return;
      }
    } else {
      break moderator;
    }

    const theme = message.split(" ")[1];

    // Verify that the extension isn't already installed
    // If the extension is installed, send a message to chat
    // and return.
    const themes = this._availableThemes.filter(
      (value: Theme) =>
        value.extensionId.toLocaleLowerCase() === theme.toLocaleLowerCase()
    );
    if (themes.length > 0) {
      const uniqueThemeLabels = Array.from(new Set(themes.map((t) => t.label)));
      this.sendMessageEventEmitter.fire(messageThemeExists(user, theme, uniqueThemeLabels));
      return;
    }

    // Verify that the extension exists
    const isValidExtResult = await API.isValidExtensionName(theme);
    if (!isValidExtResult.available) {
      // Handle non-existing extension
      if (isValidExtResult.reason) {
        switch (isValidExtResult.reason) {
          case ThemeNotAvailableReasons.notFound:
            Logger.log(
              LogLevel.error,
              `The requested theme could not be found in the marketplace.`
            );
            break;
          case ThemeNotAvailableReasons.noRepositoryFound:
            Logger.log(
              LogLevel.error,
              `The requested theme does not include a public repository.`
            );
            break;
          case ThemeNotAvailableReasons.packageJsonNotDownloaded:
            Logger.log(
              LogLevel.error,
              `The requested theme's package.json could not be downloaded.`
            );
            break;
          case ThemeNotAvailableReasons.packageJsonMalformed:
            Logger.log(
              LogLevel.error,
              `The requested theme's package.json could not be parsed.`
            );
            break;
          case ThemeNotAvailableReasons.noThemesContributed:
            Logger.log(
              LogLevel.error,
              `The requested theme extension does not contribute any themes.`
            );
            break;
          default:
            Logger.log(
              LogLevel.error,
              `The requested theme could not be downloaded. Unknown reason.`
            );
            break;
        }
      }
      return;
    }

    try {
      // Authorize the install of the extension if we do not allow for auto-installed extensions.
      if (!this._autoInstall) {
        const msg = `${user} wants to install theme(s) ${isValidExtResult.label ? isValidExtResult.label.join(", ") : theme
          }.`;
        Logger.log(LogLevel.info, `${msg}`);
        let choice = await vscode.window.showInformationMessage(
          msg,
          "Accept",
          "Deny",
          "Preview"
        );
        switch (choice) {
          case "Preview":
            // Open marketplace
            vscode.env.openExternal(
              vscode.Uri.parse(
                `https://marketplace.visualstudio.com/items?itemName=${theme}`
              )
            );
            choice = await vscode.window.showInformationMessage(
              msg,
              "Accept",
              "Deny"
            );
            if (choice === "Deny") {
              Logger.log(LogLevel.info, `User denied installing theme(s).`);
              return;
            }
            break;
          case "Deny":
            Logger.log(LogLevel.info, `User denied installing theme(s).`);
            return;
        }
      }

      // Install the theme
      Logger.log(LogLevel.info, "Installing theme...");
      await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        theme
      );
      Logger.log(LogLevel.info, "Theme extension install request complete.");

     
      this.sendMessageEventEmitter.fire(messageInstalled(user, isValidExtResult.label || []));
    } catch (err: any) {
      // Handle the error
      Logger.log(LogLevel.error, err);
      return;
    }
  }

  /**
   * Changes the theme to a random option from all available themes
   * @param twitchUser - pass through twitch user state
   * @param message - message sent via chat
   */
  private async randomTheme(
    user: string,
    userId: string,
    onMessageFlags: OnMessageFlags,
    message: string
  ) {
    const currentTheme = vscode.workspace
      .getConfiguration()
      .get("workbench.colorTheme");

    const params = message.split(" ");
    let filter: number = 0;
    if (params.length > 1) {
      switch (params[1].toLocaleLowerCase()) {
        case this._commands["dark"]:
          filter = 1;
          break;
        case this._commands["light"]:
          filter = 2;
          break;
        default:
          break;
      }
    }

    const themes = this._availableThemes.filter((f) => {
      switch (filter) {
        case 1:
          return (
            f.isDark && f.label !== currentTheme && f.themeId !== currentTheme
          );
        case 2:
          return (
            !f.isDark && f.label !== currentTheme && f.themeId !== currentTheme
          );
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
  private async changeTheme(
    user: string,
    userId: string,
    onMessageFlags: OnMessageFlags,
    themeName: string,
    customRewardId?: string
  ) {
    let userAccessState = AccessState.viewer;
    const userLevel = this.getUserLevel(onMessageFlags);

    if (userLevel === AccessState.broadcaster) {
      userAccessState = AccessState.broadcaster;
    } else if (userLevel === AccessState.moderator) {
      userAccessState = AccessState.moderator;
    } else if (userLevel === AccessState.vip) {
      userAccessState = AccessState.vip;
    } else if (onMessageFlags.subscriber) {
      userAccessState = AccessState.subscriber;
    } else if (
      this._followers.find((x) => x.username === user.toLocaleLowerCase())
    ) {
      userAccessState = AccessState.follower;
    } else if (await API.isTwitchUserFollowing(userId)) {
      this._followers.push({ username: user.toLocaleLowerCase() });
      userAccessState = AccessState.follower;
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
      (f) =>
        f.label.toLocaleLowerCase() === themeName.toLocaleLowerCase() ||
        (f.themeId &&
          f.themeId.toLocaleLowerCase() === themeName.toLocaleLowerCase())
    )[0];

    if (theme) {
      if (this._pauseThemer) {
        this.sendMessageEventEmitter.fire(
          messagePaused(user)
        );
      } else {
        await this.setTheme(user, theme);

        if (onMessageFlags.customReward &&
          customRewardId === this._redemptionHoldId) {
          // start a "pause" timer
          this.setPauseStatus(true);
          this.sendMessageEventEmitter.fire(
            messageOnPaused(user, theme.label, this._redemptionHoldPeriodMinutes)
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
       messageInvalidTheme(user, themeName)
      );
    }
  }

  private async setTheme(user: string, theme: Theme) {
    const themeExtension = vscode.extensions.getExtension(theme.extensionId);

    if (themeExtension !== undefined) {
      const conf = vscode.workspace.getConfiguration();
      await themeExtension.activate().then(async (f) => {
        await conf.update(
          "workbench.colorTheme",
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
    const currentThemeName = vscode.workspace
      .getConfiguration()
      .get("workbench.colorTheme") as string;

    /** Find theme based on themeName*/
    const theme = this._availableThemes.filter(
      (f) =>
        f.label.toLocaleLowerCase() === currentThemeName.toLocaleLowerCase() ||
        (f.themeId &&
          f.themeId.toLocaleLowerCase() === currentThemeName.toLocaleLowerCase())
    )[0];

    this.sendMessageEventEmitter.fire(messageCurrent(theme.label, theme.extensionId));
  }

  /**
   * Announces to chat info about the extensions GitHub repository
   */
  private async repo() {
    this.sendMessageEventEmitter.fire(messageRepo);
  }

  /**
   * Announces to chat a message with a brief explanation of how to use the commands
   */
  private async help() {
    this.sendMessageEventEmitter.fire(messageHelp);
  }

  /**
   * Clears the list of recipients so they can request the list of themes again
   */
  private clearListRecipients() {
    this._listRecipients = [];
  }
}
