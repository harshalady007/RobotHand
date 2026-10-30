#!/bin/bash
# concat the 3 chunks, mux AAC audio, print loudness measured on the AAC output
cd "$(dirname "$0")"
OUT=${1:-Middle_East_Redrawn.mp4}
ffmpeg -y -v error -f concat -safe 0 -i concat.txt -i mix_final.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
ffmpeg -nostats -i "$OUT" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
