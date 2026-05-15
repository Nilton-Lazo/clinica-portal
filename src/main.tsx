import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router/router";
import { AuthProvider } from "./shared/auth/AuthContext";
import { ToastProvider } from "./shared/feedback";
import { RealtimeProvider } from "./shared/realtime/RealtimeProvider";
import TextInputUppercaseBinder from "./shared/textInput/TextInputUppercaseBinder";
import "react-toastify/dist/ReactToastify.css";
import "./assets/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RealtimeProvider>
          <TextInputUppercaseBinder />
          <RouterProvider router={router} />
        </RealtimeProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
