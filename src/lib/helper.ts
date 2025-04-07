import moment from "moment";
import { registerFont } from "canvas";
import { glob } from "glob";
import { ApplicationInfo, Entry, Trait } from "./types";
import { TRAITS } from "./enum.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

export const registerAllFonts = async () => {
  // please manually install the fonts in your OS machine.

  const fonts = await glob("./src/assets/fonts/**/*.ttf", {
    ignore: "node_modules/**",
  });

  for (const font of fonts) {
    const toFamily = font.replace(/\\/g, "/").split("/").at(-1)?.replace(".ttf", "") ?? "";
    registerFont(font, { family: toFamily });
  }
};

export const getApplicationIconUrl = (appId: string, apps: ApplicationInfo[]) => {
  const iconHash = apps.find((e) => e.id === appId)?.icon ?? "";
  return `https://cdn.discordapp.com/app-icons/${appId}/${iconHash}.png`;
};

export const getTrait = (type: TRAITS, traits: Trait[]): string | number | boolean | null => {
  const trait = traits.find((t) => t.type === type);
  if (!trait) return null;
  return Object.entries(trait).find(([key]) => key !== "type")?.[1];
};

export const getGameDurations = (traits: Trait[]) => {
  const durationSec = getTrait(TRAITS.DURATION_TYPE, traits) as number;

  const seconds = durationSec % 60;
  const minutes = Math.floor((durationSec % 3600) / 60);
  const hours = Math.floor(durationSec / 3600);

  return `${zfill(hours)}:${zfill(minutes)}:${zfill(seconds)}`.replace(/\s+/g, "");
};

export const getPlayedSince = (date: string) => {
  const str = moment(date).fromNow();
  return str.replace(" days", "d");
};

export const getApplicationIds = (entries: Entry[]) => {
  return entries.map((entry) => entry.extra.application_id).filter((appId) => appId !== undefined);
};

export const writeFileSyncRecursive = (filename: string, data: string | NodeJS.ArrayBufferView) => {
  try {
    const resolvedPath = path.resolve(filename);
    const dirPath = path.dirname(resolvedPath);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    writeFileSync(resolvedPath, data);
  } catch (error) {
    console.error(`Error writing file: ${filename}`, error);
  }
};

export const zfill = (n: number) => {
  return String(n).padStart(2, "0");
};
