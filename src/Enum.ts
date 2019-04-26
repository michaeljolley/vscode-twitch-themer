export enum Commands {
    listThemes = 'twitchThemer.listThemes',
    changeTheme = 'twitchThemer.changeTheme',
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