/**
 * Access level for viewers
 */
export enum AccessState {
  /** All viewers */
  Viewers,

  /** Followers only */
  Followers,

  /** Subscribers only */
  Subscribers
}

/**
 * Commands provided by the extension to VS Code
 */
export enum Commands {
  /** Attempt to sign in to Twitch to get an OAuth token */
  twitchSignIn = 'twitchThemer.signIn',

  /** Forget the users OAuth token and disconnects from Twitch chat */
  twitchSignOut = 'twitchThemer.signOut',

  /** Toggles connection on/off to Twitch chat */
  toggleChat = 'twitchThemer.toggleChat'
}

/**
 * Keys for values stored in keytar
 */
export enum KeytarKeys {
  /** Service name */
  service = 'vscode-twitch-themer',

  /** Key for access token */
  account = 'vscode-twitch-account',

  /** Key for current auth'd user's id */
  userId = 'vscode-twitch-user-id',

  /** Key for current auth'd user's login */
  userLogin = 'vscode-twitch-user-login'
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
  loggedOut
}

/**
 * Represents if user is the broadcaster, moderator or viewer
 */
export enum UserLevel {
  /** Viewer only */
  viewer = 0,

  /** Moderator */
  moderator = 1,

  /** Broadcaster */
  broadcaster = 2
}
