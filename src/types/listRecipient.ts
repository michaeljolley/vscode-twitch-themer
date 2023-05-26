/**
 * List of users who have been whispered the list of available themes
 */
export type ListRecipient = {
  /** Username of the user who has requested the list of themes */
  username: string;
  /** Date the user was last sent the list of available themes */
  lastSent?: Date;
  /** Whether or not the user has been banned or not */
  banned?: boolean;
};
