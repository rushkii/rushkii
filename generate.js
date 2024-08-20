import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import axios from "axios";
import { configDotenv } from "dotenv";
import querystring from "node:querystring";
import moment from "moment";

configDotenv();

// application info IDs
const APPS = [
  "1247227126416146462",
  "1129504517474504826",
  "569008830701240340",
  "700136079562375258",
  "1129504209226711190",
  "1260340082150346932",
  "762434991303950386",
];

// traits type
const FIRST_TIME_TYPE = 1;
const DURATION_TYPE = 2;
const IS_MARATHON_TYPE = 6;
const STREAK_TYPE = 8;

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;
const HEADERS = {
  headers: {
    authorization: DISCORD_API_TOKEN,
  },
};
const QUERY_APPS = querystring.stringify({ application_ids: APPS });

// fetch API URL
const ACTIVITY_URL = `https://discord.com/api/v9/content-inventory/users/${DISCORD_USER_ID}/outbox`;
const APP_INFO_URL = `https://discord.com/api/v9/applications/public?${QUERY_APPS}`;
const GITHUB_USER_INFO = `https://api.github.com/users/${GITHUB_USERNAME}`;

let canvas; // declare canvas globally

const getApplicationIconUrl = (applicationId, data) => {
  const iconHash = data.find((e) => e.id === applicationId).icon;
  return `https://cdn.discordapp.com/app-icons/${applicationId}/${iconHash}.png`;
};

const getTrait = (type, traits) => {
  const trait = traits.find((t) => t.type === type);
  return trait && Object.entries(trait).find(([key]) => key !== "type")?.[1];
};

const getGameDurations = (traits) => {
  const durationSec = getTrait(DURATION_TYPE, traits);

  const seconds = durationSec % 60;
  const minutes = Math.floor((durationSec % 3600) / 60);
  const hours = Math.floor(durationSec / 3600);

  return `
    ${String(hours).padStart(2, "0")}:
    ${String(minutes).padStart(2, "0")}:
    ${String(seconds).padStart(2, "0")}
  `.replace(/\s+/g, "");
};

const getPlayedSince = (date) => {
  const str = moment(date).fromNow();
  return str.replace(" days", "d");
};

const save = () => {
  // save the generated image.
  const buffer = canvas.toBuffer("image/png", {
    quality: 1,
    compressionLevel: 0,
  });
  const output = "generated-profile.png";
  fs.writeFileSync(output, buffer);
  console.log(`Image saved to \x1b[1m${output}\x1b[0m`);
  process.exit(1);
};

