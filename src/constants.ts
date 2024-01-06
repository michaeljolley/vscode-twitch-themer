/**
 * Access level for viewers
 */
export enum AccessState {
  /** All viewers */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Viewers,

  /** Followers only */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Followers,

  /** Subscribers only */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Subscribers,

  /** VIPs only */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  VIPs,

  /** Moderators only */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Moderators,

  /** Broadcaster only */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Broadcaster,
}

/**
 * Commands provided by the extension to VS Code
 */
export enum Commands {
  /** Attempt to sign in to Twitch to get an OAuth token */
  twitchSignIn = "twitchThemer.signIn",

  /** Forget the users OAuth token and disconnects from Twitch chat */
  twitchSignOut = "twitchThemer.signOut",

  /** Toggles connection on/off to Twitch chat */
  toggleChat = "twitchThemer.toggleChat",
}

/**
 * Keys for values stored in stored variables
 */
export enum ExtensionKeys {
  /** Key for access token */
  account = "vscode-twitch-themer-account",

  /** Key for current auth'd user's id */
  userId = "vscode-twitch-themer-user-id",

  /** Key for current auth'd user's login */
  userLogin = "vscode-twitch-themer-user-login",
}

/**
 * Statuses that represent the state of the extension, authentication & chat
 */
export enum TwitchClientStatus {
  /** Extension is attempting to authenticate with Twitch */
  loggingIn,

  /** User is authenticated with Twitch, but not connected to Twitch chat */
  loggedIn,

  /** User is authenticated and connected to Twitch chat */
  chatConnected,

  /** User is not authenticated and not connected to Twitch chat */
  loggedOut,
}

/**
 * Represents the reasons why a theme isn't available
 */
export enum ThemeNotAvailableReasons {
  /** Could not find the extension on the Visual Studio Marketplace using the given extension id */
  notFound = "not found",
  /** Occurs if the API failed to match any repository for the extension on Visual Studio Marketplace */
  noRepositoryFound = "no repository found",
  /** Occurs when the API fails to download the package.json from the Github repo for the extension */
  packageJsonNotDownloaded = "package.json could not be downloaded",
  /** Occurs when the API cannot find any theme contributions within the package.json from the Github repository */
  noThemesContributed = "no themes contributed within package.json",
  /** Occurs when the JSON.parse function cannot parse the JSON retrieved from Github repository */
  packageJsonMalformed = "the package.json could not be parsed",
  /** Occurs when the request to retrieve the extension from the VS Code marketplace fails */
  marketplaceRequestFailed = "the request to the Visual Studio Marketplace failed",
}

/** */
export enum LogLevel {
  info = "info",
  warn = "warn",
  error = "error",
  debug = "debug",
}

/**
 * Twitch API Client ID for the extension
 */
export const twitchAPIClientId = "ts9wowek7hj9yw0q7gmg27c29i6etn";

/**
 * Twitch scopes required for the extension to function
 */
export const twitchScopes = [
  `TWITCH_CLIENT_ID:${twitchAPIClientId}`,
  "chat:read",
  "chat:edit",
  "moderator:read:followers",
];

export const messageHelp =
  "Available !theme commands are: random, random \
dark, random light, current, and repo. \
You can also use !theme <theme name> to choose a specific theme. Or install \
a theme using !theme install <id of the theme>";

export const messageRepo =
  "You can find the source code for this VS \
Code extension at https://github.com/build-with-me/vscode-twitch-themer . \
Feel free to fork & contribute.";

export const messagePaused = (user: string) =>
  `@${user}, theme changes are paused. Please try again in a few minutes.`;

export const messageCurrent = (theme: string, themeId: string) =>
  `The current theme is ${theme}. You can find it on the VS Code Marketplace at https://marketplace.visualstudio.com/items?itemName=${themeId}`;

export const messageInvalidTheme = (
  user: string,
  theme: string,
) => `${user}, ${theme} is not a valid theme name or \
isn't installed.  You can use !theme to get a list of available themes.`;

export const messageOnPaused = (
  user: string,
  theme: string,
  minutes: number,
) => `@${user} has redeemed pausing the theme on ${theme} for ${minutes} \
minute${minutes === 1 ? "" : "s"}.`;

export const messageInstalled = (user: string, labels: string[]) =>
  `@${user}, the theme${labels.length > 1 ? "s" : ""} '${labels.join(", ")}' ${
    labels.length > 1 ? "were" : "was"
  } installed successfully.`;

export const messageThemeExists = (
  user: string,
  theme: string,
  labels: string[],
) =>
  `@${user}, '${theme}' is already installed. To switch to it, send: !theme ${labels.join(
    " -or- !theme ",
  )}`;

export const messageInstallNotAuthorized = (
  user: string,
  installState: string,
) => `Sorry @${user}. Only ${installState} are allowed to install new themes.`;
