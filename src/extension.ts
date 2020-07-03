import * as vscode from 'vscode';
import { AuthenticationService } from './Authentication';
import ChatClient from './chat/ChatClient';
import { Commands, TwitchClientStatus, AccessState } from './Enum';
import { createStatusBarItem } from './StatusBar';
import { Themer } from './commands/Themer';
import { IChatMessage } from './chat/IChatMessage';
import { IWhisperMessage } from './chat/IWhisperMessage';
import { autoConnect } from './AutoConnect';
import { Logger } from './Logger';

let activeExtension: Extension;
let _authenticationService: AuthenticationService;
let _chatClient: ChatClient;
let _themer: Themer;
let _context: vscode.ExtensionContext;
let _logger: Logger;

export class Extension {
  /** State of the extension */
  public static twitchClientStatus: TwitchClientStatus;

  constructor(context: vscode.ExtensionContext) {
    _logger = new Logger(vscode.window.createOutputChannel('Twitch Themer'));
    _context = context;
    _authenticationService = new AuthenticationService(_logger);
    _chatClient = new ChatClient(_context.globalState, _logger);
    _themer = new Themer(_context.globalState, _logger);
  }

  public async initialize() {

    _logger.log('Initializing themer...');

    const statusBarItem = await createStatusBarItem(
      _context,
      _authenticationService,
      _chatClient
    );
    const toggleChat = vscode.commands.registerCommand(
      Commands.toggleChat,
      _chatClient.toggleChat.bind(_chatClient)
    );
    const twitchSignIn = vscode.commands.registerCommand(
      Commands.twitchSignIn,
      _authenticationService.handleSignIn.bind(_authenticationService)
    );
    const twitchSignOut = vscode.commands.registerCommand(
      Commands.twitchSignOut,
      _authenticationService.handleSignOut.bind(_authenticationService)
    );

    const handleSettingsChange = vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('twitchThemer.accessState')) {
          _themer.handleAccessStateChanged(
            vscode.workspace
              .getConfiguration()
              .get('twitchThemer.accessState', AccessState.Viewers)
          );
        }
      }
    );

    const themerOnSendMessage = _themer.onSendMesssage(this.onSendMessage);
    const themerOnSendWhisper = _themer.onSendWhisper(this.onSendWhisper);
    const chatOnChatMessageReceived = _chatClient.onChatMessageReceived(this.onChatMessageReceived);
    const authOnAuthStatusChanged = _authenticationService.onAuthStatusChanged(this.onAuthStatusChanged);
    const chatOnConnectionChanged = _chatClient.onConnectionChanged(this.onChatConnectionChanged);

    _context.subscriptions.push(
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

    await _authenticationService.initialize();

    // Auto connect to Twitch Chat if 'twitchThemer.autoConnect' is true (default is false)
    // and we are currently streaming.
    await autoConnect(_chatClient);

    _logger.log('Themer initialized.');
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

  private async onChatConnectionChanged(connected: boolean) {
    await _themer.handleChatConnectionChanged(connected);
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

  _logger.log('Congratulations, Twitch Themer is now active!');
}

/**
 * Deactivates the extension in VS Code
 */
export function deactivate() {
  activeExtension.deactivate();
}
