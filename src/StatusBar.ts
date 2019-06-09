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
    await updateStatusBarItem(
      statusBarItem,
      status ? TwitchClientStatus.loggedIn : TwitchClientStatus.loggedOut
    );
  }

  async function processChatStatusChange(status: boolean) {
    await updateStatusBarItem(
      statusBarItem,
      status ? TwitchClientStatus.chatConnected : TwitchClientStatus.loggedOut
    );
  }
}

/**
 * Update the state of the status bar item to inform user of changes
 * @param statusBarItem - VS Code status bar item used by the extension to display status
 * @param authStatus - Status of authentication & connection to Twitch chat
 * @param chatClientConnected - Defines if the Twitch chat client is connected to the channel
 */
async function updateStatusBarItem(
  statusBarItem: vscode.StatusBarItem,
  authStatus: TwitchClientStatus
) {
  const icon = '$(paintcan)'; // The octicon to use for the status bar icon (https://octicons.github.com/)
  let text = `${icon}`;
  statusBarItem.show();

  let user: string | null = null;
  if (keytar) {
    user = await keytar.getPassword(KeytarKeys.service, KeytarKeys.userLogin);
  }

  switch (authStatus) {
    case TwitchClientStatus.loggingIn:
      text += ' Logging In...';
      vscode.window.showInformationMessage('Signing in to Twitch');
      break;
    case TwitchClientStatus.chatConnected:
      text += ` Connected`;
      break;
    case TwitchClientStatus.loggedIn:
    case TwitchClientStatus.loggedOut:
      text += ' Disconnected';
      break;
  }

  statusBarItem.text = text;
}
