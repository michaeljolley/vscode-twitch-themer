import ComfyJS, { OnCommandExtra, OnJoinExtra, OnMessageFlags } from "comfy.js";
import { EventEmitter, Memento } from 'vscode';
import { IChatMessage } from './IChatMessage';
import { keytar } from '../Common';
import { KeytarKeys } from '../Enum';
import { IWhisperMessage } from './IWhisperMessage';
import { Logger } from '../Logger';

/**
 * Twitch chat client used in communicating via chat/whispers
 */
export default class ChatClient {

  private chatClientMessageEventEmitter = new EventEmitter<IChatMessage>();
  private chatClientConnectionEventEmitter = new EventEmitter<boolean>();

  /** Event that fires when an appropriate message is received */
  public onChatMessageReceived = this.chatClientMessageEventEmitter.event;

  /** Event that fires when the connection status of the chat client changes */
  public onConnectionChanged = this.chatClientConnectionEventEmitter.event;

  /**
   * constructor
   * @param _state - The global state of the extension
   */
  constructor(_state: Memento, private logger: Logger) {

  }

  /**
   * Connects to Twitch chat
   */
  private async connect() {
    this.logger.log('Connecting to Twitch...');
    if (keytar && !this.isConnected()) {
      const accessToken = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.account
      );
      const authUserLogin = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.userLogin
      );

      if (authUserLogin && accessToken) {

        ComfyJS.onError = (err: string) => {
          this.logger.log(err);
        };

        ComfyJS.onCommand = this.onCommandHandler.bind(this);
        ComfyJS.onJoin = this.onJoinHandler.bind(this);
        ComfyJS.onConnected = this.onConnectedHandler.bind(this);

        ComfyJS.Init(authUserLogin, accessToken, authUserLogin);

        this.chatClientConnectionEventEmitter.fire(true);
        return true;
      }
    }
  }

  /**
   * Disconnects from Twitch chat
   */
  public async disconnect() {
    if (this.isConnected()) {
      this.sendMessage('Twitch Themer has left the building!');

      ComfyJS.Disconnect();
      this.logger.log('Disconnected from chat.');
      this.chatClientConnectionEventEmitter.fire(false);
    }
  }

  /**
   * Toggles whether the person is connected to Twitch chat
   */
  public toggleChat() {
    if (this.isConnected()) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  /** Is the client currently connected to Twitch chat */
  public isConnected(): boolean {
    const client = ComfyJS.GetClient();
    return client ? client.readyState() === 'OPEN' : false;
  }

  private onConnectedHandler(address: string, port: number) {
    this.logger.log(`Connected chat client ${address} : ${port}`);
  }

  private onJoinHandler(user: string, self: boolean, extra: OnJoinExtra) {
    if (self) {
      this.sendMessage(
        'Twitch Themer is ready to go. Listening for commands beginning with !theme'
      );
    }
  }

  /**
   * Sends a whisper to the specified user
   * @param twitchUser - Username of the recipient of the whisper
   * @param message - Message to send to the twitchUser
   */
  public whisper(whisperMessage: IWhisperMessage) {
    if (
      this.isConnected() &&
      whisperMessage.user !== undefined
    ) {
      ComfyJS.Whisper(whisperMessage.message, whisperMessage.user);
    }
  }

  /**
   * Sends a message to Twitch chat
   * @param message - Message to send to chat
   */
  public async sendMessage(message: string) {
    if (keytar) {
      const authUserLogin = await keytar.getPassword(
        KeytarKeys.service,
        KeytarKeys.userLogin
      );

      if (this.isConnected() && authUserLogin) {
        ComfyJS.Say(message, authUserLogin);
      }
    }
  }

  private async onCommandHandler(
    user: string,
    command: string,
    message: string,
    flags: OnMessageFlags,
    extra: OnCommandExtra
  ) {
    this.logger.log(`Received ${message} from ${user}`);
    if (!message) {
      return;
    }
    if (command !== 'theme') {
      return;
    }

    message = message.toLocaleLowerCase().trim();
    this.chatClientMessageEventEmitter.fire({
      user,
      message: message
        .replace('!theme', '')
        .trim(),
      flags,
      extra
    });
  }
}
