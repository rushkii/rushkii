import activity from "./assets/samples/activities.json" with {type: 'json'};

import axios from "axios";
import querystring from "node:querystring";
import {
  getApplicationIds,
  registerAllFonts,
  DISCORD_API_TOKEN,
  DISCORD_USER_ID,
} from "./lib/index.js";
import { GameActivity } from "./lib/designer.js";
import { Activity, ApplicationInfo } from "./lib/types";

const headers = {
  Authorization: DISCORD_API_TOKEN,
};

axios.interceptors.response.use(
  (response) => response,
  (error) => error.response
);

(async () => {
  await registerAllFonts();

  const actRes = await axios.get(
    `https://discord.com/api/v9/content-inventory/users/${DISCORD_USER_ID}/outbox`,
    { headers }
  );

  const activity: Activity = actRes.data;
  const entries = activity.entries

  console.log(activity, entries, actRes, headers, headers.Authorization?.length)

  const queryApps = querystring.stringify({
    application_ids: getApplicationIds(entries),
  });
  const APP_INFO_URL = `https://discord.com/api/v9/applications/public?${queryApps}`;

  const appRes = await axios.get(APP_INFO_URL, { headers });
  const apps: ApplicationInfo[] = appRes.data;

  const initialHeight = 75;
  const activityBoxHeight = 170
  const padding = 20;
  const adaptiveHeight = initialHeight + padding * 2 + activityBoxHeight * entries.length;

  const designer = new GameActivity({
    resolution: { width: 1280, height: adaptiveHeight },
    padding: { x: padding, y: padding },
  });

  await designer.makeMainBackground();
  await designer.drawDate();
  await designer.drawTitle("Kiizuha's Game Activities");
  await designer.drawGames(entries, apps);
  await designer.save("./output/game-activities.png");
})();
