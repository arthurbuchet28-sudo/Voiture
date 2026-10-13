import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BarriereErreur } from "./components/BarriereErreur";
import { FournisseurDonnees } from "./lib/donnees";
import { FournisseurStockage } from "./lib/stockage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BarriereErreur>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <FournisseurStockage>
        <FournisseurDonnees>
          <App />
        </FournisseurDonnees>
      </FournisseurStockage>
    </BrowserRouter>
    </BarriereErreur>
  </StrictMode>,
);

// L'application s'est chargée : le rechargement automatique (voir index.html) redevient possible.
try {
  sessionStorage.removeItem("rechargement-auto");
} catch {
  /* stockage indisponible */
}
