import * as vscode from 'vscode';
import { Userstate } from 'tmi.js';
import { IListRecipient } from './IListRecipient';
import { ITheme } from './ITheme';
import { IWhisperMessage } from '../chat/IWhisperMessage';
import { keytar } from '../Common';
import { KeytarKeys, AccessState } from '../Enum';
import { API } from '../api/API';
import { IChatMessage } from '../chat/IChatMessage';

/**
 * Manages all logic associated with retrieveing themes,
 * changing themes, etc.
 */
export class Themer {

    private _accessState: AccessState = AccessState.Viewers;
    private _originalTheme: string | undefined;
    private _availableThemes: Array<ITheme> = [];
    private _listRecipients: Array<IListRecipient> = [];
    private _followers: Array<IListRecipient> = [];
    private _currentUserLogin: string | undefined;

    private sendWhisperEventEmitter = new vscode.EventEmitter<IWhisperMessage>();
    private sendMessageEventEmitter = new vscode.EventEmitter<string>();

    /** Event that fires when themer needs to send a whisper */
    public onSendWhisper = this.sendWhisperEventEmitter.event;

    /** Event that fires when themer needs to send a message */
    public onSendMesssage = this.sendMessageEventEmitter.event;

    /**
     * constructor
     * @param _state - The global state of the extension
     * @param _context - Current extensions context
     */
    constructor(private _state: vscode.Memento, _context: vscode.ExtensionContext)
    {
        /**
         * Get the current theme so we can reset it later
         * via command or when disconnecting from chat
         */
        this._originalTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');

        /**
         * Gets the access state from the workspace
         */
        this._accessState = vscode.workspace.getConfiguration().get('twitchThemer.accessState', AccessState.Viewers);

        /**
         * Rehydrate the banned users from the extensions global state
         */
        this._state.get('bannedUsers', []).forEach(username => this._listRecipients.push({ username, banned: true }));
    }

    public async handleAuthStatusChanged(signedIn: boolean) {
        if (signedIn) {
            if (keytar) {
                const login = await keytar.getPassword(KeytarKeys.service, KeytarKeys.userLogin);
                this._currentUserLogin = login ? login : undefined;
                this.refreshThemes(this._currentUserLogin);
            }
        }
        else {
            this._currentUserLogin = undefined;
            this.resetTheme(undefined);
        }
    }

    /**
     * Updates access state of extension
     * @param accessState - New access state
     */
    public handleAccessStateChanged(accessState: AccessState){
        this._accessState = accessState;
    }

    /**
     * Attempts to process commands received by users in Twitch chat
     * @param twitchUser - Username of person sending the command
     * @param message - Optional additional parameters sent by user
     */
    public async handleCommands(chatMessage: IChatMessage) {

        const twitchUser: Userstate = chatMessage.userState;
        let message: string = chatMessage.message;

        const twitchUserName = twitchUser["display-name"];

        let username: string  | undefined;
        /** Determine if the param is a (un)ban request */
        const ban = message.match(/((?:!)?ban) (\w*)/);
        if (ban) {
            message = ban[1] || ''; // Change the param to 'ban' or 'unban'
            username = ban[2]; // The username to ban
        }

        switch (message) {
            case '':
                await this.sendThemes(twitchUserName);
                break;
            case 'current':
                await this.currentTheme();
                break;
            case 'reset':
                await this.resetTheme(twitchUser);
                break;
            case 'random':
                await this.randomTheme(twitchUser);
                break;
            case 'refresh':
                await this.refreshThemes(twitchUserName);
                break;
            case 'ban':
                await this.ban(twitchUserName, username);
                break;
            case '!ban':
                await this.unban(twitchUserName, username);
                break;
            default:
                await this.changeTheme(twitchUser, message);
                break;
        }
    }

    /**
     * Retrieves an IListRecipient
     * @param twitchUser The user to retrieve from the list of recipients
     * @param banned (optional) Include only recipients that are banned
     */
    private getRecipient(twitchUser: string, banned?: boolean): IListRecipient | undefined {
        return this._listRecipients.filter(f => f.username.toLocaleLowerCase() === twitchUser.toLocaleLowerCase()
                                             && f.banned === banned)[0];
    }

