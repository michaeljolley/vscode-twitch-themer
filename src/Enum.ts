export enum Commands {
    twitchSignIn = 'twitchThemer.signIn',
    twitchSignOut = 'twitchThemer.signOut',
    chatConnect = 'twitchThemer.chatConnect',
    chatDisconnect = 'twitchThemer.chatDisconnect'
}

export enum TwitchClientStatus {
    loggingIn,
    loggedIn,
    chatConnected,
    chatDisconnected,
    loggedOut
}