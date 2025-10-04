import { config } from "dotenv";


config();

export const GLAD_TIDINGS_CONFIG = {
  baseUrl: process.env.GLAD_TIDINGS_BASE_URL as string,
  authToken: process.env.GLAD_TIDINGS_AUTH_TOKEN as string,
};

