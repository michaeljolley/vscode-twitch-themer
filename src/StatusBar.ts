import { ExtensionContext, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { AuthenticationService } from "./Authentication";
import ChatClient from "./chat/ChatClient";
import { TwitchClientStatus } from "./Enum";

/**
 * Creates the status bar item to use in updating users of the status of the extension
 * @param context - Context the extension is running in
 * @param authService - Service used in authenticating the user with Twitch
 * @param chatClient - Twitch chat client used in connecting to channel
 */
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

/**
 * Update the state of the status bar item to inform user of changes
 * @param statusBarItem - VS Code status bar item used by the extension to display status
 * @param authStatus - Status of authentication & connection to Twitch chat
 * @param chatClientConnected - Defines if the Twitch chat client is connected to the channel
 * @param userName - Username of the user attempting to connect to chat
 */
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
