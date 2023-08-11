import * as vscode from "vscode";
import API from "./api";
import Authentication from "./authentication";
import ChatClient from "./chatClient";
import Logger from "./logger";
import Themer from "./themer";

import { ChatMessage } from "./types/chatMessage";
import { Commands, LogLevel } from "./constants";
import { createStatusBarItem } from "./statusBar";
import { Whisper } from "./types/whisper";

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
  
	const handleSettingsChange = vscode.workspace.onDidChangeConfiguration(
	  (e: vscode.ConfigurationChangeEvent) => {
		if (e.affectsConfiguration("twitchThemer")) {
		  _themer?.initializeConfiguration();
		  _chatClient?.initializeConfiguration();
		}
	  }
	);
  
	const themerOnSendMessage = _themer.onSendMessage(onSendMessage);
	const themerOnWhisper = _themer.onWhisper(onWhisper);
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
	  chatOnChatMessageReceived,
	  authOnAuthStatusChanged,
	  chatOnConnectionChanged,
  
	  toggleChat,
	  twitchSignIn,
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
  
  async function onWhisper(whisper: Whisper) {
	await _chatClient?.whisper(whisper);
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
  