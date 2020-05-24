import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import { v4 } from 'uuid';
import { API, CLIENT_ID } from './api/API';
import { KeytarKeys } from './Enum';

import { keytar } from './Common';

/**
 * Manages state of current user & authenticating user with Twitch
 */
export class AuthenticationService {
  private authStatusEventEmitter = new vscode.EventEmitter<boolean>();

  /** Event that fires on change of the authentication state of the user */
  public onAuthStatusChanged = this.authStatusEventEmitter.event;

  /**
   * Initializes the authentication service.  If the user is
   * already authenticated it will immediately fire that it is logged in.
   */
  public async initialize() {
    if (keytar) {
      const accessToken = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.account
      );
      const userId = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.userId
      );
      const userLogin = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.userLogin
      );
      if (accessToken && userId && userLogin) {
        this.authStatusEventEmitter.fire(true);
        return;
      }
    }
    this.authStatusEventEmitter.fire(false);
  }

  /**
   * Attempts to read the users OAuth token to authenticate.  If an
   * OAuth token doesn't exist then we'll open a browser to allow
   * the user to authenticate with Twitch and return an OAuth token
   * to the extension.
   */
  public async handleSignIn() {
    if (keytar) {
      const accessToken = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.account
      );
      if (!accessToken) {
        const state = v4();
        this.createServer(state);
        vscode.env.openExternal(
          vscode.Uri.parse(
            `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}` +
              `&redirect_uri=http://localhost:5544` +
              `&response_type=token&scope=chat:edit chat:read whispers:edit user:read:email` +
              `&state=${state}`
          )
        );
      } else {
        this.authStatusEventEmitter.fire(true);
      }
    }
  }

  /**
   * Removes any OAuth tokens stored for the user
   */
  public handleSignOut() {
    if (keytar) {
      keytar.deletePassword(KeytarKeys.service, KeytarKeys.account);
      keytar.deletePassword(KeytarKeys.service, KeytarKeys.userId);
      keytar.deletePassword(KeytarKeys.service, KeytarKeys.userLogin);
    }
    vscode.window.showInformationMessage('Signing out of Twitch');
    this.authStatusEventEmitter.fire(false);
  }

  private createServer(state: string) {
    const file = readFileSync(path.join(__dirname, '/login/index.html'));

    const server = http.createServer(async (req, res) => {
      const mReq = url.parse(req.url!, true);
      var mReqPath = mReq.pathname;

      if (mReqPath === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(file);
      } else if (mReqPath === '/oauth') {
        const q: any = mReq.query;
        if (keytar) {
          if (q.state === state) {
            keytar.setPassword(
              KeytarKeys.service,
              KeytarKeys.account,
              q.access_token
            );
            const authUser = await API.getUserDetails(q.access_token);
            keytar.setPassword(
              KeytarKeys.service,
              KeytarKeys.userId,
              authUser.id
            );
            keytar.setPassword(
              KeytarKeys.service,
              KeytarKeys.userLogin,
              authUser.login
            );
            this.authStatusEventEmitter.fire(true);
          } else {
            vscode.window.showErrorMessage(
              'Error while logging in. State mismatch error'
            );
            this.authStatusEventEmitter.fire(false);
          }

          setTimeout(() => {
            server.close();
          }, 3000);
        }
        res.writeHead(200);
        res.end(file);
      } else if (mReqPath === '/favicon.ico') {
        res.writeHead(204);
        res.end();
      }
    });

    server.listen('5544', (err: any) => {
      console.error(err);
    });
  }
}
