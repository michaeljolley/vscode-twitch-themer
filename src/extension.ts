import * as vscode from "vscode";
import API from "./api";
import Authentication from "./authentication";
import ChatClient from "./chatClient";
import Logger from "./logger";
import Themer from "./themer";

import { WhisperMessage } from "./types/whisperMessage";
import { ChatMessage } from "./types/chatMessage";
import { Commands, LogLevel } from "./constants";
import { createStatusBarItem } from "./statusBar";

let _authentication: Authentication;
let _chatClient: ChatClient | undefined;
let _themer: Themer | undefined;

export async function activate(context: vscode.ExtensionContext) {
  Logger.log(LogLevel.info, "Initializing Twitch Themer...");

  _chatClient = new ChatClient(context.globalState);
  _themer = new Themer(context.globalState);

  const statusBarItem = await createStatusBarItem(context, _chatClient);

  const toggleChat = vscode.commands.registerCommand(
    Commands.toggleChat,
    _chatClient?.toggleChat.bind(_chatClient)
  );
  const twitchSignIn = vscode.commands.registerCommand(
    Commands.twitchSignIn,
    Authentication.handleSignIn.bind(Authentication)
  );
  const twitchSignOut = vscode.commands.registerCommand(
    Commands.twitchSignOut,
    () => {
      if (_chatClient?.isConnected()) {
        _chatClient?.disconnect();
      }
      Authentication.handleSignOut.bind(Authentication);
    }
  );

  const handleSettingsChange = vscode.workspace.onDidChangeConfiguration(
    (e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration("twitchThemer")) {
        _themer?.initializeConfiguration();
        _chatClient?.initializeConfiguration();
      }
    }
  );

  const themerOnSendMessage = _themer.onSendMessage(onSendMessage);
  const themerOnSendWhisper = _themer.onSendWhisper(onSendWhisper);
  const chatOnChatMessageReceived = _chatClient.onChatMessageReceived(
    onChatMessageReceived
  );
  const authOnAuthStatusChanged =
    Authentication.onAuthStatusChanged(onAuthStatusChanged);
  const chatOnConnectionChanged = _chatClient.onConnectionChanged(
    onChatConnectionChanged
  );

  context.subscriptions.push(
    themerOnSendMessage,
    themerOnSendWhisper,
    chatOnChatMessageReceived,
    authOnAuthStatusChanged,
    chatOnConnectionChanged,

    toggleChat,
    twitchSignIn,
    twitchSignOut,
    statusBarItem,
    handleSettingsChange
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
  context: vscode.ExtensionContext
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

async function onSendWhisper(whisper: WhisperMessage) {
  _chatClient?.whisper(whisper);
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
