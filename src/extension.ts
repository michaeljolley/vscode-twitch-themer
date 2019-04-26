import * as dotenv from 'dotenv';
dotenv.config();

import * as vscode from 'vscode';
import ChatClient from './chat/ChatClient';
import { Commands, TwitchClientStatus } from './Enum';
import { AuthenticationService } from './Authentication';
import { Constants } from './Constants';
import { createStatusBarItem } from './StatusBar';

const chatClient = new ChatClient();
const authService = new AuthenticationService();

authService.onAuthStatusChanged(async (status) => {
	if (status === TwitchClientStatus.loggedIn) {
		const user = await authService.currentUser();
		if (user && user.accessToken) {
			const opts = {
				identity: {
					username: Constants.chatClientUserName,
					password: user.accessToken,
				},
				channels: [user.login]
			};
			chatClient.connect(opts);
		}
	} else if (status === TwitchClientStatus.loggedOut) {
		chatClient.disconnect();
	}
});

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, Twitch Themer is now active!');

	await authService.initialize();

	const statusBarItem = await createStatusBarItem(context, authService, chatClient);
	const signInCommand = vscode.commands.registerCommand(Commands.twitchSignIn, authService.handleSignIn.bind(authService));
	const signOutCommand = vscode.commands.registerCommand(Commands.twitchSignOut, authService.handleSignOut.bind(authService));
	const chatConnectCommand = vscode.commands.registerCommand(Commands.chatConnect, authService.handleSignIn.bind(authService));
	const chatDisconnectCommand = vscode.commands.registerCommand(Commands.chatDisconnect, chatClient.disconnect.bind(chatClient));

	context.subscriptions.push(chatConnectCommand, chatDisconnectCommand, signInCommand, signOutCommand, statusBarItem);
}

export function deactivate() {
	authService.handleSignOut();
}