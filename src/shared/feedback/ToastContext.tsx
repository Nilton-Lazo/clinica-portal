import * as React from "react";
import { createPortal } from "react-dom";
import { ToastContainer } from "react-toastify";

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastContainer = (
    <ToastContainer
      position="top-right"
      autoClose={DEFAULT_DURATION}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable
      theme="colored"
      limit={4}
      closeButton
      className="toast-container-enterprise"
      toastClassName="toast-enterprise"
      progressClassName="toast-progress-enterprise"
    />
  );

  return (
    <>
      {children}
      {typeof document !== "undefined" ? createPortal(toastContainer, document.body) : toastContainer}
    </>
  );
}
