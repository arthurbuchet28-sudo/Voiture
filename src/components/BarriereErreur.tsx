// Évite la page blanche : en cas d'erreur d'affichage, recharge automatiquement la page une fois
// (cas d'une extension du navigateur qui modifie la page, ou d'une version en cache), puis, si l'erreur
// persiste, montre un message et un bouton pour repartir.
import { Component, type ReactNode } from "react";

const CLE = "rechargement-erreur";

/** Vrai si la page vient déjà d'être rechargée automatiquement pour cette adresse (moins de 30 s). */
function dejaRecharge(): boolean {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLE) ?? "null") as { url: string; t: number } | null;
    return !!v && v.url === location.href && Date.now() - v.t < 30000;
  } catch {
    return true; // stockage indisponible : on ne risque pas une boucle de rechargements
  }
}

interface Etat {
  erreur: Error | null;
}

export class BarriereErreur extends Component<{ children: ReactNode }, Etat> {
  state: Etat = { erreur: null };

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur };
  }

  componentDidCatch(erreur: Error) {
    console.error("Erreur d'affichage :", erreur);
    if (!dejaRecharge()) {
      try {
        sessionStorage.setItem(CLE, JSON.stringify({ url: location.href, t: Date.now() }));
        location.reload();
      } catch {
        /* le message ci-dessous reste affiché */
      }
    }
  }

  render() {
    if (!this.state.erreur) return this.props.children;
    // Rechargement automatique en cours : on n'affiche rien de déroutant.
    if (!dejaRecharge()) return null;
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">Oups, un problème d'affichage</h1>
        <p className="mt-3 text-asphalte-500 dark:text-asphalte-400">
          La page n'a pas pu s'afficher. Rechargez-la ; si le problème revient, repartez de l'accueil.
        </p>
        <p className="mt-2 text-xs text-asphalte-500 dark:text-asphalte-400">Détail : {this.state.erreur.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="bouton-principal" onClick={() => location.reload()}>
            Recharger la page
          </button>
          <a className="bouton-secondaire" href={import.meta.env.BASE_URL}>
            Accueil
          </a>
        </div>
      </div>
    );
  }
}
