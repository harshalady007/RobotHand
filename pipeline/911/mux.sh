#!/bin/bash
# assemble: original 3 parts, with frames 829-889 and 1002-1047 replaced by the re-rendered patches (PoK/Aksai Chin labels), + AAC audio
cd "$(dirname "$0")"
ffmpeg -y -v error -f concat -safe 0 -i concat.txt -i video3d/part_00829.mp4 -i video3d/part_01002.mp4 -i mix_final.wav -filter_complex \
"[0:v]trim=start_frame=0:end_frame=829,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=890:end_frame=1002,setpts=PTS-STARTPTS[c];[2:v]setpts=PTS-STARTPTS[d];[0:v]trim=start_frame=1048,setpts=PTS-STARTPTS[e];[a][b][c][d][e]concat=n=5:v=1:a=0[v]" \
-map "[v]" -map 3:a -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ac 2 -ar 48000 -shortest -movflags +faststart 911_Redrawn.mp4
ffmpeg -nostats -i 911_Redrawn.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
