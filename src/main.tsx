import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Room from "./Room.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Room>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </Room>
  </StrictMode>
);
