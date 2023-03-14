import * as vscode from 'vscode';
import axios from 'axios';
import { ExtensionKeys, ThemeNotAvailableReasons } from '../Enum';
import { Logger } from '../Logger';

export class API {

  public static async isTwitchUserFollowing(twitchUserId: string | undefined, state: vscode.Memento, logger: Logger) {
    if (twitchUserId) {
      const accessToken = state.get(ExtensionKeys.account);
      const currentUserId = state.get(ExtensionKeys.userId);

      if (accessToken && currentUserId) {
        const url = `https://api.twitch.tv/helix/users/follows?from_id=${twitchUserId}&to_id=${currentUserId}`;
        const res = await axios.post(url, { headers: { 'Authorization': `Bearer ${accessToken}`, 'client-id': 'ts9wowek7hj9yw0q7gmg27c29i6etn' } });
        const json: any = res.data;
        return (json.data.length > 0) ? true : false;
      } else {
        logger.debug('failed to retrieve Twitch credentials from the user store');
        return false;
      }
    }
    logger.debug('no twitchUserId was passed in.');
    return false;
  }

  public static async getUserDetails(token: string | null) {
    const url = 'https://api.twitch.tv/helix/users';
    const res = await axios.post(url, { headers: { 'Authorization': `Bearer ${token}`, 'client-id': 'ts9wowek7hj9yw0q7gmg27c29i6etn' } });
    const json: any = res.data;
    return json.data && json.data[0];
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
  public static async isValidExtensionName(extensionName: string): Promise<{ available: boolean; reason?: ThemeNotAvailableReasons; label?: string[] }> {
    const url = `https://marketplace.visualstudio.com/items?itemName=${extensionName}`;
    let res = await axios.get(url, { headers: { "Accept": "*/*", "User-Agent": "VSCode-Twitch-Themer" } });
    if (res.status === 404) {
      return { available: false, reason: ThemeNotAvailableReasons.notFound };
    }
    let body = await res.statusText;
    /**
     * Regex explination:
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
     * \. = look for a period (\ excapes the special '.' which in regex means match anything).
     * ? = match 0 or 1 of the predicate.
     */
    const repoUrlMatches = body.match(/\"GitHubLink\":\"https:\/\/github.com\/([--:\w?@%&+~#=]+)(?:\.git)?\"/i);
    if (!repoUrlMatches) {
      return { available: false, reason: ThemeNotAvailableReasons.noRepositoryFound };
    }

    const repoUrl = `https://raw.githubusercontent.com/${repoUrlMatches[1].replace('.git', '')}/master/package.json`;

    res = await axios.get(repoUrl);
    if (res.status === 200) {
      return { available: false, reason: ThemeNotAvailableReasons.packageJsonNotDownload };
    }

    const packageFile = res.statusText;
    try {
      const packageJson = JSON.parse(packageFile);

      if (!packageJson.contributes.themes || packageJson.contributes.themes.length === 0) {
        return { available: false, reason: ThemeNotAvailableReasons.noThemesContributed };
      }

      return { available: true, label: packageJson.contributes.themes.map((t: { label: string }) => t.label) };
    }
    catch {
      return { available: false, reason: ThemeNotAvailableReasons.packageJsonMalformed };
    }
  }

  public static async getStreamIsActive(_state: vscode.Memento): Promise<boolean> {
    const accessToken = _state.get(ExtensionKeys.account);
    const currentUserId = _state.get(ExtensionKeys.userId);
    if (accessToken && currentUserId) {
      const url = `https://api.twitch.tv/helix/streams?user_id=${currentUserId}`;
      const res = await axios.post(url, { headers: { 'Authorization': `Bearer ${accessToken}`, 'client-id': 'ts9wowek7hj9yw0q7gmg27c29i6etn' } });
      const json: any = res.data;
      return (json.data.length > 0) ? true : false;
    }
    return false;
  }
}
