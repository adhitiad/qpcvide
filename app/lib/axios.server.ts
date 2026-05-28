import axios from "axios";

export const externalApi = axios.create({
  baseURL: process.env.VOD_API_URL || "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptors if needed
externalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("External API Error:", error.message);
    return Promise.reject(error);
  }
);
