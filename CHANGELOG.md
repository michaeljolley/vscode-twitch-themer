## [2.1.1](https://github.com/builders-club/vscode-twitch-themer/compare/v2.1.0...v2.1.1) (2023-08-10)


### Bug Fixes

* twitch api failures no longer crash the extension ([f6d3ace](https://github.com/builders-club/vscode-twitch-themer/commit/f6d3acea1534c469f2864bf2f948cfba5a35ea88))

# [2.1.0](https://github.com/builders-club/vscode-twitch-themer/compare/v2.0.11...v2.1.0) (2023-06-06)


### Features

* Twitch custom point redemptions are now logged in the output ([d027ea9](https://github.com/builders-club/vscode-twitch-themer/commit/d027ea9a80f02814b4603768fddf9dd8de831d0c))

## [2.0.11](https://github.com/builders-club/vscode-twitch-themer/compare/v2.0.10...v2.0.11) (2023-06-06)


### Bug Fixes

* Extension now sends list of available themes to chat rather than whisper ([20330bf](https://github.com/builders-club/vscode-twitch-themer/commit/20330bfddb54dcb438c8b25f88db79362e1ed9ab))

## [2.0.10](https://github.com/builders-club/vscode-twitch-themer/compare/v2.0.9...v2.0.10) (2023-05-26)


### Bug Fixes

* **ci:** removed test step for release step ([1a069af](https://github.com/builders-club/vscode-twitch-themer/commit/1a069af1cf42b49ef2685fbe27cda08fcf132868))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [2.0.0] - 2023-03-14

### Updated

- Updated to use the new VS Code extensions API
- Replaced node-fetch with axios

## [1.7.8] - 2021-02-11

### Fixed

- Resolved issue that prevented whispers of available themes from being sent to users
- Resolved issue that prevented users from installing themes

## [1.7.0] - 2020-11-05

### Added

- Added the ability to change the triggers used for the bot
- Added capability to pause the themer for {x} minutes based on channel point redemptions
- Added new access level for VIPs

## [1.6.4] - 2020-07-28

### Added

- Added improved logging throughout the extension

## [1.6.3] - 2020-05-28

### Fixed

- Fixed issue with packaging extension that prevented publishing to the VS Code marketplace

## [1.6.1] - 2020-05-23

### Fixed

- Fixed issue caused by a change to authentication in the Twitch API

## [1.5.0] - 2020-03-05

### Added

- Themer will now connect automatically if you turn on the `autoConnect` setting AND you're
  already streaming when you open Visual Studio Code. _NOTE: The check to see if you're streaming will only occur **once** when you open vscode._

## [1.4.1] - 2020-01-05

### Fixes

- When requesting to install a theme that's already installed, the correct message will be
  returned to chat.

### Updates

- Updated various NPM packages for security

## [1.4.0] - 2019-12-02

### Update

- Added check to see if theme is already installed, before installing. If found, it will send a message to chat with instructions to use it.

## [1.3.2] - 2019-08-29

### Fixed

- Cleaned up some npm security issues

## [1.3.1] - 2019-08-29

### Fixed

- Fixed an issue that prevented the whispering of themes if there were too many themes to send. This change will break the list of themes into smaller messages and send multiple whispers.

## [1.3.0] - 2019-08-13

### Added

- `!theme install {theme unique identifier}` command that prompts the user to install or preview a theme supplied by chat.

## [1.2.0] - 2019-07-30

### Added

- `!theme random light` command that chooses a random theme from the light theme extensions.
- `!theme random dark` command that chooses a random theme from the dark theme extensions.

## [1.1.0] - 2019-06-26

### Added

- `!theme repo` command that sends information about the extensions GitHub repo to Twitch chat
- `!theme help` command that sends a brief explanation of how to use the extension to Twitch chat

## [1.0.1] - 2019-06-09

### Updated

- Added larger version of logo
- Updated README.md to include link to VS Marketplace
- Updated package.json to stylize VS Marketplace listing

## [1.0.0] - 2019-06-09

### Added

- `!theme current` command will now send the current theme to chat
- New command palette option to select access to commands. Options are:
  - `Viewers`: allows all non-banned viewers to send commands
  - `Followers`: allow only non-banned follower & subscribers to send commands
  - `Subscribers`: allow only non-banned subscribers to send commands

### Changed

- `!theme` will now send the list of available themes via whisper. This replaces
  `!theme list`
- Extension will no longer consider commas in commands. So if a user accidentally sends
  `!theme {theme name},` it will be interpretted as if no comma was included in the command

### Removed

- The following commands have been removed:
  - `!theme follower`
  - `!theme !follower`
  - `!theme subscriber`
  - `!theme !subscriber`
  - `!theme list`

### Fixed

- Extension will no longer automatically join chat on start-up

## [0.2.0] - 2019-05-26

### Added

- Broadcaster can use `!theme sub` or `!theme !sub` to activate or deactivate sub only mode
- Follower Only & Subscriber Only are now also VS Code settings so you don't have to use chat commands
- If user sends a `!theme {theme name}` with an invalid theme name, the extension will whisper them to let
  them know it's not a valid theme name

## [0.1.0] - 2019-05-16

### Added

- Broadcaster can use `!theme follower` or `!theme !follower` to activate or deactivate follower only mode
- Added tests for Themer class

## [0.0.6] - 2019-05-12

### Added

- Broadcaster can use `!theme ban {username}` or `!theme unban {username}` to ban a user from changing the theme

### Fixes

- `!Theme` now recognized as a command like `!theme`

## [0.0.5] - 2019-05-10

### Added

- Added a new `!theme refresh` command that refreshes the list of available themes. **Can only be used by the broadcaster**
- Added comments throughout codebase to provide better experience for future contributors

## [0.0.4] - 2019-05-09

### Added

- Added a new `!theme random` command that changes VS Code to a randomly selected theme.
- Added a new `!theme` command that sends the current theme to Twitch chat.

### Fixed

- Solved issue when setting theme to one of the default VS Code themes.

## [0.0.3] - 2019-05-07

### Changed

- Modified some of the VS Code information messages to be more clear about what is happening.

### Fixed

- Fixed the sending of messages to chat on join/disconnect to Twitch channel.

## [0.0.2] - 2019-05-01

### Added

- Added configuration and badges for CI/CD process

## [0.0.1] - 2019-04-26

### Added

- Pre-release version to gather feedback from the community and help identify gaps.

[unreleased]: https://github.com/michaeljolley/vscode-twitch-themer/compare/2.0.0...HEAD
[2.0.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.7.8...2.0.0
[1.7.8]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.7.0...1.7.8
[1.7.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.6.3...1.7.0
[1.6.4]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.6.3...1.6.4
[1.6.3]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.6.1...1.6.3
[1.6.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.5.0...1.6.1
[1.5.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.4.1...1.5.0
[1.4.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.4.0...1.4.1
[1.4.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.3.2...1.4.0
[1.3.2]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.2.0...1.0.0
[0.2.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.6...0.1.0
[0.0.6]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.5...0.0.6
[0.0.5]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.4...0.0.5
[0.0.4]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.3...0.0.4
[0.0.3]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.2...0.0.3
[0.0.2]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.1...0.0.2
[0.0.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/3239c8e...0.0.1
