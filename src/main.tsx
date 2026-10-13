import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FournisseurDonnees } from "./lib/donnees";
import { FournisseurStockage } from "./lib/stockage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <FournisseurStockage>
        <FournisseurDonnees>
          <App />
        </FournisseurDonnees>
      </FournisseurStockage>
    </BrowserRouter>
  </StrictMode>,
);
