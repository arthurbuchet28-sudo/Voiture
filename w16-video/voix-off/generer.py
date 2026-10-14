"""Génère la voix off avec edge-tts : un fichier par scène dans public/voix/,
et les horaires de chaque segment dans src/voix-off-timings.json.

Usage (depuis w16-video/) : python3 voix-off/generer.py
Le texte se modifie dans src/voix-off.json.
"""
import asyncio
import json
import os
import ssl
import subprocess
import sys
import tempfile

import edge_tts
import edge_tts.communicate

# Derrière un proxy d'entreprise, indiquer son certificat : CA_BUNDLE=/chemin/ca.crt
if os.environ.get("CA_BUNDLE"):
    edge_tts.communicate._SSL_CTX = ssl.create_default_context(cafile=os.environ["CA_BUNDLE"])

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(RACINE, "src", "voix-off.json")
SORTIE_AUDIO = os.path.join(RACINE, "public", "voix")
SORTIE_TIMINGS = os.path.join(RACINE, "src", "voix-off-timings.json")
TAUX = 24000  # Hz, mono
ROGNAGE = (
    "silenceremove=start_periods=1:start_threshold=-50dB,"
    "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
)


def duree_wav(chemin: str) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", chemin]
    )
    return float(out.strip())


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


async def synthese(texte: str, voix: str, debit: str, chemin: str) -> None:
    for essai in range(4):
        try:
            await edge_tts.Communicate(texte, voix, rate=debit).save(chemin)
            if os.path.getsize(chemin) > 0:
                return
        except Exception as e:  # réseau instable : on réessaie
            print(f"  essai {essai + 1} échoué : {e}", file=sys.stderr)
        await asyncio.sleep(2 ** essai)
    raise RuntimeError(f"Synthèse impossible : {texte[:50]}…")


async def main() -> None:
    conf = json.load(open(SCRIPT, encoding="utf-8"))
    os.makedirs(SORTIE_AUDIO, exist_ok=True)
    pause = conf["pauseEntreSegments"]
    timings = {}
    with tempfile.TemporaryDirectory() as tmp:
        silence = os.path.join(tmp, "silence.wav")
        ffmpeg("-f", "lavfi", "-i", f"anullsrc=r={TAUX}:cl=mono", "-t", str(pause), silence)
        for scene, segments in conf["scenes"].items():
            print(f"Scène {scene} : {len(segments)} segments")
            morceaux, segs, t = [], [], 0.0
            for i, texte in enumerate(segments):
                mp3 = os.path.join(tmp, f"{scene}-{i}.mp3")
                wav = os.path.join(tmp, f"{scene}-{i}.wav")
                await synthese(texte, conf["voix"], conf["debit"], mp3)
                # Supprime les silences ajoutés par edge-tts au début et à la fin
                ffmpeg("-i", mp3, "-af", ROGNAGE, "-ar", str(TAUX), "-ac", "1", wav)
                d = duree_wav(wav)
                if i > 0:
                    morceaux.append(silence)
                    t += pause
                segs.append({"debut": round(t, 3), "fin": round(t + d, 3)})
                morceaux.append(wav)
                t += d
                # Chaque segment occupe au moins `dureeMinSegment` (lisibilité des sous-titres)
                manque = conf.get("dureeMinSegment", 0) - (d + pause)
                if manque > 0.02 and i < len(segments) - 1:
                    complement = os.path.join(tmp, f"{scene}-{i}-complement.wav")
                    ffmpeg("-f", "lavfi", "-i", f"anullsrc=r={TAUX}:cl=mono", "-t", f"{manque:.3f}", complement)
                    morceaux.append(complement)
                    t += duree_wav(complement)
            liste = os.path.join(tmp, f"{scene}.txt")
            with open(liste, "w") as f:
                f.writelines(f"file '{m}'\n" for m in morceaux)
            sortie = os.path.join(SORTIE_AUDIO, f"{scene}.wav")
            ffmpeg("-f", "concat", "-safe", "0", "-i", liste, "-c", "copy", sortie)
            total = duree_wav(sortie)
            timings[scene] = {"fichier": f"voix/{scene}.wav", "duree": round(total, 3), "segments": segs}
            print(f"  → {total:.2f} s")
    with open(SORTIE_TIMINGS, "w", encoding="utf-8") as f:
        json.dump(timings, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("Horaires écrits dans", SORTIE_TIMINGS)


asyncio.run(main())
