# Twitch Themer

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/MichaelJolley.vscode-twitch-themer)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![Installs](https://img.shields.io/visual-studio-marketplace/i/MichaelJolley.vscode-twitch-themer?color=blue&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![MIT](https://img.shields.io/badge/license-MIT-orange.png?color=blue&style=flat-round)](https://opensource.org/licenses/MIT)

![CI](https://img.shields.io/github/actions/workflow/status/builders-club/vscode-twitch-themer/CI.yml?logo=github)<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-20-orange.png?style=flat-round)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

A Visual Studio Code extension that listens to twitch chat and allows viewers to change the streamers VS Code theme by using the **!theme** command.

![Screenshot of the extension in action]([./resources/screenshot-example.gif](https://github.com/build-with-me/vscode-twitch-themer/assets/1228996/7a8c1ca1-4648-49b7-a3e9-a47c46cff635))

## Quickstart Guide

To connect to your Twitch channel, click the Accounts button and click 
"Sign in with Twitch to use Twitch Themer".

![VS Code Accounts tab opened](https://github.com/builders-club/vscode-twitch-themer/assets/1228996/655088ba-6408-4170-9dbc-017ed97a34ba)

This will open a browser to authorize Twitch Themer to access your Twitch
chat.

Once you've authorized Twitch Themer, you can join Twitch chat by using the 
command palette (Ctrl+Shift+P) and searching for "Twitch Themer: Toggle Chat".

Once you've used Twitch Themer, an icon will display in the status bar allowing
you to toggle the connection to Twitch chat.

![Twitch Themer icon in the VS Code status bar](https://github.com/builders-club/vscode-twitch-themer/assets/1228996/b9433092-b999-4af4-a04e-7dc776c6bbe0)

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

Want to contribute? Check out our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs. This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://michaeljolley.com/"><img src="https://avatars2.githubusercontent.com/u/1228996?v=4" width="100px;" alt=""/><br /><sub><b>Michael Jolley</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=MichaelJolley" title="Code">💻</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=MichaelJolley" title="Documentation">📖</a> <a href="#design-MichaelJolley" title="Design">🎨</a> <a href="#ideas-MichaelJolley" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-MichaelJolley" title="Maintenance">🚧</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=MichaelJolley" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/PatPat1567"><img src="https://avatars0.githubusercontent.com/u/41209202?v=4" width="100px;" alt=""/><br /><sub><b>PatPat1567</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=PatPat1567" title="Code">💻</a> <a href="#ideas-PatPat1567" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=PatPat1567" title="Documentation">📖</a> <a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3APatPat1567" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://c-j.tech"><img src="https://avatars0.githubusercontent.com/u/3969086?v=4" width="100px;" alt=""/><br /><sub><b>Chris Jones</b></sub></a><br /><a href="#ideas-cmjchrisjones" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3Acmjchrisjones" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/parithon"><img src="https://avatars3.githubusercontent.com/u/8602418?v=4" width="100px;" alt=""/><br /><sub><b>Anthony Conrad</b></sub></a><br /><a href="#ideas-parithon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=parithon" title="Code">💻</a> <a href="#design-parithon" title="Design">🎨</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=parithon" title="Documentation">📖</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=parithon" title="Tests">⚠️</a> <a href="#maintenance-parithon" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://github.com/mholloway24"><img src="https://avatars2.githubusercontent.com/u/40776983?v=4" width="100px;" alt=""/><br /><sub><b>Mike Holloway</b></sub></a><br /><a href="#ideas-mholloway24" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/John-Kryspin"><img src="https://avatars2.githubusercontent.com/u/6597539?v=4" width="100px;" alt=""/><br /><sub><b>John Kryspin</b></sub></a><br /><a href="#ideas-John-Kryspin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=John-Kryspin" title="Code">💻</a> <a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3AJohn-Kryspin" title="Bug reports">🐛</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=John-Kryspin" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/majorthorn"><img src="https://avatars3.githubusercontent.com/u/10319786?v=4" width="100px;" alt=""/><br /><sub><b>majorthorn</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3Amajorthorn" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://surlydev.net"><img src="https://avatars1.githubusercontent.com/u/880671?v=4" width="100px;" alt=""/><br /><sub><b>SurlyDev</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=surlydev" title="Code">💻</a> <a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3Asurlydev" title="Bug reports">🐛</a> <a href="#ideas-surlydev" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://www.clarkio.com"><img src="https://avatars2.githubusercontent.com/u/6265396?v=4" width="100px;" alt=""/><br /><sub><b>Brian Clark</b></sub></a><br /><a href="#userTesting-clarkio" title="User Testing">📓</a></td>
    <td align="center"><a href="https://github.com/HeCodes2Much"><img src="https://avatars1.githubusercontent.com/u/9284733?v=4" width="100px;" alt=""/><br /><sub><b>Dakoda Jackson</b></sub></a><br /><a href="#userTesting-HeCodes2Much" title="User Testing">📓</a></td>
    <td align="center"><a href="https://github.com/Flyken271"><img src="https://avatars0.githubusercontent.com/u/39961800?v=4" width="100px;" alt=""/><br /><sub><b>Flyken</b></sub></a><br /><a href="#ideas-Flyken271" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/calebmckay"><img src="https://avatars0.githubusercontent.com/u/11079725?v=4" width="100px;" alt=""/><br /><sub><b>Caleb McKay</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=calebmckay" title="Tests">⚠️</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=calebmckay" title="Code">💻</a></td>
    <td align="center"><a href="http://murrayit.org"><img src="https://avatars0.githubusercontent.com/u/20172166?v=4" width="100px;" alt=""/><br /><sub><b>Chance Murray</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/issues?q=author%3Achancesm" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://twitch.tv/instafluff"><img src="https://avatars2.githubusercontent.com/u/35773245?v=4" width="100px;" alt=""/><br /><sub><b>Instafluff</b></sub></a><br /><a href="#ideas-instafluff" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jport"><img src="https://avatars2.githubusercontent.com/u/2206131?v=4" width="100px;" alt=""/><br /><sub><b>jport</b></sub></a><br /><a href="#ideas-jport" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://brunorocha.org"><img src="https://avatars2.githubusercontent.com/u/458654?v=4" width="100px;" alt=""/><br /><sub><b>Bruno Rocha</b></sub></a><br /><a href="#ideas-rochacbruno" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/dejansky"><img src="https://avatars2.githubusercontent.com/u/54706884?v=4" width="100px;" alt=""/><br /><sub><b>Dejan </b></sub></a><br /><a href="#ideas-dejansky" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/jwalter"><img src="https://avatars3.githubusercontent.com/u/349523?v=4" width="100px;" alt=""/><br /><sub><b>jwalter</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=jwalter" title="Code">💻</a> <a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=jwalter" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/Develeon64"><img src="https://avatars2.githubusercontent.com/u/14893682?v=4" width="100px;" alt=""/><br /><sub><b>Develeon</b></sub></a><br /><a href="#ideas-Develeon64" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://toefrog.github.io/Blog/"><img src="https://avatars0.githubusercontent.com/u/1122675?v=4" width="100px;" alt=""/><br /><sub><b>ToeFrog</b></sub></a><br /><a href="https://github.com/builders-club/vscode-twitch-themer/commits?author=ToeFrog" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
