# Twitch Themer

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/MichaelJolley.vscode-twitch-themer)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![Installs](https://img.shields.io/visual-studio-marketplace/i/MichaelJolley.vscode-twitch-themer?color=blue&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![CI](https://img.shields.io/github/actions/workflow/status/michaeljolley/vscode-twitch-themer/CI.yml?logo=github)](https://github.com/michaeljolley/vscode-twitch-themer/actions/workflows/CI.yml) [![MIT](https://img.shields.io/badge/license-MIT-orange.png?color=blue&style=flat-round)](https://opensource.org/licenses/MIT)

A Visual Studio Code extension that listens to twitch chat and allows viewers to change the streamers VS Code theme by using the **!theme** command.

![Screenshot of the extension in action](https://github-production-user-asset-6210df.s3.amazonaws.com/1228996/260170623-7a8c1ca1-4648-49b7-a3e9-a47c46cff635.png)

## Quickstart Guide

To connect to your Twitch channel, click the Accounts button and click 
"Sign in with Twitch to use Twitch Themer".

![VS Code Accounts tab opened](https://github.com/michaeljolley/vscode-twitch-themer/assets/1228996/655088ba-6408-4170-9dbc-017ed97a34ba)

This will open a browser to authorize Twitch Themer to access your Twitch
chat.

Once you've authorized Twitch Themer, you can join Twitch chat by using the 
command palette (Ctrl+Shift+P) and searching for "Twitch Themer: Toggle Chat".

Once you've used Twitch Themer, an icon will display in the status bar allowing
you to toggle the connection to Twitch chat.

![Twitch Themer icon in the VS Code status bar](https://github.com/michaeljolley/vscode-twitch-themer/assets/1228996/b9433092-b999-4af4-a04e-7dc776c6bbe0)

Then you're done. Now viewers can use the `!theme` command to change your
VS Code theme.

## Twitch Chat Commands

### !theme {theme name}

This command will set the theme of the streamers' VS Code workspace to the theme specified.

```
!theme Dracula
```

> Note: The theme must be previously installed and available within VS Code.

### !theme random

This command will set the theme of the streamers' VS Code workspace to a theme that is chosen at random. If `dark` or `light` is specified it will only select
a random theme from the appropriate option.

```
!theme random

!theme random dark

!theme random light
```

#### !theme install

This command will look for the specified theme on the Visual Studio Marketplace. If found, it will attempt to pull the package.json for the theme from its repository. If that package.json includes themes, the streamer will be prompted to install, not install and/or preview the theme.

```
!theme install {Theme Unique Identifier}
```

> **Example**: For the [Linux Themes for VS Code](https://marketplace.visualstudio.com/items?itemName=solarliner.linux-themes) extension, you would send `!theme install solarliner.linux-themes`
 
### !theme reset

This command will set the theme of the streamers' VS Code workspace back to the theme that was used at the time the extension connected to chat.

```
!theme reset
```

> Note: Every time the extension disconnects from chat, the theme will be reset.

### !theme current

This will send the currently active theme to Twitch chat.

```
!theme current
```

### !theme help

This will send a message to Twitch chat explaining the available commands.

```
!theme help
```

### !theme ban or !ban

These commands will either ban or unban a user from changing the theme via 
Twitch chat.

```
!theme ban {username}

!theme !ban {username}
```

> Note: List of banned users will reset on extension activation/start up.

#### !theme repo

This will send a message to Twitch chat letting everyone know where to access the source for this extension.

```
!theme repo
```

---

## Settings

<img width="400px" src="https://user-images.githubusercontent.com/1228996/59153253-bf03f080-8a1a-11e9-9dc3-9fe92b3cb413.png" />

### Access State

On the settings UI, you can specify whether the extension should only react to 
all viewers, followers, VIPs, subscribers, moderators, or only the broadcaster.

### Auto Connect

This setting will toggle whether the extension will automatically connect to Twitch when you launch Visual Studio Code.

_The extension will ensure you are streaming prior to connecting the bot to the Twitch chat service._

### Twitch Channel to Join

By default, the extension will join the Twitch chat of the authenticated user. However,
you can specify a different channel to join here. This is useful if you want to use
a second "bot" account to send messages to chat.

### Auto Install

This setting will toggle whether the extension will automatically install requested themes or show a prompt.

### Command Triggers

You can change the trigger commands for the bot. For example, you can change `!theme` to `!colour` by changing the **Theme Command** setting.

---

#### Available Triggers

| Trigger | Example                          | Description                                           |
| ------- | -------------------------------- | ----------------------------------------------------- |
| theme   | !theme                           | The main trigger for the bot                          |
| random  | !theme random                    | Randomly changes the theme of vscode                  |
| dark    | !theme random dark               | Randomly chooses a dark theme                         |
| light   | !theme random light              | Randomly chooses a light theme                        |
| current | !theme current                   | The bot will say the current in chat                  |
| install | !theme install {theme-unique-id} | Installs a theme extension                            |
| help    | !theme help                      | The bot will give some guidance in chat               |
| ban     | !theme ban {username}            | This will ban a user from using the command           |
| repo    | !theme repo                      | The bot will say the repo location for this extension |

---

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

---

## Contributing

Want to contribute? Check out our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs. Contributions of any kind welcome!
