/**
 * List of users who have been whispered the list of available themes
 */
export interface IListRecipient {
    /** Username of the user who has requested the list of themes */
    username: string;
    /** Date the user was last sent the list of available themes */
    lastSent: Date;
}