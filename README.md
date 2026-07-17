# GLM35

Two browser apps with no build step. Open the HTML files directly or serve the
folder with any static web host.

## Safe Inside

A playable first-person 3D survival game based on `GAME_DESIGN.md`. The RV is a
fully walkable safe zone. Tapping INSIDE near its door moves the player inside
immediately, locks the doors, and prevents all enemy damage.

**Play it:** open `safe-inside.html` in Chrome or serve this folder from a
static host. Android landscape mode is the primary target. The OnePlus 12 uses
the balanced preset by default, with adaptive resolution to protect the frame
rate. Desktop controls are also supported.

The game includes:

- True first-person camera, touch look, movement joystick, visible carbine and hands
- Landscape Android HUD with FIRE, USE, RELOAD, PACK, INSIDE, and OUTSIDE controls
- Detailed RV kitchen, fridge, television, bedroom, washroom, shower, and storage
- Instant RV safety, automatic door locking, safe cooking, resting, sleeping, and saving
- Twenty-slot backpack, consumable food and water, materials, ammunition, and crafting
- Dense procedural forest, cabins, supply crates, harvestable trees, rocks, rain, fog, lightning, stars, and moonlight
- Short dim daytime and a longer, darker night with more numerous and faster enemies
- Health, hunger, thirst, stamina, rifle combat, mobile aim assistance, and local autosave
- Balanced and high-quality modes plus automatic render-scale adjustment for stable mobile performance

Runtime files are `safe-inside.html`, `safe-inside-v2.css`, and
`safe-inside-game.js`. Three.js remains embedded in the HTML, so no package
installation is required.

## Momentum

A single-file, local-first weekly budgeting app built for people who abandon
budget apps by week two.

**Use it:** save `momentum.html` anywhere and open it in a browser. That's the
whole install. No account, no server, no network — all data stays in the
browser's local storage on the device. Works offline.

**What's inside**
- 30-second logging: amount + one of five categories, one tap to save
- Catch-Up / Reset: a calm, guilt-free flow to get current after time away
- Fun money: a weekly budget line for impulse spending, tracked front and center
- Streaks, comeback counter, progress meters, and small celebrations
- Weekly horizon with "start a new week", past-week history, edit/delete entries
- Export / import JSON backups, responsive down to phones, honors
  dark mode and reduced-motion preferences
