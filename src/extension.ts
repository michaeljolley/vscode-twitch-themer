import * as vscode from "vscode";
import API from "./api";
import Authentication from "./authentication";
import ChatClient from "./chatClient";
import Logger from "./logger";
import Themer from "./themer";
import { Telemetry } from "./telemetry";

import { ChatMessage } from "./types/chatMessage";
import { Commands, LogLevel } from "./constants";
import { createStatusBarItem } from "./statusBar";

let _chatClient: ChatClient | undefined;
let _themer: Themer | undefined;

export async function activate(context: vscode.ExtensionContext) {
  Logger.log(LogLevel.info, "Initializing Twitch Themer...");

  // If enabled, initialize telemetry
  Telemetry.initialize(context);

  _chatClient = new ChatClient();
  _themer = new Themer(context.globalState);

  const statusBarItem = await createStatusBarItem(context, _chatClient);

  const toggleChat = vscode.commands.registerCommand(
    Commands.toggleChat,
    _chatClient?.toggleChat.bind(_chatClient),
  );

  const handleSettingsChange = vscode.workspace.onDidChangeConfiguration(
    async (e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration("twitchThemer")) {
        _chatClient?.initializeConfiguration();
        _themer?.initializeConfiguration();

        if (
          e.affectsConfiguration("twitchThemer.twitchChannelName") &&
          _chatClient &&
          _chatClient.isConnected()
        ) {
          API._twitchUserId = undefined;
          await _chatClient?.disconnect();
          await _chatClient.connect();
        }
      }
    },
  );

  const themerOnSendMessage = _themer.onSendMessage(onSendMessage);
  const chatOnChatMessageReceived = _chatClient.onChatMessageReceived(
    onChatMessageReceived,
  );
  const authOnAuthStatusChanged =
    Authentication.onAuthStatusChanged(onAuthStatusChanged);
  const chatOnConnectionChanged = _chatClient.onConnectionChanged(
    onChatConnectionChanged,
  );

  context.subscriptions.push(
    themerOnSendMessage,
    chatOnChatMessageReceived,
    authOnAuthStatusChanged,
    chatOnConnectionChanged,

    toggleChat,
    statusBarItem,
    handleSettingsChange,
  );

  Authentication.initialize(context.globalState);

  // Auto connect to Twitch Chat if 'twitchThemer.autoConnect' is true (default is false)
  // and we are currently streaming.
  await autoConnect(_chatClient, context);

  Logger.log(LogLevel.info, "Congratulations, Twitch Themer is now active!");
}

/**
 * Clean up the extension resources.
 */
export async function deactivate() {
  await _chatClient?.disconnect();
  _chatClient = undefined;
  _themer = undefined;
}

async function autoConnect(
  chatClient: ChatClient,
  context: vscode.ExtensionContext,
) {
  const shouldAutoConnect =
    vscode.workspace
      .getConfiguration("twitchThemer")
      .get<boolean>("autoConnect") || false;
  if (shouldAutoConnect && (await API.getStreamIsActive(context.globalState))) {
    chatClient?.toggleChat.bind(chatClient)();
  }
}

async function onSendMessage(message: string) {
  await _chatClient?.sendMessage(message);
}

async function onChatMessageReceived(chatMessage: ChatMessage) {
  await _themer?.handleCommands(chatMessage);
}

async function onAuthStatusChanged(signedIn: boolean) {
  if (!signedIn) {
    _chatClient?.disconnect();
  }
  _themer?.handleConnectionChanges(signedIn);
}

async function onChatConnectionChanged(connected: boolean) {
  _themer?.handleConnectionChanges(connected);
}
