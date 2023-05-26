import * as vscode from "vscode";
import fetch from "node-fetch";
import Logger from "./logger";
import { ExtensionKeys, LogLevel, ThemeNotAvailableReasons } from "./constants";

export default class API {
  public static async isTwitchUserFollowing(
    twitchUserId: string | undefined,
    state: vscode.Memento
  ) {
    if (twitchUserId) {
      const accessToken = state.get(ExtensionKeys.account);
      const currentUserId = state.get(ExtensionKeys.userId);

      if (accessToken && currentUserId) {
        const url = `https://api.twitch.tv/helix/channels/followers?user_id=${twitchUserId}&broadcaster_id=${currentUserId}`;
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "client-id": "ts9wowek7hj9yw0q7gmg27c29i6etn",
            },
          });
          const { data } = (await res.json()) as { data: any[] };
          return data.length > 0 ? true : false;
        } catch (err: any) {
          Logger.log(
            LogLevel.debug,
            `failed to retrieve Twitch user following status: ${err.message}`
          );
          return false;
        }
      } else {
        Logger.log(
          LogLevel.debug,
          "Failed to retrieve Twitch credentials from the user store"
        );
        return false;
      }
    }
    Logger.log(LogLevel.debug, "no twitchUserId was passed in.");
    return false;
  }

  public static async getUserDetails(token: string | null) {
    const url = "https://api.twitch.tv/helix/users";

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "client-id": "ts9wowek7hj9yw0q7gmg27c29i6etn",
        },
      });

      const { data } = (await res.json()) as { data: any[] };
      return data[0];
    } catch (err: any) {
      Logger.log(
        LogLevel.error,
        `Failed to retrieve Twitch user details: ${err.message}`
      );
      return undefined;
    }
  }

  /**
   * This method attempts to ensure that the extension provided is a valid theme.
   * We do this by first parsing the extensions metadata on the Marketplace webpage
   * for the GitHubLink value. We are only interested in the "user" and "repo" names
   * from the Github link, so we use Regex to match and group the link as needed.
   * Finally, we fetch the 'package.json' file from the Github repo and verify
   * that it has at least one Theme contribution listed.
   * @param extensionName The unique id for the extension.
   */
  public static async isValidExtensionName(extensionName: string): Promise<{
    available: boolean;
    reason?: ThemeNotAvailableReasons;
    label?: string[];
  }> {
    const url = `https://marketplace.visualstudio.com/items?itemName=${extensionName}`;
    try {
      let res = await fetch(url, {
        method: "GET",
        headers: { Accept: "*/*", "User-Agent": "VSCode-Twitch-Themer" },
      });
      if (res.status === 404) {
        return { available: false, reason: ThemeNotAvailableReasons.notFound };
      }

      const body = await res.text();
      if (!body) {
        return { available: false, reason: ThemeNotAvailableReasons.notFound };
      }

      /**
       * Regex explanation:
       * ([--:\w?@%&+~#=]+)
       *  () = group within the match, in our case this will be group [1].
       *  [] = tells regex to look for the characters within the brackets.
       *  --: = look for all characters between ASCII 45 and 58.
       *  \w = look for a word.
       *  + = look for one or more of the characters listed in the brackets.
       * The rest is to look for that individual character (i.e. ~ = look for the tilde)
       *
       * The following is used because some 'links' include the '.git' suffix:
       * (?:\.git)?
       * (?:) = do not group within the match.
       * \. = look for a period (\ escapes the special '.' which in regex means match anything).
       * ? = match 0 or 1 of the predicate.
       */
      const repoUrlMatches = body.match(
        /\"GitHubLink\":\"https:\/\/github.com\/([--:\w?@%&+~#=]+)(?:\.git)?\"/i
      );
      if (!repoUrlMatches) {
        return {
          available: false,
          reason: ThemeNotAvailableReasons.noRepositoryFound,
        };
      }

      const repoUrl = `https://raw.githubusercontent.com/${repoUrlMatches[1].replace(
        ".git",
        ""
      )}/main/package.json`;
      res = await fetch(repoUrl, { method: "GET" });
      if (res.status !== 200) {
        return {
          available: false,
          reason: ThemeNotAvailableReasons.packageJsonNotDownloaded,
        };
      }

      try {
        const packageJson: any = await res.json();

        if (
          !packageJson.contributes.themes ||
          packageJson.contributes.themes.length === 0
        ) {
          return {
            available: false,
            reason: ThemeNotAvailableReasons.noThemesContributed,
          };
        }

        return {
          available: true,
          label: packageJson.contributes.themes.map(
            (t: { label: string }) => t.label
          ),
        };
      } catch {
        return {
          available: false,
          reason: ThemeNotAvailableReasons.packageJsonMalformed,
        };
      }
    } catch (err: any) {
      return {
        available: false,
        reason: ThemeNotAvailableReasons.marketplaceRequestFailed,
      };
    }
  }

  public static async getStreamIsActive(
    _state: vscode.Memento
  ): Promise<boolean> {
    const accessToken = _state.get(ExtensionKeys.account);
    const currentUserId = _state.get(ExtensionKeys.userId);
    if (accessToken && currentUserId) {
      const url = `https://api.twitch.tv/helix/streams?user_id=${currentUserId}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "client-id": "ts9wowek7hj9yw0q7gmg27c29i6etn",
        },
      });
      const { data }: any = await res.json();

      return data.length > 0 ? true : false;
    }
    return false;
  }
}
