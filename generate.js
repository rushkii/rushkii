import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import axios from "axios";
import { configDotenv } from "dotenv";


configDotenv();

// this file image generator required env var HEADERS
// for the Discord's recent games API, see required
// headers below:

// {
//   "authorization": "",
//   "x-debug-options": "",
//   "x-discord-locale": "",
//   "x-discord-timezone": "",
//   "x-super-properties": ""
// }

// you can get your headers by login to your Discord and
// click your profile, if your profile has recent games
// data, you should see Discord's recent games API in
// the network tab browser's devtools.

const getBioTotalLines = (bio) => {
  // getting the bio total lines~
  let totalLines = 0;
  for (let i = 0; i < bio.length; i += 11) totalLines++;
  return totalLines;
}

(async () => {
  // data fetching GitHub and Discord's Recent Games API.
  const respGh = await axios.get("https://api.github.com/users/rushkii");
  const respRG = await axios.get(
    "https://discord.com/api/v9/users/333017995368464385/profile/recent-games",
    { headers: JSON.parse(process.env.HEADERS) }
  )
  const ghData = respGh.data;
  const rgData = respRG.data;

  // static variable sections.
  let profileName = ghData.name;
  profileName = profileName.length <= 20 ? profileName : profileName.substring(0, 20) + "...";
  const bio = ghData.bio;
  const bioSplit = bio.split(" ");
  const gameData = rgData.recent_games;

  // the padding bottom size for the main canvas background.
  const paddingBottomMain = (50 * getBioTotalLines(bioSplit));

  const canvas = createCanvas(1920, 790 + ((230 * gameData.length) + (10 * gameData.length))  + paddingBottomMain, "png");
  const ctx = canvas.getContext("2d");

  const profilePict = await loadImage(ghData.avatar_url);
  const headerCoverPict = await loadImage("./assets/header.jpg");

  // create main background canvas rounded.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, [40]);
  ctx.clip();

  // make the background with linear gradient color.
  let gradientBg = ctx.createLinearGradient(canvas.width, 0, canvas.width, canvas.height);
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
  ctx.font = `700 100px sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "start";
  ctx.fillText(profileName, 450, 530);
  ctx.restore();

  // write bio with chunks so it won't overflow.
  ctx.save()
  ctx.beginPath()
  ctx.font = `300 50px sans-serif`
  ctx.fillStyle = "rgba(255, 255, 255, .7)"
  ctx.textAlign = "start"

  let spaceBio = 0;
  let totalLines = 0;
  for (let i = 0; i < bioSplit.length; i += 11) {
    const chunk = bioSplit.slice(i, i + 11).join(" ");
    ctx.fillText(chunk, 30, 700 + spaceBio)

    spaceBio += 50
    totalLines++;
  }
  ctx.restore();

  // write "RECENT PLAYED GAMES" heading with linear gradient color.
  let gradientText = ctx.createLinearGradient(0, 765, 1000, 765);
  gradientText.addColorStop(.1, "#f6aede");
  gradientText.addColorStop(.3, "#B958A9");
  gradientText.addColorStop(.5, "#8872C6");
  ctx.font = `700 50px sans-serif`
  ctx.textAlign = "start"
  ctx.fillStyle = gradientText;

  // padding top for "RECENT PLAYED GAMES" text
  const ptRecentText = (getBioTotalLines(bioSplit) * 100) - (50 * getBioTotalLines(bioSplit));
  ctx.fillText("RECENT PLAYED GAMES", 30, 765 + ptRecentText);

  // display recent game data sections.
  let breakHeight = 0;
  for (const key in gameData) {
    const game = gameData[key];
    const gameIconSrc = `https://cdn.discordapp.com/app-icons/${game.application.id}/${game.application.icon}.png`
    const resp = await axios.get(gameIconSrc, { responseType: 'arraybuffer' });
    const gameIcon = await loadImage(resp.data);
    let gameNameMargin = 0;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, .4)"
    ctx.roundRect(30, 800 + ptRecentText + breakHeight, canvas.width - 60, 200, [30]);
    ctx.fill();
    ctx.clip();

    if (game.is_new) {
      ctx.font = `500 40px sans-serif`
      ctx.fillStyle = "#23A559"
      ctx.textAlign = "start"
      ctx.fillText("☘️", 230, 880 + ptRecentText + breakHeight);

      const newbieIconMetrics = ctx.measureText("☘️");
      gameNameMargin = newbieIconMetrics.width + 10;
    }

    ctx.font = `700 45px sans-serif`
    ctx.fillStyle = "#fff"
    ctx.textAlign = "start"
    ctx.fillText(game.application.name, 230 + gameNameMargin, 880 + ptRecentText + breakHeight);

    ctx.font = `500 40px sans-serif`
    ctx.fillStyle = "rgba(255, 255, 255, .8)"
    ctx.textAlign = "start"

    const hours = (game.duration / 3600).toFixed(1);
    let playedString;

    if (hours > 0) {
      playedString = `I played for ${hours} hours this week~`;
    } else {
      playedString = "I haven't played this week :("
    }

    ctx.fillText(playedString, 230, 950 + ptRecentText + breakHeight);

    ctx.beginPath();
    ctx.strokeStyle = game.is_new ? "#23A559": "rgba(136, 114, 198, .5)";
    ctx.lineWidth = 15;
    ctx.roundRect(50, 825 + ptRecentText + breakHeight, 150, 150, [30]);
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(gameIcon, 50, 825 + ptRecentText + breakHeight, 150, 150);
    ctx.closePath();
    ctx.restore();
    breakHeight += 230;
  };

  // save the generated image.
  const buffer = canvas.toBuffer("image/png", {
    quality: 1,
    compressionLevel: 0,
  });
  const output = "generated-profile.png";
  fs.writeFileSync(output, buffer);
  console.log(`Image saved to \x1b[1m${output}\x1b[0m`);
  process.exit(1);
})();
