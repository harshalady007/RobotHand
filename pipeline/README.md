# Redrawn reel pipeline (Kashmir scripts in `pipeline/kashmir/`; original kit in `redrawn_kit/`; Natural Earth GeoJSON and ASR models not committed, download them)
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

## America reel (`pipeline/america/`, "Why is America everywhere?")
Same order as above; differences:
- `edit_vo.py` is now in the repo (mp3 → w/vo_tight.wav; gaps >.38 s → .20 s, .14–.38 s → .08 s). ASR models in `w/`, world data in `ne/` (both not committed).
- `mkworld.py` (Natural Earth 10m *India-POV* countries + disputed areas → 6144² equirect globe texture, PoK + Aksai Chin inside India's boundary and hatched; US outline json). Labels ("occupied by Pakistan/China") are drawn as projected chips in `main.js` (`occ()`).
- Sets: `kglobe.js` (globe, pins, great-circle arcs, lanes), `kbase.js` (air base: jets with gear, helis, trucks, C-17), `ksea.js` (waves, destroyer / carrier / container ships, anchor drop under gravity); helpers in `kamerica.js` (flags, trucks with wheel-spin = distance/r, `flyAttitude`).
- Physics: jets take off on a constant-accel roll then rotate and climb (`takeoff`), turns use `turnP` so bank = atan(v·yawRate/g); helis use `heliFly`; ships pitch/roll from the wave field `waveH`.
- `render.cjs stills` needs the file server (`python3 -m http.server 8774` in `video3d/`); `hero.cjs T noover` renders a caption-free, overlay-free hero frame for the cover.

## 9/11 reel (`pipeline/911/`, "9/11: The Day That Changed the World Forever")
Same order as above (`edit_vo.py` → ffmpeg atempo 1.09 → `align.py` → `mkvo2.py` → `mkworld.py` → file server → `render.cjs stills` → 3 parallel `render.cjs full` → `sfx.py` → `mux.sh` → cover). Differences:
- Models in `w/`, Natural Earth in `ne/` (`ne_10m_admin_0_countries_ind` + `disputed_areas` from the nvkelso GitHub repo), both not committed. Whisper `asr.py` is only used to get the script text from the VO; `align.py` (zipformer) gives the word times. Script tokens use `|n` (`8:46|3`, `AM,|2`, `coordinated|2`, `2,977|6`, `U.S.|2`, `Al_Qaeda`).
- Sets: `s911a.js` (Lower Manhattan day→dusk with twin towers, impact gash, time-lapsed collapse, Tribute beams; memorial plaza), `s911b.js` (Pentagon, PA field, airport apron + runway, Flight 93 cabin, security checkpoint, Afghan valley, India-POV globe), `a911.js` (airliner, blast/smoke FX, facade materials, cab). Reused: `heliFly` + `jet()` (Afghanistan), `heli`, `terrain`, `Char`, `FlagA`, globe `ll()`.
- Physics: `airliner.fly()` = heading from velocity, pitch = flight-path angle + alpha, bank = atan(v·yawRate/g) (checked: left turn → left wing down); `takeoffProfile()` = constant-accel roll → rotate → climb, wheels spin = distance / r; UA93 rolls at ~90°/s; cabs/cars/trolley wheels = distance / r; towers fall at a = 5.2 m/s² time-lapsed ×12.
- `main.js`: `audit()` checks the camera against every solid box / terrain at 0.1 s steps (run in `test.cjs`); `dbg(set, p, l, fov, t, fx)` renders any camera (`dbgshots.cjs`); `window.hires(true)` for cover heroes. PoK / Aksai Chin chips (`occ()`) appear on the globe whenever both are in frame.
- Audio: `sfx.py` reads `video3d/events.json` (written by `test.cjs`). CEIL 0.62 overshot after AAC (+0.7 dBTP); `CEIL=0.55 python3 sfx.py` gives −14.1 LUFS / −4.9 dBTP measured on the AAC output (`mux.sh` prints it; stereo AAC 192k, crf 21).
- `mux.sh` also splices two re-rendered patch parts (frames 829–889, 1002–1047) over the original chunks.
