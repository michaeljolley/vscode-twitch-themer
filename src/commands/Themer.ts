import * as vscode from 'vscode';
import ChatClient from '../chat/ChatClient';
import { join } from 'path';

export class Themer {

    private _originalTheme: string | undefined;
    private _availableThemes: Array<ITheme> = [];
    private _listRecipients: Array<IListRecipient> = [];

    constructor(private _chatClient: ChatClient) 
    {
        this._originalTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');

        vscode.extensions.all.filter(f => f.packageJSON.contributes &&
                                          f.packageJSON.contributes.themes &&
                                          f.packageJSON.contributes.themes.length > 0)
                             .forEach((fe: any) => {
                                let iThemes = fe.packageJSON.contributes.themes.map((m: any) => {
                                                                            return { id: fe.id, label: m.label, themeId: m.id || m.label };});
                                                                            
                                this._availableThemes = (this._availableThemes.concat.apply(
                                                                                        this._availableThemes,
                                                                                        iThemes)
                                                                                     .filter(() => true));
                             });
    }

    public async handleCommands(twitchUser: string | undefined, command: string, param: string) {
        if (command !== '!theme') {
            return;
        }
        param = param.toLowerCase().trim();

        if (param === '') {
            await this.currentTheme();
        } else if (param === 'list') {
            // Whisper list of avaiable themes back to user
            await this.sendThemes(twitchUser);
        } else if (param === 'reset') {
            this.resetTheme();
        } else if (param === 'random') {
            this.randomTheme(twitchUser);
        } else {
            this.changeTheme(twitchUser, param);
        }
    }

    private async sendThemes(twitchUser: string | undefined) {
        if (twitchUser !== undefined) {
            // Ensure that we haven't sent them the list recently.
            let lastSent: IListRecipient | undefined = this._listRecipients.filter(f => f.username.toLowerCase() === twitchUser.toLowerCase())[0];

            if (lastSent) {
                if (lastSent.lastSent.getDate() > ((new Date()).getDate() + -1)) {
                    return;
                } else {
                    lastSent.lastSent = new Date();
                }
            }
            else {
                this._listRecipients.push({username: twitchUser.toLowerCase(), lastSent: new Date()});
            }

            // Get list of available themes and whisper them to user
            let themeNames = this._availableThemes.map(m => m.label);
            this._chatClient.whisper(twitchUser, `Available themes are: ${themeNames.join(', ')}`);
        }
    }
    
    public async resetTheme() {
        if (this._originalTheme) {
            await this.changeTheme(undefined, this._originalTheme);
        }
    }

    private async randomTheme(twitchUser: string | undefined) {
        const max = this._availableThemes.length;
        const randomNumber = Math.floor(Math.random() * max);
        const chosenTheme = this._availableThemes[randomNumber].label;
        await this.changeTheme(twitchUser, chosenTheme);
    }

    private async changeTheme(twitchUser: string | undefined, themeName: string) {
        // Find theme based on themeName and change theme if it is found
        let theme = this._availableThemes.filter(f => f.label.toLowerCase() === themeName.toLowerCase())[0];

        if (theme) {  
            let x = vscode.extensions.getExtension(theme.id);
        
            if (x !== undefined) {
                let conf = vscode.workspace.getConfiguration();
                x.activate().then(f => { 
                    conf.update('workbench.colorTheme', theme.themeId, vscode.ConfigurationTarget.Global);
                    if (twitchUser) {
                        vscode.window.showInformationMessage(`Theme changed to ${theme.label} by ${twitchUser}`);
                    }
                });
            }
        }
    }

    private async currentTheme() {
        const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
        this._chatClient.sendMessage(`The current theme is ${currentTheme}`);
    }
}

export interface ITheme {
    id: string;
    label: string;
    themeId: string;
}

export interface IListRecipient {
    username: string;
    lastSent: Date;
}