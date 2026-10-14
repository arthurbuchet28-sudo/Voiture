"""Génère un MP3 par scène avec edge-tts (fr-FR-DeniseNeural) + horodatage des mots."""
import asyncio, json, os, subprocess, certifi

# Le proxy réseau ré-signe le TLS : on fait confiance à son certificat (vérification conservée).
CA = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):
    certifi.where = lambda: CA

import edge_tts
from script_voix import SCENES

VOIX = "fr-FR-DeniseNeural"
DEBIT = "+8%"
OUT = os.path.join(os.path.dirname(__file__), "build", "audio")


def duree(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


async def une_scene(nom, texte):
    com = edge_tts.Communicate(texte, VOIX, rate=DEBIT, boundary="WordBoundary",
                               proxy=os.environ.get("HTTPS_PROXY"))
    mots, mp3 = [], os.path.join(OUT, f"{nom}.mp3")
    with open(mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                mots.append({"t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7,
                             "mot": chunk["text"]})
    return {"nom": nom, "fichier": mp3, "duree": duree(mp3), "mots": mots}


async def main():
    os.makedirs(OUT, exist_ok=True)
    res = [await une_scene(n, t) for n, t in SCENES]
    with open(os.path.join(OUT, "timings.json"), "w") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    for r in res:
        print(f"{r['nom']:10s} {r['duree']:6.2f} s  ({len(r['mots'])} mots)")
    print(f"total voix : {sum(r['duree'] for r in res):.1f} s")

asyncio.run(main())
