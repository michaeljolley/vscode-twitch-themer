import { Memento } from 'vscode';
import { Client, Options, Userstate } from 'tmi.js';
import { Themer } from '../commands/Themer';
import { disconnect } from 'cluster';
import { EventEmitter } from 'vscode';
import { TwitchClientStatus } from '../Enum';
import { Constants } from '../Constants';

/**
 * Twitch chat client used in communicating via chat/whispers
 */
export default class ChatClient {

    private _client: Client | null;
    private _options: Options | null;
    private readonly _themer: Themer;

    private chatClientStatusEventEmitter = new EventEmitter<TwitchClientStatus>();


    /** Event that fires when the connection status of the chat client changes */
    public onStatusChanged = this.chatClientStatusEventEmitter.event;

    /**
     * constructor
     * @param state - The global state of the extension
     */
    constructor(state: Memento) {
        this._client = null;
        this._options = null;
        this._themer = new Themer(this, state);
    }
    /**
     * Changes Follower only flag 
     * @param followerOnly 
     */
    public toggleFollowerOnlyMode(followerOnly: boolean){
        this._themer.followerOnly(Constants.chatClientUserName, followerOnly);
    }

    /**
     * Changes Subscriber only flag 
     * @param subscriberOnly 
     */
    public toggleSubscriberOnlyMode(subscriberOnly: boolean){
        this._themer.subOnly(Constants.chatClientUserName, subscriberOnly);
    }

    /**
     * Connects to Twitch chat
     * @param options - tmi.js Options for connecting to Twitch chat 
     */
    public async connect(options: Options): Promise<[string, number]> {
        this._options = options;

        /** We're disconnecting just in case we were already 
         * connected using different options */
        await disconnect();

        this._client = Client(this._options);
        this._client.on('connected', this.onConnectedHandler.bind(this));
        this._client.on('message', this.onMessageHandler.bind(this));
        this._client.on('join', this.onJoinHandler.bind(this));
        const status = await this._client.connect();
        this.chatClientStatusEventEmitter.fire(TwitchClientStatus.chatConnected);
        return status;
    }

    /**
     * Disconnects from Twitch chat
     */
    public async disconnect() {
        if (this._client) {
            this._client.say(Constants.chatClientUserName, 'Twitch Themer has left the building!');

            this._client.disconnect();
            this.chatClientStatusEventEmitter.fire(TwitchClientStatus.chatDisconnected);
            this._client = null;
        }

        /**
         * Every time we disconnect from chat we want to reset the 
         * theme to the streamers original theme so they can 
         * continue working without having to manually change their
         * theme back to their preferred theme.
         */
        this._themer.followerOnly(Constants.chatClientUserName, false);
        await this._themer.resetTheme(undefined);
    }

    /** Is the client currently connected to Twitch chat */
    public isConnected(): boolean {
        return this._client ? this._client.readyState() === "OPEN" : false;
    }

    private onConnectedHandler(address: string, port: number) {
        console.log(`Connected chat client ${address} : ${port}`);
    }

    private onJoinHandler(channel: string, username: string, self: boolean) {
        if (self && this._client) {
            this._client.say(channel, 'Twitch Themer is ready to go. Listening for !theme list or !theme {theme name}');
        }
    }

    /**
     * Sends a whisper to the specified user
     * @param twitchUser - Username of the recipient of the whisper 
     * @param message - Message to send to the twitchUser
     */
    public whisper(twitchUser: string | undefined, message: string) {
        if (this.isConnected() && this._client && twitchUser !== undefined) {
            this._client.whisper(twitchUser, message);
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

    private async onMessageHandler(channel: string, userState: Userstate, message: string, self: boolean) {
        console.log(`Received ${message} from ${userState["display-name"]}`);
        if (self) { return; }
        if (!message) { return; }

        if (message.toLocaleLowerCase().startsWith('!theme')) {
            await this._themer.handleCommands(userState, '!theme', message.replace('!theme', '').trim());
        }
    }
}