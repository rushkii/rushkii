import { Canvas, CanvasRenderingContext2D, createCanvas, Image, loadImage } from "canvas";
import {
  getApplicationIconUrl,
  getGameDurations,
  getPlayedSince,
  getTrait,
  writeFileSyncRecursive,
} from "./helper.js";
import { ApplicationInfo, Entry } from "./types.js";
import moment from "moment";
import { CONTENT_TYPE, TRAITS } from "./enum.js";

interface Padding {
  x: number;
  y: number;
}

interface Resolution {
  width: number;
  height: number;
}

interface Props {
  resolution: Resolution;
  padding: Padding;
}

interface WriteStatistic {
  text: string;
  iconFile: string;
  margin: number;
  paddingTop: number;
  spaceBetween: number;
}

export class GameActivity {
  readonly #canvas: Canvas;
  readonly #ctx: CanvasRenderingContext2D;
  readonly #padding: Padding;

  constructor({ resolution, padding }: Props) {
    this.#canvas = createCanvas(resolution.width, resolution.height);
    this.#ctx = this.#canvas.getContext("2d");
    this.#padding = padding;
  }

  async makeMainBackground(radius: number = 40) {
    this.#ctx.save();
    this.#ctx.beginPath();
    this.#ctx.roundRect(0, 0, this.#canvas.width, this.#canvas.height, [radius]);
    this.#ctx.clip();

    let gradientBg = this.#ctx.createLinearGradient(
      this.#canvas.width,
      0,
      this.#canvas.width,
      this.#canvas.height
    );
    gradientBg.addColorStop(0, "#2A394D");
    gradientBg.addColorStop(1, "#141414");
    this.#ctx.fillStyle = gradientBg;
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  async drawDate() {
    this.#ctx.save();

    const today = new Date();

    this.#ctx.font = `30px "Outfit-ExtraBold"`;
    this.#ctx.fillStyle = await this.#createTitleGradient();
    this.#ctx.fillText(today.toLocaleDateString(), 50, this.#padding.y * 2 + this.#padding.y);

    this.#ctx.textAlign = "end";
    this.#ctx.fillText(
      today.toLocaleTimeString().replace(/\./g, ":"),
      this.#canvas.width - 50,
      this.#padding.y * 2 + this.#padding.y
    );

