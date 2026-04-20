import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { ToastViewport } from "./components/ToastViewport";
import { queryClient } from "./lib/api/queryClient";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastViewport />
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
