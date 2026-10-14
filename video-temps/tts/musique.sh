#!/usr/bin/env bash
# Nappe d'ambiance synthétisée localement avec ffmpeg (aucun droit d'auteur) : accord de la mineur
# dont chaque note « respire » à son propre rythme, puis réverbération et filtre passe-bas.
set -euo pipefail
cd "$(dirname "$0")/.."
DUR=${1:-305}
note() { # fréquence, amplitude, période de respiration (s), phase
  echo "$2*(sin(2*PI*$1*t)+0.6*sin(2*PI*($1*1.004)*t))*(0.55+0.45*sin(2*PI*t/$3+$4))"
}
EXPR="$(note 110 0.10 23 0)+$(note 164.81 0.08 31 1)+$(note 220 0.06 17 2)+$(note 261.63 0.05 29 3)+$(note 329.63 0.04 19 4)+$(note 392 0.025 37 5)"
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='${EXPR}':s=44100:d=${DUR}" \
  -af "lowpass=f=1400,aecho=0.8:0.6:900|1700:0.35|0.25,afade=t=in:d=4,afade=t=out:st=$((DUR-6)):d=6,loudnorm=I=-20" \
  -ac 2 -b:a 160k public/audio/musique.mp3
echo "public/audio/musique.mp3 ($DUR s)"
