/* ============================================================
   FNAF Runtime stylesheet.
   Held as a JS string so the studio can export it (and preview it)
   without a web server. Exports write it out as a real css/style.css.
   ============================================================ */
(function () {
  window.FNAF = window.FNAF || {};
  window.FNAF.CSS = `
/* ============================================================
   FNAF Runtime stylesheet — used by the studio preview AND by
   every exported game (copied to css/style.css on export).
   ============================================================ */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
body {
  font-family: 'Courier New', Courier, monospace;
  color: #ddd;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
}
#fnaf-root { position: fixed; inset: 0; overflow: hidden; background: var(--bg, #000); }

/* ---------- shared bits ---------- */
.fn-screen {
  position: absolute; inset: 0; display: none;
  align-items: center; justify-content: center; flex-direction: column;
  background: var(--bg, #000);
}
.fn-screen.on { display: flex; }
.fn-layer { position: absolute; inset: 0; display: none; }
.fn-layer.on { display: block; }

.fn-title {
  font-family: Impact, 'Arial Black', sans-serif;
  font-size: clamp(30px, 6vw, 62px);
  letter-spacing: 4px; text-align: center; line-height: 1.05;
  color: var(--titleColor, #fff);
  text-shadow: 0 0 18px var(--accent, #f33), 0 0 46px rgba(0,0,0,.9);
}
.fn-sub { color: #7a7a7a; font-size: clamp(12px, 1.6vw, 18px); margin-top: 12px; letter-spacing: 2px; }
.fn-btn {
  background: none; border: 2px solid #4a4a4a; color: #e8e8e8;
  font-family: Impact, 'Arial Black', sans-serif; font-size: 22px; letter-spacing: 3px;
  padding: 12px 44px; margin: 7px; cursor: pointer; transition: all .18s; text-transform: uppercase;
}
.fn-btn:hover { border-color: var(--accent, #f44); color: var(--accent, #f44); text-shadow: 0 0 10px var(--accent, #f44); }
.fn-btn:disabled { opacity: .3; cursor: not-allowed; }
.fn-btn.small { font-size: 15px; padding: 8px 22px; letter-spacing: 2px; }
.fn-hint { color: #555; font-size: 12px; margin-top: 26px; letter-spacing: 1px; text-align: center; line-height: 1.7; }

/* ---------- CRT effects ---------- */
.fn-scanlines {
  position: absolute; inset: 0; pointer-events: none; z-index: 6;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.16) 2px, rgba(0,0,0,.16) 4px);
}
.fn-vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 5;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.85) 100%);
}
.fn-static {
  position: absolute; inset: 0; pointer-events: none; z-index: 7;
  opacity: .07; mix-blend-mode: screen;
  background-repeat: repeat; animation: fnStaticShift .18s steps(2) infinite;
}
@keyframes fnStaticShift {
  0%   { background-position: 0 0; }
  50%  { background-position: 13px 7px; }
  100% { background-position: 5px 19px; }
}

/* ---------- night intro ---------- */
#fn-nightcard { z-index: 90; background: #000; }
#fn-nightcard .n { font-family: Impact, sans-serif; font-size: 56px; letter-spacing: 6px; color: #ddd; }
#fn-nightcard .sub { color: #666; margin-top: 10px; letter-spacing: 3px; }

/* ---------- office ---------- */
#fn-office { z-index: 10; }
#fn-office-cam-wrap {
  position: absolute; inset: 0; overflow: hidden;
}
#fn-office-pan {
  position: absolute; top: 0; left: 0; height: 100%;
  width: 148%; transition: transform .12s linear; will-change: transform;
}
#fn-office-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 45%, #1b1611 0%, #0b0906 58%, #000 100%);
  background-size: cover; background-position: center;
}
.fn-door-panel {
  position: absolute; top: 12%; height: 62%; width: 16%; min-width: 150px;
  display: flex; flex-direction: column; gap: 8px;
}
.fn-door-panel.left  { left: 2%; }
.fn-door-panel.right { right: 2%; }
.fn-door-frame {
  flex: 1; position: relative; border: 3px solid #2e2e2e; background: #070707; overflow: hidden;
}
.fn-hallway {
  position: absolute; inset: 0; background: #050505;
  background-size: cover; background-position: center;
  transition: filter .1s, background-color .1s; filter: brightness(.18);
}
.fn-hallway.lit { filter: brightness(1); }
.fn-hall-creature {
  position: absolute; inset: 0; display: none;
  align-items: flex-end; justify-content: center;
}
.fn-hall-creature.on { display: flex; }
.fn-hall-creature canvas, .fn-hall-creature img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  animation: fnLurk 1.6s ease-in-out infinite alternate;
}
@keyframes fnLurk {
  from { transform: translateX(-2px) scale(1); }
  to   { transform: translateX(2px) scale(1.02); }
}
.fn-door-slab {
  position: absolute; inset: 0; z-index: 3;
  background: repeating-linear-gradient(0deg, #2b2b2b 0px, #232323 4px, #2b2b2b 8px);
  border-bottom: 6px solid #151515;
  transform-origin: top; transform: scaleY(0); transition: transform .35s cubic-bezier(.4,0,.2,1);
}
.fn-door-slab.closed { transform: scaleY(1); }
.fn-door-btns { display: flex; gap: 6px; }
.fn-ctl {
  flex: 1; padding: 11px 0; border: 2px solid #3d3d3d; background: #141414;
  color: #9a9a9a; font-family: 'Courier New', monospace; font-size: 11px; font-weight: bold;
  letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all .15s;
}
.fn-ctl:hover { border-color: #ddd; color: #ddd; }
.fn-ctl.active { background: #340000; border-color: #f44; color: #f44; box-shadow: 0 0 12px rgba(255,60,60,.35) inset; }
.fn-ctl.lit    { background: #333000; border-color: #fd0; color: #fd0; box-shadow: 0 0 12px rgba(255,220,0,.35) inset; }

#fn-vent {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  width: 22%; min-width: 200px; display: flex; flex-direction: column; gap: 8px;
}
#fn-vent-frame { height: 110px; position: relative; border: 3px solid #2e2e2e; background: #0a0a0a; overflow: hidden; }
#fn-vent-inner { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(.5); }
#fn-vent-grate {
  position: absolute; inset: 0; z-index: 3; transform-origin: top; transition: transform .3s;
  background: repeating-linear-gradient(90deg, #383838 0 3px, transparent 3px 18px),
              repeating-linear-gradient(0deg, #383838 0 3px, transparent 3px 18px);
}
#fn-vent-grate.open { transform: scaleY(0); }
.fn-vent-creature { position: absolute; inset: 0; display: none; }
.fn-vent-creature.on { display: block; }
.fn-vent-creature canvas, .fn-vent-creature img { width: 100%; height: 100%; object-fit: cover; }

#fn-desk {
  position: absolute; bottom: 11%; left: 50%; transform: translateX(-50%);
  display: flex; align-items: flex-end; gap: 30px;
}
#fn-fan {
  width: 62px; height: 62px; border: 3px solid #2f2f2f; border-radius: 50%; position: relative;
  animation: fnSpin .9s linear infinite;
}
#fn-fan::before, #fn-fan::after { content: ''; position: absolute; background: #3d3d3d; }
#fn-fan::before { width: 4px; height: 100%; left: 50%; transform: translateX(-50%); }
#fn-fan::after  { height: 4px; width: 100%; top: 50%; transform: translateY(-50%); }
@keyframes fnSpin { to { transform: rotate(360deg); } }

/* ---------- HUD ---------- */
.fn-hud {
  position: absolute; bottom: 0; left: 0; right: 0; height: 84px; z-index: 30;
  background: linear-gradient(to top, rgba(0,0,0,.94), rgba(0,0,0,.55));
  border-top: 1px solid #1e1e1e;
  display: flex; align-items: center; justify-content: space-between; padding: 0 26px;
}
.fn-power-label { color: #6f6; font-size: 13px; letter-spacing: 1px; }
.fn-bar { width: 165px; height: 13px; background: #171717; border: 1px solid #3a3a3a; margin-top: 5px; }
.fn-bar > i { display: block; height: 100%; background: #6f6; transition: width .35s, background-color .35s; }
.fn-usage { color: #666; font-size: 11px; margin-top: 4px; letter-spacing: 1px; }
.fn-usage b { color: #6f6; letter-spacing: 2px; }
.fn-clock { font-family: Impact, sans-serif; font-size: 38px; color: #fff; letter-spacing: 2px; }
.fn-clock small { display: block; font-family: 'Courier New', monospace; font-size: 12px; color: #666; letter-spacing: 3px; text-align: center; }

/* ---------- cameras ---------- */
#fn-cams { z-index: 20; background: #000; }
#fn-cam-feed {
  position: absolute; top: 12px; left: 12px; right: 232px; bottom: 96px;
  border: 2px solid #262626; background: #030303; overflow: hidden;
}
#fn-cam-canvas { display: block; width: 100%; height: 100%; }
#fn-cam-name {
  position: absolute; top: 24px; left: 26px; z-index: 12;
  color: #fff; font-size: 15px; font-weight: bold; letter-spacing: 2px; text-shadow: 0 0 8px #000;
}
#fn-cam-rec {
  position: absolute; top: 24px; right: 250px; z-index: 12;
  color: #f22; font-size: 13px; font-weight: bold; letter-spacing: 2px;
  animation: fnBlink 1.1s steps(1) infinite;
}
@keyframes fnBlink { 0%,60% { opacity: 1; } 61%,100% { opacity: 0; } }
#fn-cam-list {
  position: absolute; top: 12px; right: 12px; width: 210px; bottom: 96px;
  background: rgba(9,9,9,.92); border: 2px solid #262626; padding: 10px;
  display: flex; flex-direction: column; gap: 5px; overflow-y: auto;
}
#fn-cam-list h3 { color: #7a7a7a; font-size: 10px; letter-spacing: 3px; margin-bottom: 4px; text-transform: uppercase; }
.fn-cam-btn {
  padding: 8px 9px; border: 1px solid #2c2c2c; background: #0e0e0e; color: #8b8b8b;
  font-family: 'Courier New', monospace; font-size: 11px; text-align: left; cursor: pointer;
  transition: all .15s; display: flex; justify-content: space-between; align-items: center; gap: 6px;
}
.fn-cam-btn:hover { border-color: #ddd; color: #ddd; }
.fn-cam-btn.active { border-color: #4af; color: #4af; background: #071426; }
.fn-cam-btn .dot { width: 7px; height: 7px; border-radius: 50%; background: transparent; flex: none; }
.fn-cam-btn.hot .dot { background: #f33; box-shadow: 0 0 7px #f33; animation: fnBlink .9s steps(1) infinite; }
#fn-cam-minimap { margin-top: 8px; border-top: 1px solid #222; padding-top: 8px; }
#fn-cam-minimap canvas { width: 100%; display: block; }

/* ---------- jumpscare / power out ---------- */
#fn-scare { z-index: 200; background: #000; display: none; align-items: center; justify-content: center; }
#fn-scare.on { display: flex; }
#fn-scare > * {
  width: 112%; height: 112%; object-fit: cover;
  filter: contrast(1.45) saturate(1.2);
  animation: fnScare .07s steps(2) infinite alternate;
}
@keyframes fnScare {
  0%   { transform: translate(-2%, -2%) rotate(-1.4deg) scale(1.06); }
  100% { transform: translate(2.5%, 1.5%) rotate(1.6deg) scale(1.14); }
}
#fn-powerout { z-index: 40; background: #000; }
#fn-powerout .eyes {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  width: min(46vw, 420px); opacity: 0; transition: opacity 1.4s;
}
#fn-powerout .eyes.on { opacity: 1; }

/* ---------- end screens ---------- */
#fn-lose { z-index: 210; }
#fn-lose .fn-title { color: #f22; text-shadow: 0 0 26px #f00; }
#fn-win  { z-index: 210; }
#fn-win .fn-title { color: #ffd23a; text-shadow: 0 0 26px #fa0; }

#fn-pause { z-index: 220; background: rgba(0,0,0,.88); }
#fn-toast {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%); z-index: 120;
  color: #bbb; background: rgba(0,0,0,.7); border: 1px solid #333; padding: 7px 16px;
  font-size: 12px; letter-spacing: 2px; opacity: 0; transition: opacity .3s; pointer-events: none;
}
#fn-toast.on { opacity: 1; }

/* ---------- night select ---------- */
.fn-nights { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 620px; margin: 24px 0 6px; }
.fn-night-btn {
  width: 96px; padding: 14px 0; border: 2px solid #3c3c3c; background: #0d0d0d; color: #bbb;
  font-family: Impact, sans-serif; font-size: 17px; letter-spacing: 2px; cursor: pointer; transition: all .18s;
}
.fn-night-btn:hover:not(:disabled) { border-color: var(--accent,#f44); color: var(--accent,#f44); }
.fn-night-btn:disabled { opacity: .25; cursor: not-allowed; }
.fn-night-btn.done { border-color: #3a6; color: #3a6; }

@media (max-width: 780px) {
  #fn-cam-feed { right: 12px; bottom: 210px; }
  #fn-cam-list { top: auto; bottom: 96px; left: 12px; right: 12px; width: auto; height: 104px;
                 flex-direction: row; overflow-x: auto; }
  #fn-cam-rec { right: 24px; }
  .fn-door-panel { min-width: 110px; width: 26%; }
  #fn-vent { min-width: 140px; width: 34%; }
}
`;
})();
