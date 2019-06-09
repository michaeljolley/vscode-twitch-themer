import { Client, Options, Userstate } from 'tmi.js';
import { EventEmitter, Memento } from 'vscode';
import { IChatMessage } from './IChatMessage';
import { keytar } from '../Common';
import { KeytarKeys } from '../Enum';
import { IWhisperMessage } from './IWhisperMessage';

/**
 * Twitch chat client used in communicating via chat/whispers
 */
export default class ChatClient {
  private _client: Client | null;
  private _options: Options | null;

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
  constructor(_state: Memento) {
    this._client = null;
    this._options = null;
  }

  /**
   * Connects to Twitch chat
   */
  private async connect() {
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
        const opts = {
          identity: {
            username: authUserLogin,
            password: accessToken
          },
          channels: [authUserLogin]
        };
        this._options = opts;

        this._client = Client(this._options);
        this._client.on('connected', this.onConnectedHandler.bind(this));
        this._client.on('message', this.onMessageHandler.bind(this));
        this._client.on('join', this.onJoinHandler.bind(this));
        const status = await this._client.connect();
        this.chatClientConnectionEventEmitter.fire(true);
        return status;
      }
    }
  }

  /**
   * Disconnects from Twitch chat
   */
  public async disconnect() {
    if (this.isConnected()) {
      this.sendMessage('Twitch Themer has left the building!');

      if (this._client) {
        this._client.disconnect();
        this._client = null;
      }
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
    return this._client ? this._client.readyState() === 'OPEN' : false;
  }

  private onConnectedHandler(address: string, port: number) {
    console.log(`Connected chat client ${address} : ${port}`);
  }

  private onJoinHandler(channel: string, username: string, self: boolean) {
    if (self && this._client) {
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
      this._client &&
      whisperMessage.user !== undefined
    ) {
      this._client.whisper(whisperMessage.user, whisperMessage.message);
    }
  }

  /**
   * Sends a message to Twitch chat
   * @param message - Message to send to chat
   */
  public sendMessage(message: string) {
    let channel: string[] | undefined;
    if (this._options) {
      channel = this._options.channels;
    }
    if (this.isConnected() && this._client && channel) {
      /**
       * Why are we specifying channel[0] below?  While tmi.js
       * allows us to connect to multiple channels, we will
       * only ever be connected to one channel.
       */
      this._client.say(channel[0], message);
    }
  }

  private async onMessageHandler(
    channel: string,
    userState: Userstate,
    message: string,
    self: boolean
  ) {
    console.log(`Received ${message} from ${userState['display-name']}`);
    if (self) {
      return;
    }
    if (!message) {
      return;
    }

    message = message.toLocaleLowerCase().trim();

    if (message.startsWith('!theme')) {
      this.chatClientMessageEventEmitter.fire({
        userState,
        message: message
          .replace('!theme', '')
          .trim()
      });
    }
  }
}
