// Évite la page blanche : en cas d'erreur d'affichage, montre un message et un bouton pour repartir.
import { Component, type ReactNode } from "react";

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
  }

  render() {
    if (!this.state.erreur) return this.props.children;
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
