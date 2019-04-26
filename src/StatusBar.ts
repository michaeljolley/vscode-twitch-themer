import { ExtensionContext, StatusBarAlignment, window, StatusBarItem, Event } from "vscode";
import { TwitchClientStatus } from "./Enum";
import { AuthenticationService } from "./Authentication";
import ChatClient from "./chat/ChatClient";


export async function createStatusBarItem(context: ExtensionContext,
    authService: AuthenticationService,
    chatClient: ChatClient) {

    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    const user = await authService.currentUser();
    updateStatusBarItem(statusBarItem, user ? TwitchClientStatus.loggedIn : TwitchClientStatus.loggedOut,
        chatClient.isConnected(),
        user ? user.login : '');

    context.subscriptions.push(statusBarItem, authService.onAuthStatusChanged(updateStatusBar),
        chatClient.onStatusChanged(updateStatusBar));

    return statusBarItem;

    async function updateStatusBar(status: TwitchClientStatus) {
        const user = await authService.currentUser();
        updateStatusBarItem(statusBarItem, status, chatClient.isConnected(), user ? user.login : null);
    }
}


function updateStatusBarItem(statusBarItem: StatusBarItem, authStatus: TwitchClientStatus,
    chatClientConnected: boolean,
    userName?: string | undefined) {
    let text = 'Twitch Themer: ';
    statusBarItem.show();

    switch (authStatus) {
        case TwitchClientStatus.loggingIn:
            text += 'Logging In...';
            break;
        case TwitchClientStatus.loggedIn:
        case TwitchClientStatus.chatConnected:
        case TwitchClientStatus.chatDisconnected:
            text += `${userName} ${chatClientConnected ? '' : '(disconnected)'}`;
            break;
        case TwitchClientStatus.loggedOut:
            statusBarItem.hide();
            break;
    }

    statusBarItem.text = text;
}