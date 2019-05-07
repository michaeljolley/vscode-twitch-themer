import { Client, Options, Userstate } from 'tmi.js';
import { Themer } from '../commands/Themer';
import { disconnect } from 'cluster';
import { EventEmitter } from 'vscode';
import { TwitchClientStatus } from '../Enum';
import { Constants } from '../Constants';

export default class ChatClient {
    private _client: Client | null;
    private readonly _themer: Themer;

    private chatClientStatusEventEmitter = new EventEmitter<TwitchClientStatus>();
    public onStatusChanged = this.chatClientStatusEventEmitter.event;

    constructor() {
        this._client = null;
        this._themer = new Themer(this);
    }

    public async connect(options: Options): Promise<[string, number]> {
        await disconnect();
        this._client = Client(options);
        this._client.on('connected', this.onConnectedHandler.bind(this));
        this._client.on('message', this.onMessageHandler.bind(this));
        this._client.on('join', this.onJoinHandler.bind(this));
        const status = await this._client.connect();
        this.chatClientStatusEventEmitter.fire(TwitchClientStatus.chatConnected);
        return status;
    }

    public async disconnect() {
        if (this._client) {
            // Tell them goodbye
            this._client.say(Constants.chatClientUserName, 'Twitch Themer has left the building!');

            this._client.disconnect();
            this.chatClientStatusEventEmitter.fire(TwitchClientStatus.chatDisconnected);
            this._client = null;
        }

        await this._themer.resetTheme();
    }

    public isConnected(): boolean {
        return this._client ? this._client.readyState() === "OPEN" : false;
    }

    private onConnectedHandler(address: string, port: number) {
        console.log(`Connected chat client ${address} : ${port}`);
    }

    private onJoinHandler(channel: string, username: string, self: boolean) {
        if (self && this._client) {
            // Tell them hello
            this._client.say(channel, 'Twitch Themer is ready to go. Listening for !theme list or !theme {theme name}');
        }
    }

    public whisper(twitchUser: string | undefined, message: string) {
        if (this.isConnected() && this._client && twitchUser !== undefined) {
            this._client.whisper(twitchUser, message);
        }
    }

    private async onMessageHandler(channel: string, userState: Userstate, message: string, self: boolean) {
        console.log(`Received ${message} from ${userState["display-name"]}`);
        if (self) { return; }
        if (!message) { return; }

        if (message.startsWith('!theme')) {
            await this._themer.handleCommands(userState["display-name"], '!theme', message.replace('!theme', '').trim());
        }
    }
}