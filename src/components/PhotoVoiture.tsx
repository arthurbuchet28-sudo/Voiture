import { useState } from "react";
import type { Carrosserie, Photo } from "../types";
import { Silhouette } from "./Silhouette";

interface Props {
  photo: Photo | undefined;
  carrosserie: Carrosserie;
  alt: string;
  className?: string;
  /** "dessous" : crédit sous la photo ; "incruste" : discret, en bas de l'image ; "aucun". */
  credit?: "dessous" | "incruste" | "aucun";
  prioritaire?: boolean;
}

export function CreditPhoto({ photo, className = "" }: { photo: Photo; className?: string }) {
  return (
    <p className={`text-[11px] leading-snug text-asphalte-500 dark:text-asphalte-400 ${className}`}>
      Photo : {photo.auteur} —{" "}
      {photo.page ? (
        <a href={photo.page} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-accent-600">
          {photo.licence}, Wikimedia Commons
        </a>
      ) : (
        <>{photo.licence}, Wikimedia Commons</>
      )}
    </p>
  );
}

export function PhotoVoiture({ photo, carrosserie, alt, className = "", credit = "aucun", prioritaire }: Props) {
  const [erreur, setErreur] = useState(false);
  const [charge, setCharge] = useState(false);
  const avecPhoto = photo && !erreur;
  return (
    <figure className={`relative ${credit === "dessous" ? "" : "overflow-hidden"}`}>
      <div className={`relative overflow-hidden bg-gradient-to-br from-asphalte-100 to-asphalte-200 dark:from-asphalte-800 dark:to-asphalte-900 ${className}`}>
        {avecPhoto ? (
          <img
            src={photo.url}
            alt={alt}
            loading={prioritaire ? "eager" : "lazy"}
            decoding="async"
            onError={() => setErreur(true)}
            onLoad={() => setCharge(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${charge ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-asphalte-400 dark:text-asphalte-600">
            <Silhouette type={carrosserie} className="w-3/4 max-w-[260px]" />
            <span className="text-[11px] uppercase tracking-wider">Photo libre indisponible</span>
          </div>
        )}
        {avecPhoto && credit === "incruste" && (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-[10px] text-white/85">
            © {photo.auteur} · {photo.licence}
          </figcaption>
        )}
      </div>
      {avecPhoto && credit === "dessous" && <CreditPhoto photo={photo} className="mt-1.5" />}
    </figure>
  );
}
