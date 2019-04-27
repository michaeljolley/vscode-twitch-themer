.<p align="center">
![](./resources/logo.png)
</p>

# VSCode Twitch Themer Extension

A Visual Studio Code extension that listens to twitch chat and allows viewers to change the streamers VS Code theme by sending **!theme**

![](./resources/screenshot-example.gif)  

## Commands

| Theme | Description
| --- | ---
| !theme list | Sends a whisper to the viewer with a list of available themes
| !theme {named theme} | Sets the theme of VS Code to the theme specified
| !theme reset | Sets the theme of VS Code to the theme that was set when initially connecting to Twitch chat. (Allowing you to 'reset' it after your stream is over)

---

## How to connect to Twitch

- You can login to the twitch chat client using `Twitch Themer: Sign In` command. Execute the commands from vscode command pallete. This will open the Twitch Authentication page. Login to your twitch account. The token is stored in secure keystorage.

- You can logout from the chat once you are done with your twitch session.
- Connect to the chat client using `Twitch Themer: Chat Connect` command.
- Disconnect from the chat client using `Twitch Themer: Chat Disconnect` commands

---

## Notes

- Users will only receive up to one whisper per day with the list of available themes to prevent abuse of the `!theme list` command

- Only themes that are already installed within VS Code are available for users to select

---

## Credits

* Thanks to [Sivamuthu Kumar](https://github.com/ksivamuthu) for the authentication code that we blatantly plagiarized.
* Thanks to [Brian Clark](https://github.com/clarkio) for his videos on creating VS Code extensions and his [VSCode Twitch Highlighter](https://github.com/clarkio/vscode-twitch-highlighter) extension that really is what brought about the idea for this extension.