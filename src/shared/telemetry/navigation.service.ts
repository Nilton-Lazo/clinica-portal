import { api } from "../api";

export type NavigationPayload = {
  path: string;
  screen?: string;
  module?: string;
};

export const navigationService = {
  track(payload: NavigationPayload) {
    return api.post("/telemetria/navegacion", payload);
  },
};
