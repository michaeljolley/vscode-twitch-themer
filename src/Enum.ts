/**
 * Commands provided by the extension to VS Code
 */
export enum Commands {
    /** Attempt to sign in to Twitch to get an OAuth token */
    twitchSignIn = 'twitchThemer.signIn',
    
    /** Forget the users OAuth token and disconnects from Twitch chat */
    twitchSignOut = 'twitchThemer.signOut',
    
    /** Connects the user to the Twitch channels chat */
    chatConnect = 'twitchThemer.chatConnect',

    /** Disconnects the user from the connected Twitch channels chat */
    chatDisconnect = 'twitchThemer.chatDisconnect'
}

/**
 * Statuses that represent the state of the extension, authentication & chat
 */
export enum TwitchClientStatus {
    /** Extension is attempting to authenticate with Twitch */
    loggingIn,

    /** User is authenticated with Twitch, but not yet connected to Twitch chat */
    loggedIn,

    /** User is authenticated and connected to Twitch chat */
    chatConnected,

    /** User is authenticated, but not connected to Twitch chat */
    chatDisconnected,

    /** User is not authenticated and not connected to Twitch chat */
    loggedOut
}