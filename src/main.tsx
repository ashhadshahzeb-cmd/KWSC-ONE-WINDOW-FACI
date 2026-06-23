import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";

const root = document.getElementById("root")!;

try {
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  root.innerHTML = `<div style="color:white;padding:20px;font-family:monospace;">
    <h1>App failed to load</h1>
    <pre style="color:red;white-space:pre-wrap;">${error}</pre>
  </div>`;
}

// Catch unhandled errors that happen after initial render
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
