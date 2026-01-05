import { HttpClient } from "./http";

export const api = new HttpClient(
  import.meta.env.VITE_API_BASE_URL as string
);
