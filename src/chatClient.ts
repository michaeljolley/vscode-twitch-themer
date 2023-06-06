import * as vscode from "vscode";
import {
  ComfyJSInstance,
  OnCommandExtra,
  OnJoinExtra,
  OnMessageExtra,
  OnMessageFlags,
  OnRewardExtra,
} from "comfy.js";
import {
  EventEmitter,
  Memento,
  workspace,
  WorkspaceConfiguration,
} from "vscode";
import Logger from "./logger";
import { ChatMessage } from "./types/chatMessage";
import { ExtensionKeys, LogLevel } from "./constants";
import Authentication from "./authentication";

const comfyJS: ComfyJSInstance = require("comfy.js");

/**
 * Twitch chat client used in communicating via chat/whispers
 */
export default class ChatClient {
  private chatClientMessageEventEmitter = new EventEmitter<ChatMessage>();
  private chatClientConnectionEventEmitter = new EventEmitter<boolean>();
  private _commandTrigger: string = "theme";
  private _redemptionHoldId: string = "";

  /** Event that fires when an appropriate message is received */
  public onChatMessageReceived = this.chatClientMessageEventEmitter.event;

  /** Event that fires when the connection status of the chat client changes */
  public onConnectionChanged = this.chatClientConnectionEventEmitter.event;

  /**
   * constructor
   * @param _state - The global state of the extension
   */
  constructor(private _state: Memento) {
    this.initializeConfiguration();
  }

  public initializeConfiguration() {
    const configuration: WorkspaceConfiguration =
      workspace.getConfiguration("twitchThemer");
    this._commandTrigger = configuration.get<string>("themeCommand") || "theme";

    /**
     * Gets the point redemption id from the workspace
     */
    this._redemptionHoldId = vscode.workspace
      .getConfiguration()
      .get("twitchThemer.redemptionHoldId", "");
  }

  /**
   * Connects to Twitch chat
   */
  private async connect() {
    Logger.log(LogLevel.info, "Connecting to Twitch...");
    if (!this.isConnected()) {
      const accessToken = this._state.get(ExtensionKeys.account) as
        | string
        | null;
      const authUserLogin = this._state.get(ExtensionKeys.userLogin) as
        | string
        | null;

      if (authUserLogin && accessToken) {
        comfyJS.onError = (err: string) => {
          Logger.log(LogLevel.error, err);
        };

        comfyJS.onChat = this.onChatHandler.bind(this);
        comfyJS.onCommand = this.onCommandHandler.bind(this);
        comfyJS.onJoin = this.onJoinHandler.bind(this);
        comfyJS.onConnected = this.onConnectedHandler.bind(this);

        comfyJS.Init(authUserLogin, accessToken, authUserLogin);

        this.chatClientConnectionEventEmitter.fire(true);
        return true;
      }
    }
  }

  /**
   * Disconnects from Twitch chat
   */
  public async disconnect() {
    if (this.isConnected()) {
      this.sendMessage("Twitch Themer has left the building!");

      comfyJS.Disconnect();
      Logger.log(LogLevel.info, "Disconnected from chat.");
      this.chatClientConnectionEventEmitter.fire(false);
    }
  }

  /**
   * Toggles whether the person is connected to Twitch chat
   */
  public async toggleChat(): Promise<void> {
    const accessToken = this._state.get(ExtensionKeys.account) as string | null;
    const authUserLogin = this._state.get(ExtensionKeys.userLogin) as
      | string
      | null;

    if (!accessToken || !authUserLogin) {
      let choice = await vscode.window.showInformationMessage(
        "You must be signed in to Twitch to connect to Twitch chat. Sign in now?",
        "Sign In",
        "Cancel"
      );
      switch (choice) {
        case "Sign In":
          await Authentication.handleSignIn();
          break;
        case "Cancel":
          Logger.log(LogLevel.info, `User decided to not log in to Twitch`);
          return;
      }
      return;
    }

    if (this.isConnected()) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  /** Is the client currently connected to Twitch chat */
  public isConnected(): boolean {
    const client = comfyJS.GetClient();
    return client ? client.readyState() === "OPEN" : false;
  }

  private onConnectedHandler(address: string, port: number) {
    Logger.log(LogLevel.info, `Connected chat client ${address} : ${port}`);
  }

  private onJoinHandler(user: string, self: boolean, extra: OnJoinExtra) {
    if (self) {
      this.sendMessage(
        `Twitch Themer is ready to go. Listening for commands beginning with !${this._commandTrigger}`
      );
    }
  }

  /**
   * Sends a message to Twitch chat
   * @param message - Message to send to chat
   */
  public async sendMessage(message: string) {
    const authUserLogin = this._state.get(ExtensionKeys.userLogin) as
      | string
      | null;

    if (this.isConnected() && authUserLogin) {
      comfyJS.Say(message, authUserLogin);
    }
  }

  private async onCommandHandler(
    user: string,
    command: string,
    message: string,
    flags: OnMessageFlags,
    extra: OnCommandExtra
  ) {
    Logger.log(LogLevel.info, `Received ${message} from ${user}`);

    if (command !== this._commandTrigger) {
      return;
    }

    if (extra.customRewardId) {
      Logger.log(LogLevel.info, `Received custom reward ${extra.customRewardId} from ${user}`);
    }

    message = message.toLocaleLowerCase().trim();
    this.chatClientMessageEventEmitter.fire({
      user,
      message,
      flags,
      extra,
    });
  }

  private async onChatHandler(
    user: string,
    message: string,
    flags: OnMessageFlags,
    self: boolean,
    extra: OnMessageExtra
  ) {
    Logger.log(LogLevel.info, `Received ${message} from ${user}`);
    if (!message || this._redemptionHoldId.length === 0) {
      return;
    }

    if (extra.customRewardId) {
      Logger.log(LogLevel.info, `Received custom reward ${extra.customRewardId} from ${user}`);
    }

    // Ensure this message is a point redemption and matches
    // our point redemption Id
    if (
      !flags.customReward ||
      extra.customRewardId !== this._redemptionHoldId
    ) {
      return;
    }

    message = message.toLocaleLowerCase().trim();
    const onCommandExtra: OnCommandExtra = {
      ...extra,
      ...{
        sinceLastCommand: {
          any: 0,
          user: 0,
        },
        messageEmotes: {},
      },
    };

    this.chatClientMessageEventEmitter.fire({
      user,
      message: message.toLowerCase().replace("!theme ", ""),
      flags,
      extra: onCommandExtra,
    });
  }
}
