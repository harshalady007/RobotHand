#!/bin/bash
# concat the 3 chunks, splice the re-rendered patch (frames 1566-1679: chip moved off the captain's head), mux AAC audio, print loudness measured on the AAC output
cd "$(dirname "$0")"
OUT=${1:-Machchhar_Redrawn.mp4}
ffmpeg -y -v error -f concat -safe 0 -i concat.txt -i video3d/part_01566.mp4 -i mix_final.wav -filter_complex \
"[0:v]trim=start_frame=0:end_frame=1566,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=1680,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
-map "[v]" -map 2:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
ffmpeg -nostats -i "$OUT" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
