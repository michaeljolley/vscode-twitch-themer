import * as dotenv from 'dotenv';
dotenv.config();

import * as vscode from 'vscode';
import { AuthenticationService } from './Authentication';
import ChatClient from './chat/ChatClient';
import { Commands, TwitchClientStatus, AccessState } from './Enum';
import { createStatusBarItem } from './StatusBar';
import { Themer } from './commands/Themer';
import { IChatMessage } from './chat/IChatMessage';
import { IWhisperMessage } from './chat/IWhisperMessage';

let activeExtension: Extension;


let _authenticationService: AuthenticationService;
let _chatClient: ChatClient;
let _themer: Themer;
let _context: vscode.ExtensionContext;


export class Extension {

	/** State of the extension */
	public static twitchClientStatus: TwitchClientStatus;

	constructor(context: vscode.ExtensionContext) {
		_context = context;
		_authenticationService = new AuthenticationService();
		_chatClient = new ChatClient(_context.globalState);
		_themer = new Themer(_context.globalState, _context);
	}

	public async initialize() {
		await _authenticationService.initialize();

    _context.subscriptions.push(

			_themer.onSendMesssage(this.onSendMessage),
			_themer.onSendWhisper(this.onSendWhisper),

			_chatClient.onChatMessageReceived(this.onChatMessageReceived),

			_authenticationService.onAuthStatusChanged(this.onAuthStatusChanged),
			_chatClient.onConnectionChanged(this.onChatConnectionChanged)
		);

		const statusBarItem = await createStatusBarItem(_context, _authenticationService, _chatClient);
		const toggleChat = vscode.commands.registerCommand(Commands.toggleChat, _chatClient.toggleChat.bind(_chatClient));
		const twitchSignIn = vscode.commands.registerCommand(Commands.twitchSignIn, _authenticationService.handleSignIn.bind(_authenticationService));
		const twitchSignOut = vscode.commands.registerCommand(Commands.twitchSignOut, _authenticationService.handleSignOut.bind(_authenticationService));

		const handleSettingsChange = vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent)=>{
			if(e.affectsConfiguration('twitchThemer.accessState')){
				_themer.handleAccessStateChanged(vscode.workspace.getConfiguration().get('twitchThemer.accessState', AccessState.Viewers));
			}
		});

		_context.subscriptions.push(toggleChat, twitchSignIn, twitchSignOut, statusBarItem, handleSettingsChange);
	}

	private onSendMessage(message: string) {
		_chatClient.sendMessage(message);
	}

	private onSendWhisper(whisper: IWhisperMessage) {
		_chatClient.whisper(whisper);
	}

	private onChatMessageReceived(chatMessage: IChatMessage) {
		_themer.handleCommands(chatMessage);
	}

	private onAuthStatusChanged(signedIn: boolean) {
		if (!signedIn) {
			_chatClient.disconnect();
		}
		_themer.handleAuthStatusChanged(signedIn);
	}

	private onChatConnectionChanged(connected: boolean) {
	}

	public deactivate() {
		_authenticationService.handleSignOut();
	}
}

/**
 * Activates the extension in VS Code and registers commands available
 * in the command palette
 * @param context - Context the extesion is being run in
 */
export async function activate(context: vscode.ExtensionContext) {

	const extension: Extension = new Extension(context);

	await extension.initialize();

	console.log('Congratulations, Twitch Themer is now active!');
}

/**
 * Deactivates the extension in VS Code
 */
export function deactivate() {
	activeExtension.deactivate();
}
