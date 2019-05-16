# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


---

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

- Added a new `!theme refresh` command that refreshes the list of available themes.  **Can only be used by the broadcaster**
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

[Unreleased]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.1.0...HEAD
[0.1.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.6...0.1.0
[0.0.6]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.5...0.0.6
[0.0.5]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.4...0.0.5
[0.0.4]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.3...0.0.4
[0.0.3]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.2...0.0.3
[0.0.2]: https://github.com/michaeljolley/vscode-twitch-themer/compare/0.0.1...0.0.2
[0.0.1]: https://github.com/michaeljolley/vscode-twitch-themer/compare/3239c8e...0.0.1
