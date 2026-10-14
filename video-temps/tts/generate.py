"""Génère la voix off (edge-tts) scène par scène + timings des mots + sous-titres SRT.

Usage : python3 tts/generate.py   (depuis video-temps/)
Sorties : public/audio/sN.mp3, src/data/timings.json, sous-titres.srt
"""
import asyncio, json, os, re, ssl, subprocess, unicodedata
import edge_tts
import edge_tts.communicate as cm

# Le proxy HTTPS de l'environnement ré-signe le TLS : on fait confiance à son CA s'il existe.
CA = "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):
    cm._SSL_CTX = ssl.create_default_context(cafile=CA)

VOICE, RATE = "fr-FR-HenriNeural", "-5%"
BREATH = 0.6          # respiration ajoutée après chaque scène (s)
LEAD = 0.3            # silence avant la voix dans chaque scène (s)
MAX_CUE = 84          # longueur max d'un sous-titre (caractères)

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum())

async def tts(text, path):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary",
                             proxy=os.environ.get("HTTPS_PROXY"))
    words = []
    with open(path, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"], "start": ch["offset"] / 1e7,
                              "end": (ch["offset"] + ch["duration"]) / 1e7})
    return words

def align(text, words):
    """Associe chaque mot prononcé à sa position (caractère) dans le texte original."""
    flat = [(i, c) for i, c in enumerate(text) if norm(c)]
    flat_s = "".join(norm(c) for _, c in flat)
    cur = 0
    for w in words:
        n = norm(w["w"])
        k = flat_s.find(n, cur) if n else -1
        if k < 0:
            w["char"] = flat[min(cur, len(flat) - 1)][0]
            continue
        w["char"] = flat[k][0]
        cur = k + len(n)
    return words

def cues(text, words):
    """Découpe le texte en sous-titres courts, aux frontières de ponctuation."""
    def halves(c):
        if len(c) <= MAX_CUE:
            return [c]
        mid = len(c) // 2
        cut = min((i for i, ch in enumerate(c) if ch == " "), key=lambda i: abs(i - mid))
        return halves(c[:cut]) + halves(c[cut + 1:])
    out = []
    for sent in re.split(r"(?<=[.!?…])\s+", text.strip()):
        if len(sent) <= MAX_CUE:
            out.append(sent); continue
        buf = ""
        for p in re.findall(r"[^,;:]+[,;:]?\s*", sent):
            if buf and len(buf) + len(p) > MAX_CUE:
                out += halves(buf.strip()); buf = p
            else:
                buf += p
        if buf.strip():
            out += halves(buf.strip())
    res, pos = [], 0
    for c in out:
        start = text.find(c.strip(), pos); end = start + len(c.strip()); pos = end
        ws = [w for w in words if start <= w["char"] < end]
        if ws:
            res.append({"text": c.strip(), "start": ws[0]["start"], "end": ws[-1]["end"]})
    return res

def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())

def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

async def main():
    os.makedirs("public/audio", exist_ok=True); os.makedirs("src/data", exist_ok=True)
    scenes = json.load(open("tts/narration.json", encoding="utf-8"))
    result, t0, srt = [], 0.0, []
    for s in scenes:
        path = f"public/audio/{s['id']}.mp3"
        words = align(s["text"], await tts(s["text"], path))
        d = duration(path)
        total = LEAD + d + BREATH
        cs = cues(s["text"], words)
        for c in cs:
            srt.append((t0 + LEAD + c["start"], t0 + LEAD + c["end"], c["text"]))
        result.append({"id": s["id"], "audio": f"audio/{s['id']}.mp3", "audioDuration": d,
                       "lead": LEAD, "duration": total,
                       "words": [{"w": w["w"], "t": round(w["start"] + LEAD, 3)} for w in words],
                       "cues": [{"text": c["text"], "start": round(c["start"] + LEAD, 3),
                                 "end": round(c["end"] + LEAD, 3)} for c in cs]})
        print(f"{s['id']}: audio {d:.2f}s -> scène {total:.2f}s ({len(words)} mots)")
        t0 += total
    json.dump(result, open("src/data/timings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open("sous-titres.srt", "w", encoding="utf-8") as f:
        for i, (a, b, txt) in enumerate(srt, 1):
            f.write(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{txt}\n\n")
    print(f"Total : {t0:.1f}s")

asyncio.run(main())
