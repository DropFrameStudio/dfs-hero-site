// Everything you'll want to edit lives here: the copy, the camera shots and the work reel.
// The copy is placeholder written for the layout. Replace it with your own.

export const CONTACT_EMAIL = 'hello@example.com' // TODO: your studio inbox

// One shot per scroll chapter. The camera never moves position (the background panorama is only
// correct from that one point); each shot is a direction (yaw/pitch, in degrees) plus a lens.
//   yaw   : + turns left, - turns right       pitch : + looks up
//   lens  : focal length in mm on a 36 mm-wide sensor (28 = the hero framing)
//   focus : world point the depth of field locks onto (three.js coordinates, Y up)
export const SHOTS = {
  hero:   { yaw: -37.6, pitch: 12.4, lens: 28, focus: [0.13, 1.52, -3.79] },
  screen: { yaw: -12.0, pitch: 13.0, lens: 42, focus: [0.13, 1.52, -3.79] },
  poster: { yaw: -38.0, pitch: 12.5, lens: 60, focus: [2.62, 1.87, -4.29] },
  window: { yaw: -55.0, pitch: 11.0, lens: 44, focus: [3.58, 1.74, -2.64] },
  reel:   { yaw: -58.0, pitch: 12.0, lens: 70, focus: [3.58, 1.74, -2.64] },
  seats:  { yaw: -45.5, pitch: 5.0,  lens: 33, focus: [0.57, 0.5, -2.1] },
}

// Sections in scroll order. `shot` is the camera direction while that section is on screen.
export const CHAPTERS = [
  {
    id: 'top',
    shot: 'hero',
    title: ['Films that', 'hold the room'],
    body: 'Drop Frame Studio is a film and motion studio. Scroll to roll the reel.',
  },
  {
    id: 'craft',
    shot: 'screen',
    title: ['Every frame', 'on purpose'],
    body: 'We direct, shoot and finish films for brands, from the first board to the final grade.',
  },
  {
    id: 'studio',
    shot: 'poster',
    title: ['Story before', 'spectacle'],
    body: 'Concept, script and boards come first, so the shoot day has nothing left to guess.',
  },
  {
    id: 'light',
    shot: 'window',
    title: ['We chase', 'the light'],
    body: 'Natural light when we can get it, built light when we can’t, and every shot graded by eye.',
  },
  { id: 'work', shot: 'reel', reel: true },
  {
    id: 'contact',
    shot: 'seats',
    title: ['Take', 'a seat'],
    body: 'Tell us what you’re making and when it needs to land.',
    cta: 'Start a project',
  },
]

// Placeholder projects. The stills are frames grabbed from the hero scene. Swap in your own
// images (any 16:10 JPG/WebP in /public/work) and real titles.
export const WORK = [
  { title: 'House lights', client: 'Client name', year: '2026', image: '/work/still-1.webp' },
  { title: 'Golden hour', client: 'Client name', year: '2026', image: '/work/still-2.webp' },
  { title: 'Second row', client: 'Client name', year: '2025', image: '/work/still-3.webp' },
  { title: 'Rough cut', client: 'Client name', year: '2025', image: '/work/still-4.webp' },
  { title: 'Overgrown', client: 'Client name', year: '2024', image: '/work/still-5.webp' },
]
