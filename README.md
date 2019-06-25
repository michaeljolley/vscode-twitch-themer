# Twitch Themer

[![Marketplace](https://vsmarketplacebadge.apphb.com/version/MichaelJolley.vscode-twitch-themer.svg?color=blue&style=?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/MichaelJolley.vscode-twitch-themer.svg?color=blue&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=MichaelJolley.vscode-twitch-themer) [![MIT](https://img.shields.io/badge/license-MIT-orange.svg?color=blue&style=flat-square)](https://opensource.org/licenses/MIT)

| Release | vNext | Contributors
| -- | -- | --
| [![Build Status](https://dev.azure.com/michaeljolley/vscode-twitch-themer/_apis/build/status/MichaelJolley.vscode-twitch-themer?branchName=master)](https://dev.azure.com/michaeljolley/vscode-twitch-themer/_build/latest?definitionId=1&branchName=master) | [![Build Status](https://dev.azure.com/michaeljolley/vscode-twitch-themer/_apis/build/status/MichaelJolley.vscode-twitch-themer?branchName=vNext)](https://dev.azure.com/michaeljolley/vscode-twitch-themer/_build/latest?definitionId=1&branchName=vNext) | [![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors)


A Visual Studio Code extension that listens to twitch chat and allows viewers to change the streamers VS Code theme by sending **!theme**

![](./resources/screenshot-example.gif)

## Twitch Chat Commands

#### Receive a list of available theme names

This will send a list of installed VS Code themes to the requestor via whisper.

```
!theme
```

`Note: Only 1 whisper per user will be sent per day.`

#### Send response to chat of current theme

This will send the currently active theme to Twitch chat.

```
!theme current
```

#### Send info about this GitHub repo to chat

This will send a message to Twitch chat letting everyone know where to access the source for this extension.

```
!theme repo
```

#### Set VS Code theme

This command will set the theme of the streamers' VS Code workspace to the theme specified.

```
!theme {theme name}
```

`Note: The theme must be previously installed and available within VS Code.`

#### Set Random VS Code theme

This command will set the theme of the streamers' VS Code workspace to a theme that is chosen at random.

```
!theme random
```

`Note: The theme must be previously installed and available within VS Code.`

#### Reset VS Code theme

This command will set the theme of the streamers' VS Code workspace back to the theme that was used at the time the extension connected to chat.

```
!theme reset
```

`Note: Everytime the extension disconnects from chat, the theme will be reset.`

#### Refresh VS Code themes

This command will refresh the list of available themes in the streamers VS Code instance.  Will also reset everyones ability to request the list of available themes.  Primarily used when themes are added/removed mid-stream.

```
!theme refresh
```

`Note: List of themes and request timers will only be reset if the command is sent from the broadcaster.`

#### Ban/Unban user from changing themes

These commands will either ban or unban a user from changing the theme via Twitch chat.

```
!theme ban {username}

!theme !ban {username}
```

`Note: List of banned users will reset on extension activation/start up.`

----

## Settings

<img width="400px" src="https://user-images.githubusercontent.com/1228996/59153253-bf03f080-8a1a-11e9-9dc3-9fe92b3cb413.png" />

#### Access State

On the settings UI, you can specify whether the extension should only react to all viewers, only followers or only subscribers.

----

## Connecting / Disconnecting Twitch Chat

<img width="250px" src="https://user-images.githubusercontent.com/1228996/59153329-338b5f00-8a1c-11e9-8086-07619ea691d3.png" />

If you are signed in to Twitch you'll see your username next to the Twitch Themer paint bucket icon.

Click on the icon to toggle between connecting/disconnecting from Twitch chat.

----

## Command Palette

#### Twitch Themer: Sign In

Opens the Twitch Authentication page. Login to your Twitch account to access chat.

#### Twitch Themer: Sign Out

Removes your Twitch authentication and, if connected, leaves Twitch chat.

---

## Attribution & Credits

* Thanks to [Sivamuthu Kumar](https://github.com/ksivamuthu) for the authentication code that we blatantly plagiarized from his [VSCode Peacock Twitch Extension](https://github.com/ksivamuthu/vscode-peacock-twitch-client).
* Thanks to [Brian Clark](https://github.com/clarkio) for his videos on creating VS Code extensions and his [VSCode Twitch Highlighter](https://github.com/clarkio/vscode-twitch-highlighter) extension that really is what brought about the idea for this extension.

----

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

----

## Contributing

Want to contribute? Check out our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs. This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.  Contributions of any kind welcome!

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://michaeljolley.com/"><img src="https://avatars2.githubusercontent.com/u/1228996?v=4" width="100px;" alt="Michael Jolley"/><br /><sub><b>Michael Jolley</b></sub></a><br /><a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=MichaelJolley" title="Code">💻</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=MichaelJolley" title="Documentation">📖</a> <a href="#design-MichaelJolley" title="Design">🎨</a> <a href="#ideas-MichaelJolley" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-MichaelJolley" title="Maintenance">🚧</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=MichaelJolley" title="Tests">⚠️</a></td><td align="center"><a href="https://github.com/PatPat1567"><img src="https://avatars0.githubusercontent.com/u/41209202?v=4" width="100px;" alt="PatPat1567"/><br /><sub><b>PatPat1567</b></sub></a><br /><a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=PatPat1567" title="Code">💻</a> <a href="#ideas-PatPat1567" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=PatPat1567" title="Documentation">📖</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/issues?q=author%3APatPat1567" title="Bug reports">🐛</a></td><td align="center"><a href="https://c-j.tech"><img src="https://avatars0.githubusercontent.com/u/3969086?v=4" width="100px;" alt="Chris Jones"/><br /><sub><b>Chris Jones</b></sub></a><br /><a href="#ideas-cmjchrisjones" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/issues?q=author%3Acmjchrisjones" title="Bug reports">🐛</a></td><td align="center"><a href="https://github.com/parithon"><img src="https://avatars3.githubusercontent.com/u/8602418?v=4" width="100px;" alt="Anthony Conrad"/><br /><sub><b>Anthony Conrad</b></sub></a><br /><a href="#ideas-parithon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=parithon" title="Code">💻</a> <a href="#design-parithon" title="Design">🎨</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=parithon" title="Documentation">📖</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=parithon" title="Tests">⚠️</a> <a href="#maintenance-parithon" title="Maintenance">🚧</a></td><td align="center"><a href="https://github.com/mholloway24"><img src="https://avatars2.githubusercontent.com/u/40776983?v=4" width="100px;" alt="Mike Holloway"/><br /><sub><b>Mike Holloway</b></sub></a><br /><a href="#ideas-mholloway24" title="Ideas, Planning, & Feedback">🤔</a></td><td align="center"><a href="https://github.com/John-Kryspin"><img src="https://avatars2.githubusercontent.com/u/6597539?v=4" width="100px;" alt="John Kryspin"/><br /><sub><b>John Kryspin</b></sub></a><br /><a href="#ideas-John-Kryspin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=John-Kryspin" title="Code">💻</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/issues?q=author%3AJohn-Kryspin" title="Bug reports">🐛</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=John-Kryspin" title="Tests">⚠️</a></td><td align="center"><a href="https://github.com/majorthorn"><img src="https://avatars3.githubusercontent.com/u/10319786?v=4" width="100px;" alt="majorthorn"/><br /><sub><b>majorthorn</b></sub></a><br /><a href="https://github.com/MichaelJolley/vscode-twitch-themer/issues?q=author%3Amajorthorn" title="Bug reports">🐛</a></td></tr><tr><td align="center"><a href="http://surlydev.net"><img src="https://avatars1.githubusercontent.com/u/880671?v=4" width="100px;" alt="SurlyDev"/><br /><sub><b>SurlyDev</b></sub></a><br /><a href="https://github.com/MichaelJolley/vscode-twitch-themer/commits?author=surlydev" title="Code">💻</a> <a href="https://github.com/MichaelJolley/vscode-twitch-themer/issues?q=author%3Asurlydev" title="Bug reports">🐛</a></td><td align="center"><a href="https://www.clarkio.com"><img src="https://avatars2.githubusercontent.com/u/6265396?v=4" width="100px;" alt="Brian Clark"/><br /><sub><b>Brian Clark</b></sub></a><br /><a href="#userTesting-clarkio" title="User Testing">📓</a></td><td align="center"><a href="https://github.com/HeCodes2Much"><img src="https://avatars1.githubusercontent.com/u/9284733?v=4" width="100px;" alt="Dakoda Jackson"/><br /><sub><b>Dakoda Jackson</b></sub></a><br /><a href="#userTesting-HeCodes2Much" title="User Testing">📓</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->
