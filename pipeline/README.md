# Redrawn reel pipeline (scripts live in session scratchpad `work/`, not committed)
Scripts: `edit_vo.py` (vo_orig.mp3→vo_tight.wav, trims gaps) · `align.py` (ve16.wav→asr_words.json, sherpa zipformer) · `mkvo2.py` (script+pauses→vo_final.wav, video3d/timeline.json, timeline_full.json) · `mkmaps.py` (Natural Earth→assets/map_*.png/json) · `render.cjs stills T,T[,nocap]|full A B` (3D+captions→part_A.mp4) · `sfx.py` (SFX+music+duck→mix_final.wav, −14 LUFS) · `hero.cjs T,T` + `shotcover.cjs "img=…" out.png` (thumbnail).
Order: 1 `edit_vo.py` → 2 ffmpeg atempo=1.09,EQ,comp→ve48/ve16.wav → 3 `align.py` → 4 edit script/pauses in `mkvo2.py`, run → 5 `mkmaps.py` → 6 `python3 -m http.server 8774` in video3d → 7 `render.cjs stills …` (contact sheets, fix) → 8 `render.cjs full 0 746 / 746 1492 / 1492 2235` in parallel → 9 `sfx.py` → 10 ffmpeg concat + mux (crf22, aac192) → 11 `hero.cjs`, `shotcover.cjs` → caption.
Manual fixes this video:
- ASR models from GitHub releases; script tokens mapped with `|n` (1947,|3, ceasefire|2, Aksai_Chin|2).
- Pause "So" used 1st occurrence ("so much"); fixed to `idx('So',2)` and re-rendered.
- Word lookups `W('For'|'and'|'The'|'In'|'Kashmir'|'So', n)` needed nth fixes in main.js.
- LoC fence moved to a valley-floor pad; ridge camera was inside rock; sandbags blocking camera removed.
- Kit bugs: heli bank sign inverted (own `heliFly`), heli underside black, char shadow ignored y, flag pole offset.
- Soldiers/chars enlarged (2.4 m) and moved on-axis (portrait fov is narrow); Siachen parkas recoloured for contrast.
- Audio: added comp+4×-oversampled limiter at 0.62 so AAC output stays ≤ −1 dBTP at −14 LUFS.
