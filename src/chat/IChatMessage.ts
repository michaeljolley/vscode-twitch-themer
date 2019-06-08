import { Userstate } from "tmi.js";

/**
 * Object that represents a Twitch chat message
 */
export interface IChatMessage {
  /** Userstate of user who sent the message */
  userState: Userstate;
  /** Message sent to chat */
  message: string;
}