    /**
     * Updates the state of the extension
     */
    private updateState() {
        const bannedUsers = this._listRecipients
            .filter(recipient => recipient.banned && recipient.banned === true)
            .map(recipient => recipient.username);

        this._state.update('bannedUsers', bannedUsers);
    }

    /**
     * Bans a user from using the themer plugin.
     * @param twitchUser The user requesting the ban
     * @param username The user to ban
     */
    private async ban(twitchUser: string | undefined, username: string | undefined) {
        if (twitchUser !== undefined &&
            username !== undefined)  {
            const recipient = this.getRecipient(username);
            if (recipient === undefined) {
                this._listRecipients.push({username: username.toLocaleLowerCase(), banned: true});
                console.log(`${username} has been banned from using the themer plugin.`);
                this.updateState();
            }
        }
    }

    /**
     * Unbans a user allowing them to use the themer plugin.
     * @param twitchUser The user requesting the unban
     * @param username The user to unban
     */
    private async unban(twitchUser: string | undefined, username: string | undefined) {
        if (twitchUser !== undefined &&
            this._currentUserLogin &&
            twitchUser.toLocaleLowerCase() === this._currentUserLogin.toLocaleLowerCase() &&
            username !== undefined) {
            const recipient = this.getRecipient(username, true);
            if (recipient !== undefined) {
                const index = this._listRecipients.indexOf(recipient);
                recipient.banned = false;
                this._listRecipients.splice(index, 1, recipient);
                console.log(`${username} can now use the themer plugin.`);
                this.updateState();
            }
        }
    }

    /**
     * Send a whisper to the requesting user with a list of available themes
     * @param twitchUser - User that will receive whisper of available themes
     */
    private async sendThemes(twitchUser: string | undefined) {
        if (twitchUser !== undefined) {
            /** Ensure that we haven't sent them the list recently. */
            const lastSent = this.getRecipient(twitchUser);

            if (lastSent && lastSent.banned && lastSent.banned === true) {
                console.log(`${twitchUser} has been banned.`);
                return;
            }

            if (lastSent && lastSent.lastSent) {
                if (lastSent.lastSent.getDate() > ((new Date()).getDate() + -1)) {
                    return;
                } else {
                    lastSent.lastSent = new Date();
                }
            }
            else {
                this._listRecipients.push({username: twitchUser.toLowerCase(), lastSent: new Date()});
            }

            /** Get list of available themes and whisper them to user */
            const themeNames = this._availableThemes.map(m => m.label);
            this.sendWhisperEventEmitter.fire({user: twitchUser, message: `Available themes are: ${themeNames.join(', ')}`});
        }
    }

    /**
     * Resets the theme to the one that was active when the extension was loaded
     * @param twitchUser - pass through the twitch user state
     */
    public async resetTheme(twitchUser: Userstate | undefined) {
        if (this._originalTheme) {
            await this.changeTheme(twitchUser, this._originalTheme);
        }
    }

    /**
     * Refreshes the list of available themes
     * @param twitchUser - Username of user requesting to refresh the theme list
     */
    private async refreshThemes(twitchUser: string | undefined) {

        /** We only refresh the list of themes
         * if the requester was the logged in user
         */
        if (twitchUser !== undefined &&
            this._currentUserLogin &&
            twitchUser.toLocaleLowerCase() === this._currentUserLogin.toLocaleLowerCase()) {
            vscode.extensions.all.filter(f => f.packageJSON.contributes &&
                                              f.packageJSON.contributes.themes &&
                                              f.packageJSON.contributes.themes.length > 0)
                            .forEach((fe: any) => {
                            const iThemes = fe.packageJSON.contributes.themes.map((m: any) => {
                                                            return { extensionId: fe.id, label: m.label, themeId: m.id };});

                            this._availableThemes = (this._availableThemes.concat.apply(
                                                                        this._availableThemes,
                                                                        iThemes)
                                                                    .filter(() => true));
                            });

                            /**
                            * The only reasons to refresh the list of themes is because
                            * the user has added or removed theme extensions. Since the
                            * list of available themes has changed we should allow users
                            * to re-request the list of themes so they can continue playing.
                            */
                            this.clearListRecipients();
        }
    }

