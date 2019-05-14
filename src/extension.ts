import * as dotenv from 'dotenv';
dotenv.config();

import * as vscode from 'vscode';
import ChatClient from './chat/ChatClient';
import { Commands, TwitchClientStatus } from './Enum';
import { AuthenticationService } from './Authentication';
import { Constants } from './Constants';
import { createStatusBarItem } from './StatusBar';

let chatClient: ChatClient;
const authService = new AuthenticationService();

/**
 * Handles changes in the authentication status of the user
 */
authService.onAuthStatusChanged(async (status) => {
	/**
	 * If the user is not logged in we want to attempt to authenticate
	 * them with Twitch.
	 * 
	 * If they are or become, logged in, we want to immediately connect to Twitch chat
	 */
	if (status === TwitchClientStatus.loggedIn) {
		const user = await authService.currentUser();
		Constants.chatClientUserName = user.login;
		if (user && user.accessToken) {
			const opts = {
				identity: {
					username: user.login,
					password: user.accessToken,
				},
				channels: [user.login]
			};
			chatClient.connect(opts);
		}
	} 
	/**
	 * If the status of the authenticate is changed to logged out we want 
	 * to automatically disconnect from Twitch chat
	 */
	else if (status === TwitchClientStatus.loggedOut) {
		chatClient.disconnect();
	}
});

/**
 * Activates the extension in VS Code and registers commands available
 * in the command palette
 * @param context - Context the extesion is being run in
 */
export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, Twitch Themer is now active!');

	// We instantiate a new ChatClient using the global state of this extension;
	// the state holds extension specific values such as the banned users.
	chatClient = new ChatClient(context.globalState);

	await authService.initialize();

	const statusBarItem = await createStatusBarItem(context, authService, chatClient);
	const signInCommand = vscode.commands.registerCommand(Commands.twitchSignIn, authService.handleSignIn.bind(authService));
	const signOutCommand = vscode.commands.registerCommand(Commands.twitchSignOut, authService.handleSignOut.bind(authService));
	const chatConnectCommand = vscode.commands.registerCommand(Commands.chatConnect, authService.handleSignIn.bind(authService));
	const chatDisconnectCommand = vscode.commands.registerCommand(Commands.chatDisconnect, chatClient.disconnect.bind(chatClient));

	context.subscriptions.push(chatConnectCommand, chatDisconnectCommand, signInCommand, signOutCommand, statusBarItem);
}

/**
 * Deactivates the extension in VS Code
 */
export function deactivate() {
	authService.handleSignOut();
}