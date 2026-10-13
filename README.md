# Drop Frame Studio: hero site

A Vite + React Three Fiber site built around the baked web version of the room
(`public/models/dfs_hero_web.glb`, web v2, no clouds).

## Run it in VS Code

1. Open this folder in VS Code (**File → Open Folder…**).
2. Open the terminal (**Terminal → New Terminal**) and run:

   ```bash
   npm install
   npm run dev
   ```

   Your browser opens at http://localhost:5173. Edits to any file reload instantly.
   Press **Ctrl+C** in the terminal to stop it.

Needs Node.js 18 or newer (`node -v` to check; get it from nodejs.org if missing).

`npm run build` makes a production copy in `dist/` you can upload to any static host
(Netlify, Vercel, Cloudflare Pages, S3…). `npm run preview` serves that build locally.

## What the motion does

| Piece | Where | What to tweak |
| --- | --- | --- |
| Film-leader loader: counts 8 → 2 while the room downloads, flashes a white frame, wipes away | `src/ui/Leader.jsx`, `.leader` in `styles.css` | `TICK` (ms per number) |
| Opening shot: starts wide and turned toward the tear, settles into the hero framing | `src/scene/Stage.jsx` → `CameraDirector` step 2, `App.jsx` (3.8 s, `expo.out`) | intro offsets / duration |
| Heavy smooth scroll (Lenis) | `src/lib/motion.js` → `startScroll` | `lerp` (lower = more glide) |
| Scroll moves the camera between shots in the room, holds each shot, then travels | `src/content.js` → `SHOTS`, `CHAPTERS`; `shotAt()` in `Stage.jsx` | yaw/pitch/lens per shot; the `smoothstep(0.3, 0.95, …)` hold window |
| Focus pull follows the shot | `focus` per shot in `content.js` | |
| Speed reactions: slight zoom-out, roll and RGB split while scrolling fast; the work strip bends | `CameraDirector` step 3, `Reel.jsx` | the `velocity *` factors |
| Cursor parallax + click-and-drag to look around (springs back) | `CameraDirector` step 5 | ±20° / ±10° limits |
| Custom cursor: trailing ring; "Drag" over the room, filled labels over work and the email button | `src/ui/Cursor.jsx` | `data-cursor="Label"` on any element |
| Type reveals: each character rises out of a mask when its section reaches the middle of the screen | `Title` in `Overlay.jsx`, `.title__char` | stagger in `styles.css` |
| Work reel: vertical scroll runs a film strip sideways; stills drift inside their frames | `src/ui/Reel.jsx`, `WORK` in `content.js` | section height `.reel { height }` |
| Timecode: the page is a 90-second reel; the counter runs with the scroll | `Hud` in `Overlay.jsx` | |

`prefers-reduced-motion` is respected: no intro move, no inertia, no speed effects, instant reveals.
On touch screens the custom cursor, drag-look and parallax switch off.

## Editing content

Everything you'll want to change is in **`src/content.js`**: the copy, the contact email
(`CONTACT_EMAIL`, currently a placeholder), the camera shots and the work list. The copy is
placeholder written for the layout. The work stills in `public/work/` are frames grabbed from the
room; replace them with real project stills (16:10 works best).

To find a new shot: open the site, drag to look around, then nudge `yaw` (+ left / − right),
`pitch` (+ up) and `lens` (bigger = tighter) for that chapter. The camera never moves position,
because the background panorama is only correct from that one point.

## Fonts

Big Shoulders Display (headlines) and Hanken Grotesk (text), loaded from Google Fonts in
`index.html`.

## Files

```
public/
  models/dfs_hero_web.glb    baked scene (Draco + KTX2), 2.6 MB
  textures/floor_wetness.webp  puddle mask for the live floor reflections
  draco/, basis/             decoders three.js needs for the model
  work/                      placeholder stills for the reel
src/
  content.js                 copy, shots, work list
  App.jsx                    wires loader → intro → scroll
  scene/Stage.jsx            canvas, materials, reflections, camera director, post effects
  ui/Leader.jsx              loader
  ui/Overlay.jsx             masthead, chapters, timecode
  ui/Reel.jsx                work strip
  ui/Cursor.jsx              custom cursor
  lib/motion.js              shared motion state, Lenis, easing helpers
  styles.css                 all styles and tokens
```
