import * as vscode from "vscode";
import { readFileSync } from "fs";
import * as http from "http";
import * as path from "path";
import * as url from "url";
import { v4 } from "uuid";
import API from "./api";
import Logger from "./logger";
import { ExtensionKeys, LogLevel } from "./constants";

/**
 * Manages state of current user & authenticating user with Twitch
 */
export default abstract class Authentication {
  private static authStatusEventEmitter = new vscode.EventEmitter<boolean>();
  private static _state: vscode.Memento;

  /** Event that fires on change of the authentication state of the user */
  public static onAuthStatusChanged = this.authStatusEventEmitter.event;

  /**
   * Initializes the authentication service.  If the user is
   * already authenticated it will immediately fire that it is logged in.
   */
  public static async initialize(state: vscode.Memento) {
    this._state = state;
    Logger.log(LogLevel.info, "Initializing authentication...");

    const accessToken = this._state.get(ExtensionKeys.account);
    const userId = this._state.get(ExtensionKeys.userId);
    const userLogin = this._state.get(ExtensionKeys.userLogin);
    if (accessToken && userId && userLogin) {
      this.authStatusEventEmitter.fire(true);
      Logger.log(
        LogLevel.info,
        `Twitch access token found. Successfully logged in.`
      );
      return;
    }

    this.authStatusEventEmitter.fire(false);
    Logger.log(LogLevel.error, "Authentication failed.");
  }

  /**
   * Attempts to read the users OAuth token to authenticate.  If an
   * OAuth token doesn't exist then we'll open a browser to allow
   * the user to authenticate with Twitch and return an OAuth token
   * to the extension.
   */
  public static async handleSignIn() {
    const accessToken = this._state.get(ExtensionKeys.account) as string | null;
    if (!accessToken) {
      const state = v4();
      this.createServer(state);
      vscode.env.openExternal(
        vscode.Uri.parse(
          `https://id.twitch.tv/oauth2/authorize?client_id=ts9wowek7hj9yw0q7gmg27c29i6etn` +
            `&redirect_uri=http://localhost:5544` +
            `&response_type=token&scope=chat:edit chat:read whispers:edit user:read:email moderator:read:followers` +
            `&state=${state}`
        )
      );
      Logger.log(LogLevel.info, `Attempting to authenticate with Twitch.`);
    } else {
      this.authStatusEventEmitter.fire(true);
      Logger.log(
        LogLevel.info,
        `Twitch access token found. Successfully logged in.`
      );
    }
  }

  /**
   * Removes any OAuth tokens stored for the user
   */
  public static handleSignOut() {
    this._state.update(ExtensionKeys.account, null);
    this._state.update(ExtensionKeys.userId, null);
    this._state.update(ExtensionKeys.userLogin, null);

    vscode.window.showInformationMessage("Signing out of Twitch");
    Logger.log(LogLevel.info, `Signed out of Twitch`);
    this.authStatusEventEmitter.fire(false);
  }

  private static createServer(state: string) {
    const file = readFileSync(path.join(__dirname, "/login/index.html"));

    const server = http.createServer(async (req, res) => {
      const mReq = url.parse(req.url!, true);
      var mReqPath = mReq.pathname;

      if (mReqPath === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(file);
      } else if (mReqPath === "/oauth") {
        const q: any = mReq.query;

        if (q.state === state) {
          this._state.update(ExtensionKeys.account, q.access_token);
          const authUser = await API.getUserDetails(q.access_token);
          this._state.update(ExtensionKeys.userId, authUser.id);
          this._state.update(ExtensionKeys.userLogin, authUser.login);
          this.authStatusEventEmitter.fire(true);
        } else {
          vscode.window.showErrorMessage(
            "Error while logging in. State mismatch error"
          );
          this.authStatusEventEmitter.fire(false);
        }

        setTimeout(() => {
          server.close();
        }, 3000);

        res.writeHead(200);
        res.end(file);
      } else if (mReqPath === "/favicon.ico") {
        res.writeHead(204);
        res.end();
      }
    });

    server.listen("5544");
  }
}
