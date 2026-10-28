# redrawn.stories reel pipeline
- video3d/: three.js 0.169 scene (npm i three@0.169.0 @fontsource/montserrat), rendered headless via Playwright (render.py: stills | full a b | ranges). Server: python3 -m http.server 8774 in video3d/.
  - chars.js: billboard cartoon characters (hats: nvg, turban, riot, ushanka...; arms: rifle, flag, cheer, sign...)
  - sets.js / sets_osama.js: sets + helpers (heli w/ physics fly(), suv, fire, crowd, Flag, puff, dust, stars)
  - main.js: shot list timed to words W('word',n), captions (Montserrat 800, y=1352, yellow emphasis), logo outro + Follow button
- audio/: edit_vo.py (silence trim) -> ffmpeg atempo 1.09 + EQ/comp -> align.py (sherpa-onnx zipformer word times) -> mkwords.py (map to script, word|n token counts) -> mktl.py (pre-roll + dramatic pauses) -> mix_ob.py + sfx_ob.py (numpy SFX + music + ducking) -> loudnorm -14 LUFS
- cover/: cover.html template (1080x1920, logo, title lines + accent box, 3:4 safe zone) + shotcover.py
- Models: sherpa-onnx whisper base.en + zipformer-en-2023-06-26 from GitHub releases (HF blocked).
