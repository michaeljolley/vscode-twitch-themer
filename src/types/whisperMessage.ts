/**
 * Object that represents a Twitch whisper
 */
export type WhisperMessage = {
  /** recipient of the whisper */
  user: string;
  /** Message sent to user */
  message: string;
};
