import { configDotenv } from "dotenv";

configDotenv();

export const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
export const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;

export const ACTIVITY_URL = `https://discord.com/api/v9/content-inventory/users/${DISCORD_USER_ID}/outbox`;
export const APP_INFO_URL = "https://discord.com/api/v9/applications/public?";
