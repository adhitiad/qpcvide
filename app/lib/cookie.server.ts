import { createCookieSessionStorage } from "react-router";

export const ageVerificationStorage = createCookieSessionStorage({
  cookie: {
    name: "age_verified",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET || "s3cr3t"],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});
