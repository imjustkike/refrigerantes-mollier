import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { logClientEvent } from "./services/tauriThermoService";

// Global error handler for uncaught runtime exceptions in React/JS
window.onerror = (message, source, lineno, colno, error) => {
  const stack = error?.stack || `${source}:${lineno}:${colno}`;
  logClientEvent('error', `Uncaught Exception: ${message}`, stack);
  console.error('[CoolMollier Fatal UI Error]', message, stack);
};

window.onunhandledrejection = (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason);
  const stack = reason?.stack || 'no-stack';
  logClientEvent('error', `Unhandled Promise Rejection: ${msg}`, stack);
  console.error('[CoolMollier Unhandled Rejection]', msg, stack);
};

logClientEvent('info', 'Frontend React inicializado en Webview', `UserAgent: ${navigator.userAgent}`);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
