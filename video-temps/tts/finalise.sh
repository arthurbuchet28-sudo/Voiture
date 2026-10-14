#!/usr/bin/env bash
# Produit les deux versions livrables à partir du rendu Remotion (out/le-temps-brut.mp4) :
#  - out/le-temps.mp4             : piste de sous-titres activable (mov_text) + .srt séparé
#  - out/le-temps-sous-titres.mp4 : sous-titres incrustés en bas de l'écran
# Vidéo H.264 yuv420p 30 fps, audio AAC normalisé à −16 LUFS.
set -euo pipefail
cd "$(dirname "$0")/.."
STYLE="FontName=Inter SemiBold,FontSize=10.5,PrimaryColour=&H00FFFFFF,OutlineColour=&H38140904,BorderStyle=3,Outline=1.6,Shadow=0,MarginV=14,MarginL=40,MarginR=40"
V=(-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -color_range tv -r 30 -movflags +faststart)
A=(-c:a aac -b:a 192k -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000)
ffmpeg -v error -y -i out/le-temps-brut.mp4 -i sous-titres.srt -map 0:v -map 0:a -map 1 "${V[@]}" "${A[@]}" \
  -c:s mov_text -metadata:s:s:0 language=fre -metadata:s:s:0 title="Français" out/le-temps.mp4
ffmpeg -v error -y -i out/le-temps-brut.mp4 -vf "subtitles=sous-titres.srt:force_style='${STYLE}'" "${V[@]}" "${A[@]}" out/le-temps-sous-titres.mp4
ls -la out/le-temps.mp4 out/le-temps-sous-titres.mp4
