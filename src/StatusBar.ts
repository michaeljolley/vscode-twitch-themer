import * as vscode from 'vscode';
import { AuthenticationService } from './Authentication';
import ChatClient from './chat/ChatClient';
import { TwitchClientStatus, Commands, KeytarKeys } from './Enum';
import { keytar } from './Common';

/**
 * Creates the status bar item to use in updating users of the status of the extension
 * @param context - Context the extension is running in
 * @param authService - Service used in authenticating the user with Twitch
 * @param chatClient - Twitch chat client used in connecting to channel
 */
export async function createStatusBarItem(
  context: vscode.ExtensionContext,
  authService: AuthenticationService,
  chatClient: ChatClient
) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );

  statusBarItem.tooltip = 'Twitch Themer Extension';
  statusBarItem.command = Commands.toggleChat;

  context.subscriptions.push(
    statusBarItem,
    authService.onAuthStatusChanged(processAuthChange),
    chatClient.onConnectionChanged(processChatStatusChange)
  );

  return statusBarItem;

  async function processAuthChange(status: boolean) {
    if (!status) {
      updateStatusBarItem(statusBarItem, TwitchClientStatus.loggedOut, null);
    } else {
      let user: string | null = null;
      if (keytar) {
        user = await keytar.getPassword(
          KeytarKeys.service,
          KeytarKeys.userLogin
        );
      }
      updateStatusBarItem(statusBarItem, TwitchClientStatus.loggedIn, user);
    }
  }

  async function processChatStatusChange(status: boolean) {
    let user: string | null = null;
    if (keytar) {
      user = await keytar.getPassword(KeytarKeys.service, KeytarKeys.userLogin);
    }

    if (status) {
      updateStatusBarItem(
        statusBarItem,
        TwitchClientStatus.chatConnected,
        user
      );
    } else if (user) {
      // disconnected but still logged in
      updateStatusBarItem(statusBarItem, TwitchClientStatus.loggedIn, user);
    } else {
      updateStatusBarItem(statusBarItem, TwitchClientStatus.loggedOut, null);
    }
  }
}

/**
 * Update the state of the status bar item to inform user of changes
 * @param statusBarItem - VS Code status bar item used by the extension to display status
 * @param authStatus - Status of authentication & connection to Twitch chat
 * @param chatClientConnected - Defines if the Twitch chat client is connected to the channel
 * @param userName - Username of the user attempting to connect to chat
 */
function updateStatusBarItem(
  statusBarItem: vscode.StatusBarItem,
  authStatus: TwitchClientStatus,
  userName: string | null
) {
  const icon = '$(paintcan)'; // The octicon to use for the status bar icon (https://octicons.github.com/)
  let text = `${icon}`;
  statusBarItem.show();

  switch (authStatus) {
    case TwitchClientStatus.loggingIn:
      text += ' Logging In...';
      vscode.window.showInformationMessage('Signing in to Twitch');
      break;
    case TwitchClientStatus.loggedIn:
      text += ` ${userName} (Disconnected)`;
      break;
    case TwitchClientStatus.chatConnected:
      text += ` ${userName}`;
      break;
    case TwitchClientStatus.loggedOut:
      text += ' Disconnected';
      break;
  }

  statusBarItem.text = text;
}
