import { createCanvas, registerFont, Image, loadImage } from "canvas";
import fs from "fs";
import { glob } from "glob";
import axios from "axios";
import * as langIcons from "simple-icons/icons";
import { configDotenv } from "dotenv";

configDotenv();

const GITHUB_USERNAME = process.env.GH_USERNAME;
const GITHUB_USERS_REPO_INFO = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

let canvas; // declare canvas globally

const registerAllFonts = async () => {
  // please manually install the fonts in your OS machine.

  const fonts = await glob("./assets/fonts/**/*.ttf", {
    ignore: "node_modules/**",
  });

  for (const font of fonts) {
    const toFamily = font
      .replace(/\\/g, "/")
      .split("/")
      .at(-1)
      .replace(".ttf", "");
    registerFont(font, { family: toFamily });
  }
};

const loadLangIcons = (langs) => {
  const simpleIcons = {};

  Object.keys(langIcons).forEach((key) => {
    const icon = langIcons[key];
    const { title, slug, hex } = icon;

    icon.styles = {
      default: icon.svg.replace("<svg", `<svg fill="#${hex}"`),
      light: icon.svg.replace("<svg", '<svg fill="whitesmoke"'),
      dark: icon.svg.replace("<svg", '<svg fill="#333"'),
    };

    if (!(`si${title}` in langIcons)) {
      simpleIcons[title.toLowerCase()] = icon;
    }

    const legacyTitle = title.replace(/ /g, "-");
    if (!(`si${legacyTitle}` in langIcons)) {
      simpleIcons[legacyTitle.toLowerCase()] = icon;
    }

    simpleIcons[slug] = icon;
  });
  return simpleIcons;
};

const writeStatistic = ({ ctx, text, icon, x, y, height }) => {
  const img = new Image();
  img.src = "./assets/icons/" + icon;

  ctx.drawImage(img, x + 15, height + y - 10, 20, 20);

  const iconMargin = ctx.measureText("☘️").width;
  ctx.fillText(text, x + iconMargin + 15, height + y + 7);

  const textMargin = ctx.measureText(`☘️ ${text}`);
  return textMargin.width + 20;
};

const save = () => {
  // save the generated image.
  const buffer = canvas.toBuffer("image/png", {
    quality: 0.5,
    compressionLevel: 9,
  });
  const output = "top-repos-generated.png";
  fs.writeFileSync(output, buffer);
  console.log(`Image saved to \x1b[1m${output}\x1b[0m`);
  process.exit(1);
};

(async () => {
  await registerAllFonts();
  const LANG_ICONS = loadLangIcons();

  // data fetching GitHub users API.
  const { data: repos } = await axios.get(GITHUB_USERS_REPO_INFO);

  // sort repos by star count descending
  repos.sort((a, b) => {
    if (a.stargazers_count === b.stargazers_count) return 0;
    else if (a.stargazers_count < b.stargazers_count) return 1;
    else return -1;
  });

  // display only top 4 repos
  const topRepos = repos.slice(0, 4);

  const modifiedTopRepos = topRepos.map(async (e) => {
    if (!e.language) {
      e.lang_icon = null;
      return e;
    }
    const svg = LANG_ICONS[e.language.toLowerCase()].styles.default;
    e.lang_icon = await loadImage(Buffer.from(svg));
    return e;
  });

  // space value for the margin between items.
  let space_X = 0;
  let space_Y = 0;

  // rounded size
  const roundedSize = 20;

  // margin size
  const marginSize = 20;

  // container size
  const containerWidthSize = 500;
  const containerHeightSize = 200;

  canvas = createCanvas(1440, 280 + containerHeightSize + 10, "png");
  const ctx = canvas.getContext("2d");

  // create main background canvas rounded.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, [roundedSize]);
  ctx.clip();

  // make the background with linear gradient color.
  let gradientBg = ctx.createLinearGradient(
    canvas.width,
    0,
    canvas.width,
    canvas.height
  );
  gradientBg.addColorStop(0, "#2A394D");
  gradientBg.addColorStop(1, "#19212D");
  ctx.fillStyle = gradientBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // display top 4 repos sections.
  for (let i = 0; i < modifiedTopRepos.length; i++) {
    const repo = await modifiedTopRepos[i];
    let pos_X = 0;
    let statMargin = 0;

    if ((i + 1) % 2 === 0) {
      pos_X = canvas.width - containerWidthSize - marginSize;
    } else {
      pos_X = marginSize;
    }

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, .4)";
    ctx.roundRect(
      pos_X,
      marginSize + space_Y,
      containerWidthSize,
      containerHeightSize,
      [roundedSize]
    );
    ctx.fill();
    ctx.clip();

    let repoNameSpace = 0;
    if (repo.lang_icon) {
      ctx.drawImage(repo.lang_icon, pos_X + 15, 35 + space_Y);
      repoNameSpace = 35;
    }

    ctx.font = `30px "Outfit-ExtraBold"`;
    ctx.fillStyle = "#fff";

    const nameSplit = repo.name.split("");
    let prevNameChunk = "";
    const maxNameOverflowSize = 18;

    for (let i = 0; i < nameSplit.length; i += maxNameOverflowSize) {
      const chunk = nameSplit.slice(i, i + maxNameOverflowSize).join("");

      if (i >= maxNameOverflowSize) {
        // adds "..." if repo name is overflowing
        const prev_W = ctx.measureText(prevNameChunk);
        ctx.fillText(
          "...",
          pos_X + prev_W.width + repoNameSpace + 15,
          55 + space_Y
        );
        break;
      }

      prevNameChunk = chunk;
      ctx.fillText(chunk, pos_X + repoNameSpace + 15, 55 + space_Y);
    }

    if (repo.description) {
      ctx.font = `20px "Outfit-Light"`;

      let spaceDesc = 0;
      let prevDescChunk = "";
      let newLineCount = 0;
      const descSplit = repo.description.split(" ");
      const maxRepoOverflowSize = 5;

      for (let i = 0; i < descSplit.length; i += maxRepoOverflowSize) {
        const chunk = descSplit.slice(i, i + maxRepoOverflowSize).join(" ");

        if (newLineCount >= 3) {
          // adds "..." if repo desc is overflowing
          const prev_W = ctx.measureText(prevDescChunk);
          ctx.fillText(
            "...",
            pos_X + prev_W.width + 15,
            65 + space_Y + spaceDesc
          );
          break;
        }

        prevDescChunk = chunk;
        ctx.fillText(chunk, pos_X + 15, 90 + space_Y + spaceDesc);
        spaceDesc += 25;
        newLineCount++;
      }
    }

    ctx.font = `20px "Outfit-Medium"`;

    statMargin += writeStatistic({
      ctx,
      text: repo.open_issues_count,
      icon: "gh-issues.png",
      x: pos_X + statMargin,
      y: space_Y,
      height: containerHeightSize,
    });

    statMargin += writeStatistic({
      ctx,
      text: repo.stargazers_count,
      icon: "gh-stars.png",
      x: pos_X + statMargin,
      y: space_Y,
      height: containerHeightSize,
    });

    writeStatistic({
      ctx,
      text: repo.forks_count,
      icon: "gh-fork.png",
      x: pos_X + statMargin,
      y: space_Y,
      height: containerHeightSize,
    });

    if ((i + 1) % 2 === 0) space_Y += 250;

    ctx.closePath();
    ctx.restore();

    space_X += 50;
  }

  save();
})();
