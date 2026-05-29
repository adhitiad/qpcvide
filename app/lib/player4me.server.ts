import createClient from "openapi-fetch";
import type { paths } from "../types/player4me";

export const player4MeApi = createClient<paths>({
  baseUrl: process.env.VOD_API_URL || "https://player4me.com",
  headers: {
    ...(process.env.PLAYER4ME_API_KEY ? { "Authorization": `Bearer ${process.env.PLAYER4ME_API_KEY}` } : {}),
  }
});
