import * as vscode from 'vscode';
import { Userstate } from 'tmi.js';
import { IListRecipient } from './IListRecipient';
import { ITheme } from './ITheme';
import { IWhisperMessage } from '../chat/IWhisperMessage';
import { keytar } from '../Common';
import { KeytarKeys, AccessState, UserLevel } from '../Enum';
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
     */
    constructor(private _state: vscode.Memento)
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
                const tempUserState: Userstate = {'username': this._currentUserLogin, 'display-name': this._currentUserLogin, 'badges': { 'broadcaster': '1' } };
                this.refreshThemes(tempUserState);
            }
        }
        else {
            const tempUserState: Userstate = {'username': this._currentUserLogin, 'display-name': this._currentUserLogin, 'badges': { 'broadcaster': '1' } };
            this._currentUserLogin = undefined;
            this.resetTheme(tempUserState);
        }
    }

    /**
     * Updates access state of extension
     * @param accessState - New access state
     */
    public handleAccessStateChanged(accessState: AccessState){
        this._accessState = accessState;
    }

    private getUserLevel(userState: Userstate): UserLevel {

        if (userState.badges) {
            if (userState.badges.broadcaster) {
                return UserLevel.broadcaster;
            }
            else if (userState.badges.moderator) {
                return UserLevel.moderator;
            }
        }

        return UserLevel.viewer;
    }

    /**
     * Attempts to process commands received by users in Twitch chat
     * @param twitchUser - Username of person sending the command
     * @param message - Optional additional parameters sent by user
     */
    public async handleCommands(chatMessage: IChatMessage) {

        const twitchUser: Userstate = chatMessage.userState;
        let message: string = chatMessage.message;

        let username: string  | undefined;
        /** Determine if the param is a (un)ban request */
        const ban = message.match(/((?:!)?ban) (\w*)/);
        if (ban) {
            message = ban[1] || ''; // Change the param to 'ban' or 'unban'
            username = ban[2]; // The username to ban
        }

        switch (message) {
            case '':
                await this.sendThemes(twitchUser);
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
                await this.refreshThemes(twitchUser);
                break;
            case 'ban':
                if (username !== undefined) {
                    await this.ban(twitchUser, username);
                }
                break;
            case '!ban':
                if (username !== undefined) {
                    await this.unban(twitchUser, username);
                }
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
    private async ban(twitchUser: Userstate, username: string) {
        if (this.getUserLevel(twitchUser) > UserLevel.viewer)  {
            const recipient = this.getRecipient(username);
            if (recipient === undefined) {
                this._listRecipients.push({username: username.toLocaleLowerCase(), banned: true});
            }
            else {
                const index = this._listRecipients.indexOf(recipient);
                recipient.banned = true;
                this._listRecipients.splice(index, 1, recipient);
            }
            this.updateState();
            console.log(`${username} has been banned from using the themer plugin.`);
        }
    }

    /**
     * Unbans a user allowing them to use the themer plugin.
     * @param twitchUser The user requesting the unban
     * @param username The user to unban
     */
    private async unban(twitchUser: Userstate, username: string) {
        if (this.getUserLevel(twitchUser) > UserLevel.viewer) {
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
    private async sendThemes(twitchUser: Userstate) {
        const twitchUserName: string = twitchUser.username.toLocaleLowerCase();

        /** Ensure that we haven't sent them the list recently. */
        const lastSent = this.getRecipient(twitchUserName);

        if (lastSent && lastSent.banned && lastSent.banned === true) {
            console.log(`${twitchUserName} has been banned.`);
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
            this._listRecipients.push({username: twitchUserName, lastSent: new Date()});
        }

        /** Get list of available themes and whisper them to user */
        const themeNames = this._availableThemes.map(m => m.label);
        this.sendWhisperEventEmitter.fire({user: twitchUserName, message: `Available themes are: ${themeNames.join(', ')}`});

    }

    /**
     * Resets the theme to the one that was active when the extension was loaded
     * @param twitchUser - pass through the twitch user state
     */
    public async resetTheme(twitchUser: Userstate) {
        if (this._originalTheme) {
            await this.changeTheme(twitchUser, this._originalTheme);
        }
    }

    /**
     * Refreshes the list of available themes
     * @param twitchUser - Userstate of user requesting to refresh the theme list
     */
    private async refreshThemes(twitchUser: Userstate) {

        /** We only refresh the list of themes
         * if the requester was a moderator/broadcaster
         */
        if (this.getUserLevel(twitchUser) > UserLevel.viewer) {
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
    private async changeTheme(twitchUser: Userstate, themeName: string) {

        const twitchUserName: string = twitchUser.username;
        const twitchDisplayName: string = twitchUser["display-name"] ? twitchUser["display-name"] : twitchUserName;

        following:
        if (this._accessState === AccessState.Followers) {
            if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
                break following;
            } else if (this._followers.find(x => x.username === twitchUserName.toLocaleLowerCase())) {
                break following;
            } else if (twitchUser && await API.isTwitchUserFollowing(twitchUser["user-id"])) {
                this._followers.push({username: twitchUserName ? twitchUserName.toLocaleLowerCase() : ""});
                break following;
            } else {
                console.log (`${twitchDisplayName} is not following.`);
                return;
            }
        } else {
            break following;
        }

        subscriber:
        if (this._accessState === AccessState.Subscribers) {
            if (this.getUserLevel(twitchUser) === UserLevel.broadcaster) {
                break subscriber;
            } else if (twitchUser && twitchUser["subscriber"]) {
                break subscriber;
            } else {
                console.log (`${twitchDisplayName} is not a subscriber.`);
                return;
            }
        } else {
            break subscriber;
        }

        /** Ensure the user hasn't been banned before changing the theme */
        if (twitchUserName) {
            const recipient = this.getRecipient(twitchUserName, true);
            if (recipient && recipient.banned && recipient.banned === true) {
                console.log(`${twitchDisplayName} has been banned.`);
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
                        vscode.window.showInformationMessage(`Theme changed to ${theme.label} by ${twitchDisplayName}`);
                    }
                });
            }
        }
        else {
            this.sendMessageEventEmitter.fire(`${twitchDisplayName}, ${themeName} is not a valid theme name or isn't installed.  You can use !theme to get a list of available themes.`);
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