    /**
     * Changes the theme to a random option from all available themes
     * @param twitchUser - pass through twitch user state
     */
    private async randomTheme(twitchUser: Userstate) {
        const max = this._availableThemes.length;
        const randomNumber = Math.floor(Math.random() * max);
        const chosenTheme = this._availableThemes[randomNumber].label;
        await this.changeTheme(twitchUser, chosenTheme);
    }

    /**
     * Changes the active theme to the one specified
     * @param twitchUser - User state of who requested the theme be applied
     * @param themeName - Name of the theme to be applied
     */
    private async changeTheme(twitchUser: Userstate | undefined, themeName: string) {

        let twitchUserName : string = (twitchUser) ? twitchUser["display-name"] || "" : "";

        following:
        if (this._accessState === AccessState.Followers) {
            if (this._currentUserLogin &&
                twitchUserName.toLocaleLowerCase() === this._currentUserLogin.toLocaleLowerCase()) {
                // broadcaster cannot follow their own stream. Temporary work around to mark broadcaster as follower.
                break following;
            } else if (this._followers.find(x => x.username === twitchUserName.toLocaleLowerCase())) {
                break following;
            } else if (twitchUser && await API.isTwitchUserFollowing(twitchUser["user-id"])) {
                this._followers.push({username: twitchUserName ? twitchUserName.toLocaleLowerCase() : ""});
                break following;
            } else {
                console.log (`${twitchUserName} is not following.`);
                return;
            }
        } else {
            break following;
        }

        subscriber:
        if (this._accessState === AccessState.Subscribers) {
            if (this._currentUserLogin &&
                twitchUserName.toLocaleLowerCase() === this._currentUserLogin.toLocaleLowerCase()) {
                // broadcaster cannot subscribe to their own stream if they are not an affiate or partner.
                break subscriber;
            } else if (twitchUser && twitchUser["subscriber"]) {
                break subscriber;
            } else {
                console.log (`${twitchUserName} is not a subscriber.`);
                return;
            }
        } else {
            break subscriber;
        }

        /** Ensure the user hasn't been banned before changing the theme */
        if (twitchUserName) {
            const recipient = this.getRecipient(twitchUserName, true);
            if (recipient && recipient.banned && recipient.banned === true) {
                console.log(`${twitchUserName} has been banned.`);
                return;
            }
        }

        /** Find theme based on themeName and change theme if it is found */
        const theme = this._availableThemes.filter(f => f.label.toLocaleLowerCase() === themeName.toLocaleLowerCase() ||
                                                        f.themeId && f.themeId.toLocaleLowerCase() === themeName.toLocaleLowerCase())[0];

        if (theme) {
            const themeExtension = vscode.extensions.getExtension(theme.extensionId);

            if (themeExtension !== undefined) {
                const conf = vscode.workspace.getConfiguration();
                await themeExtension.activate().then(async f => {
                    await conf.update('workbench.colorTheme', theme.themeId || theme.label, vscode.ConfigurationTarget.Global);
                    if (twitchUserName) {
                        vscode.window.showInformationMessage(`Theme changed to ${theme.label} by ${twitchUserName}`);
                    }
                });
            }
        }
        else {
            this.sendMessageEventEmitter.fire(`${twitchUserName}, ${themeName} is not a valid theme name or isn't installed.  You can use !theme list to get a list of available themes.`);
        }
    }

    /**
     * Announces to chat the currently active theme
     */
    private async currentTheme() {
        const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
        this.sendMessageEventEmitter.fire(`The current theme is ${currentTheme}`);
    }

    /**
     * Clears the list of recipients so they can request the list of themes again
     */
    private clearListRecipients() {
        this._listRecipients = [];
    }
}