    this.#ctx.restore();
  }

  async drawTitle(title: string = "Recent Games Activities") {
    this.#ctx.save();
    const titleText = title.toUpperCase();
    this.#ctx.font = `40px "Outfit-ExtraBold"`;
    const rgTextMargin = this.#ctx.measureText(titleText).width;

    this.#ctx.shadowBlur = 20;
    this.#ctx.shadowColor = "rgba(146, 225, 255, 0.5)";

    this.#ctx.fillStyle = await this.#createTitleGradient();
    this.#ctx.fillText(
      titleText,
      this.#canvas.width / 2 - rgTextMargin / 2,
      this.#padding.y * 2 + this.#padding.y
    );

    this.#ctx.restore();
  }

  async drawGames(activities: Entry[], apps: ApplicationInfo[]) {
    let breakHeight = 0;

    for (const game of activities) {
      let activityIconSrc = "";
      if (game.content_type !== 5 && game.extra.application_id) {
        activityIconSrc = getApplicationIconUrl(game.extra.application_id, apps);
      } else {
        activityIconSrc = game.extra.entries?.[0].media.image_url ?? "";
      }
      const gameIcon = await loadImage(activityIconSrc);
      let gameSubMargin = 0;

      this.#ctx.save();
      this.#ctx.beginPath();
      this.#ctx.fillStyle = "rgba(0, 0, 0, .4)";
      this.#ctx.roundRect(30, 70 + this.#padding.y + breakHeight, this.#canvas.width - 60, 150, [
        30,
      ]);
      this.#ctx.fill();
      this.#ctx.clip();

      this.#ctx.font = `30px "Outfit-ExtraBold"`;
      this.#ctx.fillStyle = "#fff";

      let gameNameText = "";
      if (game.extra.game_name) {
        gameNameText = game.extra.game_name;
      } else if (game.extra.activity_name) {
        gameNameText = game.extra.activity_name;
      } else if (game.extra.entries?.[0].media.title) {
        gameNameText = game.extra.entries[0].media.title;
      }
      this.#ctx.fillText(gameNameText, 180, 120 + this.#padding.y + breakHeight);

      if (game.content_type === CONTENT_TYPE.MUSIC && game.extra.entries) {
        this.#ctx.font = `20px "Outfit-SemiBold"`;
        this.#ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        this.#ctx.fillText(
          game.extra.entries[0].media.artists[0].name,
          180,
          150 + this.#padding.y + breakHeight
        );

        gameSubMargin += await this.#writeStatistic({
          text: getPlayedSince(game.extra.last_update!),
          iconFile: "music.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      if (game.content_type === CONTENT_TYPE.ACTIVITY) {
        gameSubMargin += await this.#writeStatistic({
          text: "Did an activitiy",
          iconFile: "activity.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      let playedSince = "";

      if (game.content_type === CONTENT_TYPE.GAME && game.ended_at) {
        if (getTrait(TRAITS.IS_PLAYING_TYPE, game.traits)) {
          this.#ctx.fillStyle = "#00ff00";
          playedSince = "Currently Playing!";
        } else {
          this.#ctx.fillStyle = "#fff";
          playedSince = getPlayedSince(game.ended_at);
        }
        gameSubMargin += await this.#writeStatistic({
          text: playedSince,
          iconFile: "controller.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      this.#ctx.fillStyle = "#fff";

      if (getTrait(TRAITS.FIRST_TIME_TYPE, game.traits)) {
        gameSubMargin += await this.#writeStatistic({
          text: "New Player",
          iconFile: "flower.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      gameSubMargin += await this.#writeStatistic({
        text: getGameDurations(game.traits),
        iconFile: "hourglass.png",
        margin: gameSubMargin,
        paddingTop: this.#padding.y,
        spaceBetween: breakHeight,
      });

      if (getTrait(TRAITS.IS_MARATHON_TYPE, game.traits)) {
        const duration = getTrait(TRAITS.DURATION_TYPE, game.traits) as number;
        const hours = Math.floor(duration / 3600);

        gameSubMargin += await this.#writeStatistic({
          text: `${hours}h Marathon`,
          iconFile: "alarm.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      const streak = getTrait(TRAITS.STREAK_TYPE, game.traits);
      if (streak !== null) {
        gameSubMargin += await this.#writeStatistic({
          text: `${streak}d Streak`,
          iconFile: "lightning.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      const returning = getTrait(TRAITS.IS_RETURNING_TYPE, game.traits) as string;
      if (returning !== null) {
        const returnSince = moment(returning).fromNow();
        gameSubMargin += await this.#writeStatistic({
          text: `Quit playing ${returnSince}`,
          iconFile: "rotate.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      if (getTrait(TRAITS.IS_TRENDING_TYPE, game.traits)) {
        gameSubMargin += await this.#writeStatistic({
          text: "Trending",
          iconFile: "fire.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      const releaseDate = getTrait(TRAITS.NEW_RELEASE_DATE_TYPE, game.traits) as string;
      if (releaseDate !== null) {
        await this.#writeStatistic({
          text: moment(releaseDate).format("ll"),
          iconFile: "rocket.png",
          margin: gameSubMargin,
          paddingTop: this.#padding.y,
          spaceBetween: breakHeight,
        });
      }

      this.#ctx.beginPath();
      this.#ctx.roundRect(50, 90 + this.#padding.y + breakHeight, 110, 110, [30]);
      this.#ctx.clip();
      this.#ctx.drawImage(gameIcon, 50, 90 + this.#padding.y + breakHeight, 110, 110);
      this.#ctx.closePath();
      this.#ctx.restore();

      breakHeight += 170;
    }
  }

  async save(filename: string) {
    const buffer = this.#canvas.toBuffer("image/png", { compressionLevel: 9 });
    writeFileSyncRecursive(filename, buffer);
    console.log(`Image saved to \x1b[1m${filename}\x1b[0m`);
    process.exit(1);
  }

  async #writeStatistic({ text, iconFile, margin, paddingTop, spaceBetween }: WriteStatistic) {
    const icon = new Image();
    icon.src = "./src/assets/icons/" + iconFile;

    this.#ctx.font = `20px "Outfit-SemiBold"`;
    this.#ctx.drawImage(icon, 180 + margin, 175 + paddingTop + spaceBetween, 20, 20);

    const emojiMargin = this.#ctx.measureText("☘️").width;
    this.#ctx.fillText(text, 175 + emojiMargin + margin, 192 + paddingTop + spaceBetween);

    const textMargin = this.#ctx.measureText(`☘️ ${text}`);
    return textMargin.width + 10;
  }

  async #createTitleGradient() {
    let gradientText = this.#ctx.createLinearGradient(
      this.#canvas.width,
      60,
      this.#canvas.width,
      30
    );
    gradientText.addColorStop(0, "#7ddbff");
    gradientText.addColorStop(1, "#089aff");

    return gradientText;
  }
}
