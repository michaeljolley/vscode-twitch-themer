import { OnCommandExtra, OnMessageFlags } from "comfy.js";

/**
 * Object that represents a Twitch chat message
 */
export interface IChatMessage {
  /** User who sent the message */
  user: string;
  /** Message sent to chat */
  message: string;
  /** User flags denoting access of the user */
  flags: OnMessageFlags;
  /** Extra metadata re: the message */
  extra: OnCommandExtra;
}
