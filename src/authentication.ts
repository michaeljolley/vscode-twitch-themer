import * as vscode from "vscode";
import Logger from "./logger";
import { LogLevel, twitchScopes } from "./constants";

/**
 * Manages state of current user & authenticating user with Twitch
 */
export default abstract class Authentication {
  private static authStatusEventEmitter = new vscode.EventEmitter<boolean>();

  /** Event that fires on change of the authentication state of the user */
  public static onAuthStatusChanged = this.authStatusEventEmitter.event;

  /**
   * Initializes the authentication service.  If the user is
   * already authenticated it will immediately fire that it is logged in.
   */
  public static async initialize(state: vscode.Memento) {
    Logger.log(LogLevel.info, "Initializing authentication...");

    const twitchSession = await this.getSession();
    if (twitchSession) {
      this.authStatusEventEmitter.fire(true);
      Logger.log(LogLevel.info, "Authenticated with Twitch.");
    } else {
      this.authStatusEventEmitter.fire(false);
      Logger.log(LogLevel.info, "Not authenticated with Twitch.");
    }
  }

  public static async getSession() {
    try {
      return await vscode.authentication.getSession("twitch", twitchScopes, {
        createIfNone: false,
      });
    } catch (error: any) {
      Logger.log(LogLevel.error, error.message);
      throw new Error("awe snap");
    }
  }

  public static async handleSignIn() {
    const result = await this.getSession();
    try {
      if (result) {
        this.authStatusEventEmitter.fire(true);
      }
    } catch (error: any) {
      Logger.log(LogLevel.error, error.message);
      throw new Error("There was an issue signing in to Twitch");
    }
  }
}
