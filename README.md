.<p align="center">
![](./resources/themerIcon.png)
</p>

# VSCode Twitch Themer Extension

A Visual Studio Code extension that listens your twitch chat and allows viewers to change the vscode theme by sending **!theme**

## Features

Twitch chatters can change the theme of your workspace from chat command:- **!theme**
  * a random color
  * cop mode 
  * rainbow mode
  * the primary color for angular, vue, or react

![](./resources/screenshot-example.gif)  

List of commands:

* !theme list - Sends a whisper to the viewer with a list of available themes. `Will only send once per day to control throttling.`
* !theme [named theme] - Sets the theme of VS Code to the theme specified. `Must be a name recognized by the extension & already installed.`

## How to connect to Twitch
* You can login to the twitch chat client using `Twitch Themer: Sign In` command. Execute the commands from vscode command pallete. This will open the Twitch Authentication page. Login to your twitch account. The token is stored in secure keystorage.


* You can logout from the chat once you are done with your twitch session.
* Connect to the chat client using `Twitch Themer: Chat Connect` command.
* Disconnect from the chat client using `Twitch Themer: Chat Disconnect` commands

## Credits

* Thanks to [Sivamuthu Kumar](https://github.com/ksivamuthu) for 
* Thanks to [Brian Clark](https://github.com/clarkio) for 