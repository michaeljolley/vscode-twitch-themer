import * as vscode from "vscode";
import Authentication from "./authentication";
import ChatClient from "./chatClient";
import { TwitchClientStatus, Commands } from "./constants";

/**
 * Creates the status bar item to use in updating users of the status of the extension
 * @param context - Context the extension is running in
 * @param authService - Service used in authenticating the user with Twitch
 * @param chatClient - Twitch chat client used in connecting to channel
 */
export async function createStatusBarItem(
  context: vscode.ExtensionContext,
  chatClient: ChatClient,
) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
  );

  statusBarItem.tooltip = "Twitch Themer Extension";
  statusBarItem.command = Commands.toggleChat;

  context.subscriptions.push(
    statusBarItem,
    Authentication.onAuthStatusChanged(processAuthChange),
    chatClient.onConnectionChanged(processChatStatusChange),
  );

  return statusBarItem;

  async function processAuthChange(status: boolean) {
    await updateStatusBarItem(
      statusBarItem,
      status ? TwitchClientStatus.loggedIn : TwitchClientStatus.loggedOut,
    );
  }

  async function processChatStatusChange(status: boolean) {
    await updateStatusBarItem(
      statusBarItem,
      status ? TwitchClientStatus.chatConnected : TwitchClientStatus.loggedOut,
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
  authStatus: TwitchClientStatus,
) {
  const icon = "$(paintcan)"; // The octicon to use for the status bar icon (https://octicons.github.com/)
  let text = `${icon}`;
  let tooltip = "Twitch Themer Extension";
  statusBarItem.show();

  const currentSession = await Authentication.getSession();
  const login = currentSession?.account?.label;

  const twitchChannelNameSetting =
    vscode.workspace
      .getConfiguration("twitchThemer")
      .get<string>("twitchChannelName") || undefined;

  const channelToJoin =
    twitchChannelNameSetting && twitchChannelNameSetting.length > 0
      ? twitchChannelNameSetting
      : login;

  switch (authStatus) {
    case TwitchClientStatus.loggingIn:
      text += " Logging In...";
      break;
    case TwitchClientStatus.chatConnected:
      text += ` Connected (${channelToJoin})`;
      tooltip = "Click to disconnect from Twitch chat";
      break;
    case TwitchClientStatus.loggedIn:
    case TwitchClientStatus.loggedOut:
      text += " Disconnected";
      tooltip = "Click to connect to Twitch chat";
      break;
  }

  statusBarItem.text = text;
  statusBarItem.tooltip = tooltip;
}