(async () => {
  // data fetching GitHub and Discord's Recent Games API.
  const [activity, appInfo, github] = await Promise.all([
    axios.get(ACTIVITY_URL, { ...HEADERS }),
    axios.get(APP_INFO_URL, { ...HEADERS }),
    axios.get(GITHUB_USER_INFO),
  ]);

  // get JSON data
  const gh = github.data;
  const act = activity.data;
  const app = appInfo.data;

  // static variable sections.
  let profileName = gh.name;
  profileName =
    profileName.length <= 20
      ? profileName
      : profileName.substring(0, 20) + "...";

  const bio = gh.bio;
  const bioSplit = bio.split(" ");

  let totalLines = 0;
  for (let i = 0; i < bioSplit.length; i += 11) totalLines++;

  const gameData = act.entries;

  // the padding bottom size for the main canvas background.
  const paddingBottomMain = 50 * totalLines;
  const calculateDataLength = gameData.length === 0 ? 1 : gameData.length;

  canvas = createCanvas(
    1920,
    790 +
      (230 * calculateDataLength + 10 * calculateDataLength) +
      paddingBottomMain,
    "png"
  );
  const ctx = canvas.getContext("2d");

  const profilePict = await loadImage(gh.avatar_url);
  const headerCoverPict = await loadImage("./assets/header.jpg");

  // create main background canvas rounded.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, [40]);
  ctx.clip();

  // make the background with linear gradient color.
  let gradientBg = ctx.createLinearGradient(
    canvas.width,
    0,
    canvas.width,
    canvas.height
  );
  gradientBg.addColorStop(0, "#2A394D");
  gradientBg.addColorStop(1, "#141414");
  ctx.fillStyle = gradientBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw image header cover.
  ctx.drawImage(headerCoverPict, 0, 0, canvas.width, 400);
  ctx.restore();

  // make the full rounded profile picture
  ctx.save();
  ctx.beginPath();
  ctx.arc(235, 400, 190, 0, Math.PI * 2, false);
  ctx.strokeStyle = "#8872C6";
  ctx.lineWidth = 20;
  ctx.stroke();
  ctx.clip();
  ctx.drawImage(profilePict, 35, 200, 400, 400);
  ctx.restore();

  // write profile name.
  ctx.save();
  ctx.beginPath();
  ctx.font = "700 100px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "start";
  ctx.fillText(profileName, 450, 530);
  ctx.restore();

  // write bio with chunks so it won't overflow.
  ctx.save();
  ctx.beginPath();
  ctx.font = "300 50px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, .7)";
  ctx.textAlign = "start";

  let spaceBio = 0;
  for (let i = 0; i < bioSplit.length; i += 11) {
    const chunk = bioSplit.slice(i, i + 11).join(" ");
    ctx.fillText(chunk, 30, 700 + spaceBio);
    spaceBio += 50;
  }
  ctx.restore();

  // padding top for "RECENT PLAYED GAMES" text.
  const ptRecentText = totalLines * 100 - 50 * totalLines;
  const recentGameText = "RECENT GAMES ACTIVITIES";

  ctx.font = "700 50px sans-serif";
  ctx.textAlign = "start";

  const rgTextMargin = ctx.measureText(recentGameText).width;

  // write "RECENT PLAYED GAMES" heading with linear gradient color.
  let gradientText = ctx.createLinearGradient(900, 1000, 1000, 765);
  gradientText.addColorStop(0.3, "#f6aede");
  gradientText.addColorStop(0.5, "#B958A9");
  gradientText.addColorStop(1.0, "#8872C6");
  ctx.fillStyle = gradientText;

  ctx.fillText(
    recentGameText,
    canvas.width / 2 - rgTextMargin / 2,
    765 + ptRecentText
  );

  // check if the user has the game activities data.
  if (gameData.length === 0) {
    const noDataText = "YOU DON'T HAVE GAME ACTIVITIES DATA!";
    const subNoDataText =
      "Try to play any games while Discord desktop app is active.";

    ctx.fillStyle = "rgba(255, 255, 255, .7)";
    ctx.font = "600 40px sans-serif";

    const marginTitle = ctx.measureText(noDataText).width;

    ctx.fillText(
      noDataText,
      canvas.width / 2 - marginTitle / 2,
      900 + ptRecentText
    );

    ctx.fillStyle = "rgba(255, 255, 255, .7)";
    ctx.font = "500 35px sans-serif";

    const marginSubtitle = ctx.measureText(subNoDataText).width;

    ctx.fillText(
      subNoDataText,
      canvas.width / 2 - marginSubtitle / 2,
      950 + ptRecentText
    );

    save();
  }

  // height value for the margin between the game column items.
  let breakHeight = 0;

  // display recent game data sections.
  for (const game of gameData) {
    const gameIconSrc = getApplicationIconUrl(game.extra.application_id, app);
    const gameIcon = await loadImage(gameIconSrc);
    let gameSubMargin = 0;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, .4)";
    ctx.roundRect(
      30,
      800 + ptRecentText + breakHeight,
      canvas.width - 60,
      200,
      [30]
    );
    ctx.fill();
    ctx.clip();

    ctx.font = "700 45px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "start";
    ctx.fillText(game.extra.game_name, 230, 880 + ptRecentText + breakHeight);

    ctx.font = "500 40px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "start";

    const playedSince = getPlayedSince(game.ended_at);

    ctx.fillText("🎮", 230, 945 + ptRecentText + breakHeight);
    const ctrlrMargin = ctx.measureText("🎮").width;

    ctx.fillText(
      playedSince,
      235 + ctrlrMargin,
      950 + ptRecentText + breakHeight
    );

    const playedMargin = ctx.measureText(`🎮 ${playedSince}`);
    gameSubMargin = playedMargin.width + 10;

    if (getTrait(FIRST_TIME_TYPE, game.traits)) {
      ctx.font = "500 40px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "start";

      ctx.fillText("☘️", 240 + gameSubMargin, 948 + ptRecentText + breakHeight);
      const cloverMargin = ctx.measureText("☘️").width;

      ctx.fillText(
        "New Player",
        245 + cloverMargin + gameSubMargin,
        948 + ptRecentText + breakHeight
      );
      const newbieMargin = ctx.measureText("☘️ New Player");

      gameSubMargin += newbieMargin.width + 10;
    }

    ctx.font = "500 40px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "start";

    const durations = getGameDurations(game.traits);

    ctx.fillText("⌛️", 240 + gameSubMargin, 948 + ptRecentText + breakHeight);
    const timeMargin = ctx.measureText("⌛️").width;

    ctx.fillText(
      durations,
      245 + timeMargin + gameSubMargin,
      951 + ptRecentText + breakHeight
    );

    const timeTextMargin = ctx.measureText(`⌛️ ${durations}`);
    gameSubMargin += timeTextMargin.width + 10;

    if (getTrait(IS_MARATHON_TYPE, game.traits)) {
      ctx.font = "500 40px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "start";

      const duration = getTrait(DURATION_TYPE, game.traits);
      const hours = Math.floor(duration / 3600);

      const text = `${hours}h Marathon`;

      ctx.fillText("⏰", 240 + gameSubMargin, 948 + ptRecentText + breakHeight);
      const cloverMargin = ctx.measureText("⏰").width;

      ctx.fillText(
        text,
        240 + cloverMargin + gameSubMargin,
        948 + ptRecentText + breakHeight
      );
      const newbieMargin = ctx.measureText(`⏰ ${text}`);

      gameSubMargin += newbieMargin.width + 10;
    }

    if (getTrait(STREAK_TYPE, game.traits) !== undefined) {
      ctx.font = "500 40px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "start";

      const streakDays = getTrait(STREAK_TYPE, game.traits);
      const text = `${streakDays}d Streak`;

      ctx.fillText(
        "⚡️",
        240 + gameSubMargin,
        948 + ptRecentText + breakHeight
      );
      const cloverMargin = ctx.measureText("⚡️").width;

      ctx.fillText(
        text,
        240 + cloverMargin + gameSubMargin,
        948 + ptRecentText + breakHeight
      );
      const newbieMargin = ctx.measureText(`⚡️ ${text}`);

      gameSubMargin += newbieMargin.width + 10;
    }

    ctx.beginPath();
    ctx.roundRect(50, 825 + ptRecentText + breakHeight, 150, 150, [30]);
    ctx.clip();
    ctx.drawImage(gameIcon, 50, 825 + ptRecentText + breakHeight, 150, 150);
    ctx.closePath();
    ctx.restore();

    breakHeight += 230;
  }

  save();
})();
