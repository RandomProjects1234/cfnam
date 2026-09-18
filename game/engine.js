/* ============================================================
   FNAF Runtime — game engine
   Fully config driven. One night = one Engine instance.
   ============================================================ */
FNAF_MODULE('engine.js', function (root) {
  var FNAF = root.FNAF = root.FNAF || {};
  var A = FNAF.Audio, R = FNAF.Render;

  /* ---------------- helpers ---------------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.setAttribute('style', attrs[k]);
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var HOURS = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM'];

  /* ---------------- config defaults ---------------- */
  FNAF.defaultAnimatronic = function (i) {
    return {
      id: 'a' + (i + 1),
      name: 'Animatronic ' + (i + 1),
      color: ['#8a5a2b', '#7a4fa3', '#c9a227', '#b03a2e', '#2e86a3', '#3f7d3f'][i % 6],
      eyeColor: '#ffffff',
      shape: ['bear', 'bunny', 'chicken', 'fox', 'bot', 'ghost'][i % 6],
      camImage: null, doorImage: null, jumpscareImage: null, jumpscareSound: null,
      ai: [2, 4, 7, 10, 14, 18, 20],
      moveInterval: 5,
      attackDelay: 6,
      retreatDelay: 5,
      pathMode: 'random',      // 'random' | 'route'
      route: [],
      entry: 'any',            // 'left' | 'right' | 'vent' | 'any'
      startRoom: null,
      traits: {
        stoppedByDoor: true,
        stunnedByLight: false,
        drainsPower: 0,
        freezeWhenWatched: false,
        rushWhenIgnored: false,
        invisibleOnCam: false,
        jamsCameras: false,
        ignoresDoors: false,
        knock: true
      },
      voice: { volume: 1, lines: [] }
    };
  };

  FNAF.normalize = function (cfg) {
    cfg = JSON.parse(JSON.stringify(cfg || {}));
    cfg.meta = Object.assign({ title: 'Five Nights', subtitle: 'A Security Nightmare', nights: 5, hourSeconds: 55, customNight: true }, cfg.meta);
    cfg.theme = Object.assign({ accent: '#ff3b3b', titleColor: '#ffffff', bg: '#000000' }, cfg.theme);
    cfg.power = Object.assign({
      // %/second. Tuned against a 6-hour night: idle costs ~25% of a 100% battery,
      // both doors + cameras for the whole night runs you dry before 6 AM.
      enabled: true, start: 100, baseDrain: 0.075, doorDrain: 0.13, lightDrain: 0.16,
      camDrain: 0.12, ventDrain: 0.11, blackoutDelay: 9, blackoutMusic: null
    }, cfg.power);
    cfg.audio = Object.assign({ master: 0.85, ambient: 'fan', ambientVolume: 0.35, ambientFile: null, footsteps: true }, cfg.audio);
    cfg.text = Object.assign({
      win: '6 AM', winSub: 'You survived the night.',
      lose: 'GAME OVER', loseSub: 'Click anywhere to try again.',
      intro: ''
    }, cfg.text);
    cfg.office = Object.assign({ image: null, panEnabled: true, fan: true }, cfg.office);
    cfg.office.left = Object.assign({ enabled: true, door: true, light: true, image: null }, cfg.office.left);
    cfg.office.right = Object.assign({ enabled: true, door: true, light: true, image: null }, cfg.office.right);
    cfg.office.vent = Object.assign({ enabled: true, door: true, image: null }, cfg.office.vent);

    if (!cfg.map || !cfg.map.rooms || !cfg.map.rooms.length) {
      cfg.map = { id: 'blank', name: 'Blank', start: 'r1', rooms: [
        { id: 'r1', name: 'Main Room', label: 'CAM 1', style: 'stage', image: null, x: 0.5, y: 0.15, links: ['r2'], entry: null },
        { id: 'r2', name: 'Hall', label: 'CAM 2', style: 'hall', image: null, x: 0.5, y: 0.6, links: ['r1'], entry: 'left' }
      ] };
    }
    cfg.map.rooms.forEach(function (r, i) {
      r.id = r.id || 'r' + (i + 1);
      r.name = r.name || 'Room ' + (i + 1);
      r.label = r.label || ('CAM ' + (i + 1));
      r.style = r.style || 'generic';
      r.links = r.links || [];
      r.entry = r.entry || null;
      if (typeof r.x !== 'number') r.x = 0.2 + (i % 4) * 0.2;
      if (typeof r.y !== 'number') r.y = 0.15 + Math.floor(i / 4) * 0.25;
    });
    var ids = cfg.map.rooms.map(function (r) { return r.id; });
    // strip dangling links (a common source of "animatronic gets stuck" bugs)
    cfg.map.rooms.forEach(function (r) {
      r.links = r.links.filter(function (l) { return l !== r.id && ids.indexOf(l) >= 0; });
    });
    if (ids.indexOf(cfg.map.start) < 0) cfg.map.start = ids[0];

    cfg.animatronics = (cfg.animatronics || []).slice(0, 6).map(function (a, i) {
      var d = FNAF.defaultAnimatronic(i);
      var m = Object.assign(d, a);
      m.traits = Object.assign(d.traits, a.traits || {});
      m.voice = Object.assign({ volume: 1, lines: [] }, a.voice || {});
      m.ai = (m.ai && m.ai.length ? m.ai : d.ai).slice(0, 7);
      while (m.ai.length < 7) m.ai.push(m.ai[m.ai.length - 1]);
      // An empty doorway/jumpscare picture means "use the camera picture". Older
      // projects stored the same picture three times, tripling the game's size.
      if (m.doorImage && m.doorImage === m.camImage) m.doorImage = null;
      if (m.jumpscareImage && m.jumpscareImage === m.camImage) m.jumpscareImage = null;
      m.route = (m.route || []).filter(function (id) { return ids.indexOf(id) >= 0; });
      if (m.pathMode === 'route' && !m.route.length) m.pathMode = 'random';
      if (ids.indexOf(m.startRoom) < 0) m.startRoom = m.pathMode === 'route' ? m.route[0] : cfg.map.start;
      return m;
    });
    if (!cfg.animatronics.length) cfg.animatronics = [FNAF.defaultAnimatronic(0)];
    return cfg;
  };

  /* ============================================================
     Engine
     ============================================================ */
  FNAF.Engine = function (opts) {
    var cfg = opts.cfg;
    var mount = opts.mount;
    var night = opts.night || 1;
    var onEnd = opts.onEnd || function () {};

    var rooms = cfg.map.rooms;
    var roomById = {};
    rooms.forEach(function (r) { roomById[r.id] = r; });

    var S = {
      t: 0, hour: 0, power: cfg.power.start,
      camOpen: false, cam: cfg.map.start,
      door: { left: false, right: false, vent: false },
      light: { left: false, right: false },
      over: false, won: false, paused: false,
      blackout: false, blackoutT: 0,
      camJam: 0, running: true
    };

    var actors = cfg.animatronics.map(function (def) {
      return {
        def: def, room: def.startRoom, at: null,
        moveT: def.moveInterval * (0.6 + Math.random() * 0.8),
        attackT: 0, retreatT: 0, stunT: 0, routeIdx: 0, announced: false
      };
    });

    function aiLevel(def) {
      var idx = clamp(night - 1, 0, 6);
      return clamp(def.ai[idx], 0, 20);
    }

    /* ---------------- DOM ---------------- */
    var dom = {};
    var wrap = h('div', { class: 'fn-layer on', id: 'fn-game' });

    // office ------------------------------------------------
    var pan = h('div', { id: 'fn-office-pan' });
    dom.pan = pan;
    dom.bg = h('div', { id: 'fn-office-bg' });
    if (cfg.office.image) dom.bg.style.backgroundImage = 'url("' + cfg.office.image + '")';
    pan.appendChild(dom.bg);

    function sidePanel(side) {
      var conf = cfg.office[side];
      var hall = h('div', { class: 'fn-hallway' });
      if (conf.image) hall.style.backgroundImage = 'url("' + conf.image + '")';
      var creature = h('div', { class: 'fn-hall-creature' });
      var slab = h('div', { class: 'fn-door-slab' });
      var frame = h('div', { class: 'fn-door-frame' }, [hall, creature, slab]);
      var btns = h('div', { class: 'fn-door-btns' });
      var doorBtn = null, lightBtn = null;
      if (conf.door) { doorBtn = h('button', { class: 'fn-ctl', text: 'Door' }); btns.appendChild(doorBtn); }
      if (conf.light) { lightBtn = h('button', { class: 'fn-ctl', text: 'Light' }); btns.appendChild(lightBtn); }
      var panel = h('div', { class: 'fn-door-panel ' + side }, [frame, btns]);
      return { panel: panel, hall: hall, creature: creature, slab: slab, doorBtn: doorBtn, lightBtn: lightBtn };
    }

    dom.left = cfg.office.left.enabled ? sidePanel('left') : null;
    dom.right = cfg.office.right.enabled ? sidePanel('right') : null;
    if (dom.left) pan.appendChild(dom.left.panel);
    if (dom.right) pan.appendChild(dom.right.panel);

    if (cfg.office.vent.enabled) {
      dom.ventInner = h('div', { id: 'fn-vent-inner' });
      if (cfg.office.vent.image) dom.ventInner.style.backgroundImage = 'url("' + cfg.office.vent.image + '")';
      dom.ventCreature = h('div', { class: 'fn-vent-creature' });
      dom.ventGrate = h('div', { id: 'fn-vent-grate', class: 'open' });
      dom.ventBtn = cfg.office.vent.door ? h('button', { class: 'fn-ctl', text: 'Close Vent' }) : null;
      var vkids = [h('div', { id: 'fn-vent-frame' }, [dom.ventInner, dom.ventCreature, dom.ventGrate])];
      if (dom.ventBtn) vkids.push(dom.ventBtn);
      pan.appendChild(h('div', { id: 'fn-vent' }, vkids));
    }

    if (cfg.office.fan) pan.appendChild(h('div', { id: 'fn-desk' }, [h('div', { id: 'fn-fan' })]));

    dom.powerPct = h('span', { text: '100' });
    dom.powerFill = h('i', { style: 'width:100%' });
    dom.usage = h('b', { text: '|' });
    dom.clock = h('div', { class: 'fn-clock' });
    dom.clockHour = document.createTextNode('12 AM');
    dom.clock.appendChild(dom.clockHour);
    dom.clock.appendChild(h('small', { text: 'Night ' + night }));
    dom.camBtn = h('button', { class: 'fn-btn small', text: 'Cameras' });

    var powerBlock = h('div', {}, [
      h('div', { class: 'fn-power-label' }, [document.createTextNode('Power: '), dom.powerPct, document.createTextNode('%')]),
      h('div', { class: 'fn-bar' }, [dom.powerFill]),
      h('div', { class: 'fn-usage' }, [document.createTextNode('Usage: '), dom.usage])
    ]);
    if (!cfg.power.enabled) powerBlock.style.visibility = 'hidden';

    dom.officeHud = h('div', { class: 'fn-hud' }, [powerBlock, dom.clock, dom.camBtn]);

    dom.office = h('div', { class: 'fn-layer on', id: 'fn-office' }, [
      h('div', { id: 'fn-office-cam-wrap' }, [pan]),
      dom.officeHud,
      h('div', { class: 'fn-vignette' }),
      h('div', { class: 'fn-scanlines' })
    ]);

    // cameras ------------------------------------------------
    dom.camCanvas = h('canvas', { id: 'fn-cam-canvas' });
    dom.camName = h('div', { id: 'fn-cam-name', text: '' });
    dom.camList = h('div', { id: 'fn-cam-list' }, [h('h3', { text: 'Camera System' })]);
    dom.camButtons = {};
    rooms.forEach(function (r, i) {
      var dot = h('span', { class: 'dot' });
      var b = h('button', { class: 'fn-cam-btn' }, [
        h('span', { text: (r.label ? r.label + ' · ' : '') + r.name }), dot
      ]);
      b.onclick = function () { switchCam(r.id); };
      dom.camButtons[r.id] = b;
      dom.camList.appendChild(b);
    });
    dom.mini = h('canvas', {});
    dom.camList.appendChild(h('div', { id: 'fn-cam-minimap' }, [dom.mini]));

    dom.camPowerPct = h('span', { text: '100' });
    dom.camPowerFill = h('i', { style: 'width:100%' });
    dom.camClock = h('div', { class: 'fn-clock' });
    dom.camClockHour = document.createTextNode('12 AM');
    dom.camClock.appendChild(dom.camClockHour);
    dom.camClock.appendChild(h('small', { text: 'Night ' + night }));
    dom.camClose = h('button', { class: 'fn-btn small', text: 'Close' });

    var camPowerBlock = h('div', {}, [
      h('div', { class: 'fn-power-label' }, [document.createTextNode('Power: '), dom.camPowerPct, document.createTextNode('%')]),
      h('div', { class: 'fn-bar' }, [dom.camPowerFill])
    ]);
    if (!cfg.power.enabled) camPowerBlock.style.visibility = 'hidden';

    dom.cams = h('div', { class: 'fn-layer', id: 'fn-cams' }, [
      h('div', { id: 'fn-cam-feed' }, [dom.camCanvas, h('div', { class: 'fn-scanlines' })]),
      dom.camName,
      h('div', { id: 'fn-cam-rec', html: '&#9679; REC' }),
      dom.camList,
      h('div', { class: 'fn-hud' }, [camPowerBlock, dom.camClock, dom.camClose])
    ]);

    // overlays ------------------------------------------------
    dom.blackout = h('div', { class: 'fn-layer', id: 'fn-powerout' }, [h('canvas', { class: 'eyes' })]);
    dom.scare = h('div', { class: 'fn-layer', id: 'fn-scare' });
    dom.toast = h('div', { id: 'fn-toast' });
    dom.pause = h('div', { class: 'fn-screen', id: 'fn-pause' }, [
      h('div', { class: 'fn-title', text: 'PAUSED' }),
      h('div', { class: 'fn-hint', text: 'Press P or Esc to resume' })
    ]);

    wrap.appendChild(dom.office);
    wrap.appendChild(dom.cams);
    wrap.appendChild(dom.blackout);
    wrap.appendChild(dom.scare);
    wrap.appendChild(dom.toast);
    wrap.appendChild(dom.pause);
    mount.appendChild(wrap);

    /* ---------------- toast ---------------- */
    var toastT = null;
    function toast(msg) {
      dom.toast.textContent = msg;
      dom.toast.classList.add('on');
      clearTimeout(toastT);
      toastT = setTimeout(function () { dom.toast.classList.remove('on'); }, 1800);
    }

    /* ---------------- controls ---------------- */
    function canAct() { return S.running && !S.over && !S.won && !S.blackout && !S.paused; }

    function toggleDoor(side) {
      if (!canAct()) return;
      var conf = cfg.office[side];
      if (!conf || !conf.enabled || (side !== 'vent' && !conf.door) || (side === 'vent' && !conf.door)) return;
      S.door[side] = !S.door[side];
      A.sfx(side === 'vent' ? 'vent' : 'door');
      paint();
    }
    function setLight(side, on) {
      if (side === 'left' && (!dom.left || !cfg.office.left.light)) return;
      if (side === 'right' && (!dom.right || !cfg.office.right.light)) return;
      if (on && !canAct()) return;
      if (S.light[side] === on) return;
      S.light[side] = on;
      if (on) A.sfx('light');
      paint();
    }
    function switchCam(id) {
      if (!roomById[id] || S.over || S.won) return;
      S.cam = id;
      A.sfx('camswitch');
      paintCams();
    }
    function setCams(open) {
      if (!S.running || S.over || S.won || S.blackout) return;
      if (S.camOpen === open) return;
      S.camOpen = open;
      dom.cams.classList.toggle('on', open);
      dom.office.classList.toggle('on', !open);
      A.sfx('camopen');
      if (open) paintCams();
    }

    if (dom.left && dom.left.doorBtn) dom.left.doorBtn.onclick = function () { toggleDoor('left'); };
    if (dom.right && dom.right.doorBtn) dom.right.doorBtn.onclick = function () { toggleDoor('right'); };
    if (dom.ventBtn) dom.ventBtn.onclick = function () { toggleDoor('vent'); };

    function bindHold(btn, side) {
      if (!btn) return;
      var down = function (e) { e.preventDefault(); setLight(side, true); };
      var up = function () { setLight(side, false); };
      btn.addEventListener('mousedown', down);
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
      btn.addEventListener('touchend', up);
      btn.addEventListener('touchcancel', up);
    }
    if (dom.left) bindHold(dom.left.lightBtn, 'left');
    if (dom.right) bindHold(dom.right.lightBtn, 'right');

    dom.camBtn.onclick = function () { setCams(true); };
    dom.camClose.onclick = function () { setCams(false); };

    /* panning */
    var panX = 0, panTarget = 0;
    function onMove(e) {
      if (!cfg.office.panEnabled || S.camOpen) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth;
      panTarget = -clamp((x - 0.5) * 2, -1, 1) * 24; // percent
    }
    dom.office.addEventListener('mousemove', onMove);
    dom.office.addEventListener('touchmove', onMove, { passive: true });
    if (!cfg.office.panEnabled) pan.style.width = '100%';

    /* keyboard */
    function onKey(e) {
      if (!S.running) return;
      var k = e.key.toLowerCase();
      if (k === 'p' || k === 'escape') {
        if (S.camOpen && k === 'escape') { setCams(false); return; }
        togglePause(); return;
      }
      if (S.over || S.won || S.paused) return;
      if (k === ' ') { e.preventDefault(); setCams(!S.camOpen); return; }
      if (!S.camOpen) {
        if (k === 'a' || k === 'arrowleft') toggleDoor('left');
        else if (k === 'd' || k === 'arrowright') toggleDoor('right');
        else if (k === 'w' || k === 'arrowup') toggleDoor('vent');
        else if (k === 'q') setLight('left', true);
        else if (k === 'e') setLight('right', true);
      } else if (/^[1-9]$/.test(k)) {
        var r = rooms[parseInt(k, 10) - 1];
        if (r) switchCam(r.id);
      }
    }
    function onKeyUp(e) {
      var k = e.key.toLowerCase();
      if (k === 'q') setLight('left', false);
      if (k === 'e') setLight('right', false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);

    function togglePause() {
      if (S.over || S.won) return;
      S.paused = !S.paused;
      dom.pause.classList.toggle('on', S.paused);
      if (S.paused) { A.stopAmbient(); A.cancelSpeech(); }
      else { A.startAmbient(cfg.audio.ambient, cfg.audio.ambientFile); last = performance.now(); }
    }
    function onVisibility() { if (document.hidden && !S.paused && !S.over && !S.won) togglePause(); }
    document.addEventListener('visibilitychange', onVisibility);

    /* ---------------- voicelines ---------------- */
    function say(def, trigger) {
      if (!def.voice || !def.voice.lines) return;
      var pool = def.voice.lines.filter(function (l) { return l.trigger === trigger; });
      if (!pool.length) return;
      A.speakLine(pick(pool), def.voice.volume);
    }

    /* ---------------- AI ---------------- */
    function actorsAt(entry) {
      return actors.filter(function (a) { return a.at === entry; });
    }
    function occupantsOf(roomId) {
      return actors.filter(function (a) {
        return a.room === roomId && !a.at && !a.def.traits.invisibleOnCam;
      }).map(function (a) { return a.def; });
    }
    function isWatched(roomId) { return S.camOpen && S.cam === roomId; }

    function sendHome(a) {
      a.at = null;
      a.attackT = 0; a.retreatT = 0; a.stunT = 0;
      a.routeIdx = 0;
      a.room = a.def.pathMode === 'route' ? (a.def.route[0] || a.def.startRoom) : a.def.startRoom;
      a.moveT = a.def.moveInterval;
      paint();
    }

    function goToDoor(a, entry) {
      a.at = entry;
      a.attackT = 0; a.retreatT = 0; a.stunT = 0;
      if (a.def.traits.knock) A.sfx('knock');
      say(a.def, 'door');
      paint();
    }

    function nextRoom(a) {
      var def = a.def;
      var cur = roomById[a.room];
      if (!cur) { a.room = cfg.map.start; return; }

      if (def.pathMode === 'route') {
        a.routeIdx++;
        if (a.routeIdx >= def.route.length) {
          var last = roomById[def.route[def.route.length - 1]];
          var entry = (last && last.entry) || (def.entry !== 'any' ? def.entry : 'left');
          a.routeIdx = def.route.length - 1;
          goToDoor(a, entry);
          return;
        }
        a.room = def.route[a.routeIdx];
      } else {
        // random walk; if the room touches the office and this actor uses that
        // entry, step into the doorway instead
        if (cur.entry && (def.entry === 'any' || def.entry === cur.entry)) {
          if (Math.random() < 0.75) { goToDoor(a, cur.entry); return; }
        }
        var links = cur.links.slice();
        if (!links.length) {
          // dead end with no exit: teleport back to start so it can never stall
          a.room = def.startRoom || cfg.map.start;
        } else {
          a.room = pick(links);
        }
      }
      if (cfg.audio.footsteps) A.sfx('step');
      say(a.def, 'move');
      if (S.camOpen && (S.cam === a.room)) say(a.def, 'cam');
      paintCamButtons();
    }

    function stepActor(a, dt) {
      var def = a.def, tr = def.traits;
      var lvl = aiLevel(def);

      /* --- at a door ---
         Resolved even at AI 0: whoever is already in the doorway must still
         attack or retreat, otherwise they stand there for the rest of the night. */
      if (a.at) {
        var blocked = false;
        if (!tr.ignoresDoors && tr.stoppedByDoor) {
          if (a.at === 'vent') blocked = S.door.vent;
          else blocked = S.door[a.at];
        }
        // light stun (only meaningful on left/right)
        if (tr.stunnedByLight && (a.at === 'left' || a.at === 'right') && S.light[a.at]) {
          if (a.stunT === 0) { A.sfx('stun'); toast(def.name + ' recoils from the light'); }
          a.stunT += dt;
          a.attackT = Math.max(0, a.attackT - dt * 2);
          if (a.stunT > 1.2) { sendHome(a); }
          return;
        }
        a.stunT = 0;

        if (blocked) {
          a.retreatT += dt;
          if (tr.drainsPower > 0 && cfg.power.enabled) S.power -= tr.drainsPower * dt;
          if (a.retreatT >= def.retreatDelay) { sendHome(a); toast(def.name + ' gave up... for now'); }
          return;
        }
        a.attackT += dt;
        if (a.attackT >= def.attackDelay) kill(def);
        return;
      }

      /* --- moving between rooms --- */
      if (lvl <= 0) return;
      var watched = isWatched(a.room);
      if (tr.freezeWhenWatched && watched) return;
      var speed = 1;
      if (tr.rushWhenIgnored && !watched) speed = 1.9;
      a.moveT -= dt * speed;
      if (a.moveT > 0) return;

      a.moveT = def.moveInterval;
      if (Math.random() * 20 >= lvl) return;   // classic FNAF movement opportunity roll
      nextRoom(a);
    }

    function kill(def) {
      if (S.over || S.won) return;
      S.over = true; S.running = false;
      A.stopAmbient(); A.cancelSpeech();
      say(def, 'attack');
      if (def.jumpscareSound) A.playSample(def.jumpscareSound, 1);
      else A.sfx('scare');

      dom.office.classList.remove('on');
      dom.cams.classList.remove('on');
      dom.blackout.classList.remove('on');
      dom.scare.innerHTML = '';
      var scareSrc = def.jumpscareImage || def.camImage;
      var im = scareSrc ? R.img(scareSrc) : null;
      if (R.ready(im)) {
        var el = document.createElement('img');
        el.src = scareSrc;
        dom.scare.appendChild(el);
      } else {
        var c = document.createElement('canvas');
        c.width = 640; c.height = 640;
        dom.scare.appendChild(c);
        var cx = c.getContext('2d');
        var frames = 0;
        var iv = setInterval(function () {
          cx.fillStyle = '#0a0000'; cx.fillRect(0, 0, 640, 640);
          R.drawCreature(cx, 40, 20, 560, 600, def, { jitter: 26, dark: 1.1, glow: 1.6, eyeColor: def.eyeColor || '#fff' });
          R.drawStatic(cx, 640, 640, 0.25);
          if (++frames > 60) clearInterval(iv);
        }, 45);
        killTimers.push(iv);
      }
      dom.scare.classList.add('on');
      var to = setTimeout(function () {
        dom.scare.classList.remove('on');
        finish(false, def);
      }, 2200);
      killTimers.push(to);
    }
    var killTimers = [];

    function finish(won, killer) {
      S.running = false;
      A.shutdown();
      onEnd({ win: won, killer: killer, night: night });
    }

    /* ---------------- blackout ---------------- */
    function startBlackout() {
      S.blackout = true; S.blackoutT = 0;
      S.door.left = S.door.right = S.door.vent = false;
      S.light.left = S.light.right = false;
      S.camOpen = false;
      A.stopAmbient();
      A.sfx('powerdown');
      dom.office.classList.remove('on');
      dom.cams.classList.remove('on');
      dom.blackout.classList.add('on');
      if (cfg.power.blackoutMusic) A.playSample(cfg.power.blackoutMusic, 0.8);
      else setTimeout(function () { if (S.blackout && S.running) A.sfx('chime'); }, 1200);
    }

    function paintBlackout() {
      var eyes = dom.blackout.querySelector('.eyes');
      if (!eyes || eyes.dataset.on) return;
      if (S.blackoutT < cfg.power.blackoutDelay * 0.5) return;
      eyes.dataset.on = '1';
      var def = pick(actors).def;
      var c = eyes;
      c.width = 420; c.height = 460;
      var cx = c.getContext('2d');
      cx.clearRect(0, 0, 420, 460);
      R.drawActor(cx, 0, 0, 420, 460, def, def.doorImage || def.camImage, {
        dark: 0.16, glow: 1.2, eyeColor: def.eyeColor || '#fff', teeth: false
      });
      c.classList.add('on');
    }

    /* ---------------- painting ---------------- */
    function paint() {
      // doors
      if (dom.left) {
        dom.left.slab.classList.toggle('closed', S.door.left);
        dom.left.hall.classList.toggle('lit', S.light.left);
        if (dom.left.doorBtn) dom.left.doorBtn.classList.toggle('active', S.door.left);
        if (dom.left.lightBtn) dom.left.lightBtn.classList.toggle('lit', S.light.left);
        paintHall('left');
      }
      if (dom.right) {
        dom.right.slab.classList.toggle('closed', S.door.right);
        dom.right.hall.classList.toggle('lit', S.light.right);
        if (dom.right.doorBtn) dom.right.doorBtn.classList.toggle('active', S.door.right);
        if (dom.right.lightBtn) dom.right.lightBtn.classList.toggle('lit', S.light.right);
        paintHall('right');
      }
      if (dom.ventGrate) {
        dom.ventGrate.classList.toggle('open', !S.door.vent);
        if (dom.ventBtn) {
          dom.ventBtn.classList.toggle('active', S.door.vent);
          dom.ventBtn.textContent = S.door.vent ? 'Open Vent' : 'Close Vent';
        }
        var vAt = actorsAt('vent');
        if (dom.ventCreature) {
          var showV = vAt.length > 0 && !S.door.vent;
          dom.ventCreature.classList.toggle('on', showV);
          if (showV) drawInto(dom.ventCreature, vAt[0].def, 260, 120, { dark: 0.45 });
          else clearCreature(dom.ventCreature);
        }
      }
      paintHUD();
    }

    function paintHall(side) {
      var d = dom[side];
      var at = actorsAt(side);
      var show = S.light[side] && at.length > 0;
      d.creature.classList.toggle('on', show);
      if (show) drawInto(d.creature, at[0].def, 300, 460, { dark: 0.75, jitter: 2 });
      else clearCreature(d.creature);
    }

    /* Clearing must drop the cache key too, or the same animatronic
       coming back a second time renders into an empty box. */
    function clearCreature(container) {
      if (!container.dataset.who) return;
      delete container.dataset.who;
      container.innerHTML = '';
    }

    function drawInto(container, def, w, hh, opt) {
      if (container.dataset.who === def.id) return;
      container.dataset.who = def.id;
      container.innerHTML = '';
      var src = def.doorImage || def.camImage;
      var im = src ? R.img(src) : null;
      if (R.ready(im)) {
        var el = document.createElement('img');
        el.src = src;
        container.appendChild(el);
      } else {
        var c = document.createElement('canvas');
        c.width = w; c.height = hh;
        container.appendChild(c);
        R.drawCreature(c.getContext('2d'), 0, 0, w, hh, def, Object.assign({ eyeColor: def.eyeColor }, opt || {}));
      }
    }

    function paintHUD() {
      var pct = Math.max(0, Math.round(S.power));
      dom.powerPct.textContent = pct;
      dom.camPowerPct.textContent = pct;
      var col = pct > 30 ? '#6f6' : pct > 12 ? '#fd0' : '#f44';
      dom.powerFill.style.width = pct + '%';
      dom.powerFill.style.background = col;
      dom.camPowerFill.style.width = pct + '%';
      dom.camPowerFill.style.background = col;

      var u = 1;
      if (S.door.left) u++; if (S.door.right) u++; if (S.door.vent) u++;
      if (S.light.left) u++; if (S.light.right) u++; if (S.camOpen) u++;
      dom.usage.textContent = '|'.repeat(u);
      dom.usage.style.color = u >= 5 ? '#f44' : u >= 3 ? '#fd0' : '#6f6';

      var t = HOURS[Math.min(S.hour, 6)];
      dom.clockHour.nodeValue = t;
      dom.camClockHour.nodeValue = t;
    }

    function paintCamButtons() {
      rooms.forEach(function (r) {
        var b = dom.camButtons[r.id];
        if (!b) return;
        b.classList.toggle('active', r.id === S.cam);
        b.classList.toggle('hot', occupantsOf(r.id).length > 0);
      });
    }

    function paintCams() {
      if (!S.camOpen) return;
      var room = roomById[S.cam];
      var occ = occupantsOf(S.cam);
      var jam = occ.some(function (d) { return d.traits.jamsCameras; });
      R.drawRoom(dom.camCanvas, room, occ, {
        staticAmount: jam ? 0.55 : 0.06,
        glitch: jam
      });
      dom.camName.textContent = (room.label ? room.label + ' — ' : '') + room.name;
      paintCamButtons();
      R.drawMiniMap(dom.mini, rooms, S.cam, actors.filter(function (a) { return !a.at; }).map(function (a) { return a.room; }));
    }

    /* ---------------- loop ---------------- */
    var last = performance.now(), raf = null, camAccum = 0;
    function frame(now) {
      if (!S.running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      step(dt);
    }

    function step(dt) {
      if (!S.running || S.paused || S.over || S.won) return;

      // pan easing
      if (cfg.office.panEnabled) {
        panX += (panTarget - panX) * Math.min(1, dt * 8);
        pan.style.transform = 'translateX(' + panX + '%)';
      }

      S.t += dt;
      var newHour = Math.floor(S.t / cfg.meta.hourSeconds);
      if (newHour !== S.hour) {
        S.hour = newHour;
        if (S.hour < 6) { A.sfx('click'); toast(HOURS[S.hour]); }
      }
      if (S.hour >= 6) {
        S.won = true; S.running = false;
        A.stopAmbient(); A.sfx('chime');
        setTimeout(function () { finish(true, null); }, 900);
        return;
      }

      if (cfg.power.enabled && !S.blackout) {
        var drain = cfg.power.baseDrain;
        if (S.door.left) drain += cfg.power.doorDrain;
        if (S.door.right) drain += cfg.power.doorDrain;
        if (S.door.vent) drain += cfg.power.ventDrain;
        if (S.light.left) drain += cfg.power.lightDrain;
        if (S.light.right) drain += cfg.power.lightDrain;
        if (S.camOpen) drain += cfg.power.camDrain;
        S.power -= drain * dt;
        if (S.power <= 0) { S.power = 0; startBlackout(); }
      }

      if (S.blackout) {
        S.blackoutT += dt;
        paintBlackout();
        if (S.blackoutT > cfg.power.blackoutDelay) {
          kill(pick(actors).def);
          return;
        }
      } else {
        actors.forEach(function (a) { stepActor(a, dt); });
      }

      paintHUD();
      if (S.camOpen) {
        camAccum += dt;
        if (camAccum > 0.1) { camAccum = 0; paintCams(); }
      }
      // Hallways must react to arrivals AND departures every frame, not just on
      // input — otherwise someone who leaves stays painted in a dark doorway.
      if (dom.left) paintHall('left');
      if (dom.right) paintHall('right');
      if (dom.ventCreature) {
        var vAt = actorsAt('vent');
        var showV = vAt.length > 0 && !S.door.vent;
        if (showV !== dom.ventCreature.classList.contains('on')) paint();
      }
    }

    /* ---------------- start ---------------- */
    A.init({ master: cfg.audio.master, ambientVolume: cfg.audio.ambientVolume });
    A.startAmbient(cfg.audio.ambient, cfg.audio.ambientFile);
    // preload images so the first frame isn't blank
    [cfg.office.image, cfg.office.left.image, cfg.office.right.image, cfg.office.vent.image]
      .concat(rooms.map(function (r) { return r.image; }))
      .concat(cfg.animatronics.reduce(function (acc, a) {
        return acc.concat([a.camImage, a.doorImage, a.jumpscareImage]);
      }, []))
      .forEach(function (s) { if (s) R.img(s); });

    paint();
    paintCamButtons();
    raf = requestAnimationFrame(frame);

    /* Debug hook — also what the studio uses to smoke-test a config.
       __FNAF.step(dt) advances the simulation without waiting for frames. */
    root.__FNAF = {
      state: S, actors: actors, cfg: cfg, night: night,
      step: step, setCams: setCams, toggleDoor: toggleDoor, setLight: setLight, switchCam: switchCam
    };

    return {
      destroy: function () {
        S.running = false;
        if (raf) cancelAnimationFrame(raf);
        killTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
        clearTimeout(toastT);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('visibilitychange', onVisibility);
        A.shutdown();
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      },
      state: S
    };
  };
});
