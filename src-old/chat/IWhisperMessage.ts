/**
 * Object that represents a Twitch whisper
 */
export interface IWhisperMessage {
  /** recipient of the whisper */
  user: string;
  /** Message sent to user */
  message: string;
}
