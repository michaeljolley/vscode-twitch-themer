
import fetch from 'node-fetch';
import { keytar } from '../Common';
import { KeytarKeys } from '../Enum';

export class API {

  public static async isTwitchUserFollowing(twitchUserId: string | undefined) {
    if (twitchUserId) {
      if (keytar) {
        const accessToken = await keytar.getPassword(KeytarKeys.service, KeytarKeys.account);
        const currentUserId = await keytar.getPassword(KeytarKeys.service, KeytarKeys.userId);
        if (accessToken && currentUserId) {
          const url = `https://api.twitch.tv/helix/users/follows?from_id=${twitchUserId}&to_id=${currentUserId}`;
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
          const json = await res.json();
          return (json.data.length > 0) ? true: false;
        }
      }
    }
    console.log('no twitchUserId was passed in.');
    return false;
  }

  public static async getUserDetails(token: string | null) {
    const url = 'https://api.twitch.tv/helix/users';
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const json = (await res.json());
    return json.data && json.data[0];
  }

  public static async isValidExtensionName(extensionName: string): Promise<boolean> {
    const url = `https://marketplace.visualstudio.com/items?itemName=${extensionName}`;
    const res = await fetch(url, { method: 'GET', headers: { "Accept": "*/*", "User-Agent": "VSCode-Twitch-Themer" } });
    if (res.status === 404) {
      return false;
    }
    return res.ok;
  }
}
