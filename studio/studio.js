/* ============================================================
   CFNAM — studio UI (Simple + Advanced)
   ============================================================ */
(function (root) {
  var FNAF = root.FNAF, Presets = root.Presets, Bundler = root.Bundler;
  var STORE_KEY = 'cfnam-project-v1';

  /* ---------------- tiny DOM helpers ---------------- */
  function e(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k === 'style') n.setAttribute('style', props[k]);
      else if (k.indexOf('on') === 0 && typeof props[k] === 'function') n[k] = props[k];
      else if (props[k] != null && props[k] !== false) n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function $(sel) { return document.querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var toastT;
  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'on ' + (kind || '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.className = ''; }, 3200);
  }

  /* ---------------- state ---------------- */
  var cfg = null;
  var ui = { tab: 'ultra', section: 'game', openAni: 0, selRoom: null, difficulty: 'normal', mapId: 'pizzeria' };
  var ULTRA_MAX = 4;

  function newProject(mapId) {
    ui.mapId = mapId || 'pizzeria';
    ui.difficulty = 'normal';
    cfg = Presets.buildSimple({
      title: 'Five Nights at My Place',
      subtitle: 'A Security Nightmare',
      mapId: ui.mapId,
      difficulty: ui.difficulty,
      nights: 5,
      animatronics: [{ name: 'Bruno' }, { name: 'Vex' }, { name: 'Cluck' }]
    });
    ui.selRoom = cfg.map.rooms[0].id;
  }

  /* ---------------- persistence ---------------- */
  var autosaveOK = true;
  function save() {
    if (!autosaveOK) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ cfg: cfg, ui: ui }));
    } catch (err) {
      autosaveOK = false;
      // Two different failures land here: out of quota (big uploads), and storage
      // being blocked outright (some browsers do that for local files).
      var quota = /quota|exceeded/i.test(err.name + ' ' + err.message);
      toast(quota
        ? 'Autosave off: too many megabytes of pictures for browser storage. Use "Save file" to keep your work.'
        : 'Autosave off: this browser blocks storage here. Use "Save file" to keep your work.', 'bad');
    }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.cfg) return false;
      cfg = FNAF.normalize(data.cfg);
      Object.assign(ui, data.ui || {});
      return true;
    } catch (err) { return false; }
  }

  function saveToFile() {
    var blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    var a = e('a', { href: URL.createObjectURL(blob), download: Bundler.slug(cfg.meta.title) + '.fnafproj' });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    toast('Project file saved', 'good');
  }
  function loadFromFile(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        cfg = FNAF.normalize(JSON.parse(r.result));
        ui.selRoom = cfg.map.rooms[0].id;
        save(); render();
        toast('Project loaded', 'good');
      } catch (err) { toast('That file is not a valid project', 'bad'); }
    };
    r.readAsText(file);
  }

  /* ---------------- file → data URL (with image downscaling) ---------------- */
  function readAsset(file, cb) {
    if (!file) return;
    var isImage = /^image\//.test(file.type);
    var r = new FileReader();
    r.onload = function () {
      if (!isImage || file.size < 350 * 1024) return cb(r.result);
      var im = new Image();
      im.onload = function () {
        var max = 1400;
        var sc = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement('canvas');
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var hasAlpha = /png|webp|gif/i.test(file.type);
        cb(c.toDataURL(hasAlpha ? 'image/png' : 'image/jpeg', 0.86));
      };
      im.onerror = function () { cb(r.result); };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* ---------------- form controls ---------------- */
  function field(label, control, hint) {
    return e('div', { class: 'field' }, [
      label ? e('label', { text: label }) : null,
      control,
      hint ? e('div', { class: 'hint', text: hint }) : null
    ]);
  }
  function txt(obj, key, opts) {
    opts = opts || {};
    var i = e('input', { type: 'text', value: obj[key] == null ? '' : obj[key], placeholder: opts.placeholder || '' });
    i.oninput = function () { obj[key] = i.value; save(); if (opts.onChange) opts.onChange(i.value); };
    return i;
  }
  function area(obj, key, ph) {
    var i = e('textarea', { placeholder: ph || '' });
    i.value = obj[key] || '';
    i.oninput = function () { obj[key] = i.value; save(); };
    return i;
  }
  function num(obj, key, opts) {
    opts = opts || {};
    var i = e('input', {
      type: 'number', value: obj[key], min: opts.min, max: opts.max, step: opts.step == null ? 1 : opts.step
    });
    i.oninput = function () {
      var v = parseFloat(i.value);
      if (isNaN(v)) return;
      if (opts.min != null) v = Math.max(opts.min, v);
      if (opts.max != null) v = Math.min(opts.max, v);
      obj[key] = v; save();
      if (opts.onChange) opts.onChange(v);
    };
    return i;
  }
  function sel(obj, key, options, opts) {
    opts = opts || {};
    var s = e('select', {}, options.map(function (o) {
      return e('option', { value: o.v, selected: String(obj[key]) === String(o.v) ? 'selected' : false, text: o.t });
    }));
    s.value = obj[key];
    s.onchange = function () { obj[key] = s.value; save(); if (opts.onChange) opts.onChange(s.value); };
    return s;
  }
  function chk(obj, key, label, desc, onChange) {
    var i = e('input', { type: 'checkbox' });
    i.checked = !!obj[key];
    i.onchange = function () { obj[key] = i.checked; save(); if (onChange) onChange(i.checked); };
    return e('label', { class: 'check' }, [i, e('span', {}, [label, desc ? e('em', { text: desc }) : null])]);
  }
  function colorIn(obj, key) {
    var i = e('input', { type: 'color', value: obj[key] || '#ffffff' });
    i.oninput = function () { obj[key] = i.value; save(); };
    return i;
  }
  function range(obj, key, min, max, step, fmt) {
    var out = e('span', { class: 'pill', text: fmt ? fmt(obj[key]) : obj[key] });
    var i = e('input', { type: 'range', min: min, max: max, step: step, value: obj[key] });
    i.oninput = function () {
      obj[key] = parseFloat(i.value);
      out.textContent = fmt ? fmt(obj[key]) : obj[key];
      save();
    };
    return e('div', {}, [e('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, [out]), i]);
  }

  /* a drag & drop asset slot */
  function drop(obj, key, opts) {
    opts = opts || {};
    var box = e('div', { class: 'drop' + (obj[key] ? ' filled' : '') });
    var input = e('input', { type: 'file', accept: opts.accept || 'image/*' });

    function refresh() {
      box.innerHTML = '';
      box.className = 'drop' + (obj[key] ? ' filled' : '');
      if (obj[key]) {
        if (/^audio|\.(mp3|wav|ogg|m4a)$/i.test(opts.accept || '') || opts.audio) {
          box.appendChild(e('div', { style: 'z-index:2;color:#8fe0a8', text: '🔊 sound attached' }));
          var play = e('button', { class: 'btn tiny', style: 'z-index:3;margin-left:8px', text: '▶' });
          play.onclick = function (ev) { ev.preventDefault(); ev.stopPropagation(); FNAF.Audio.playSample(obj[key], 1); };
          box.appendChild(play);
        } else {
          box.appendChild(e('img', { src: obj[key] }));
        }
        var x = e('button', { class: 'clear', text: '✕' });
        x.onclick = function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          obj[key] = null; save(); refresh(); if (opts.onChange) opts.onChange();
        };
        box.appendChild(x);
      } else {
        box.appendChild(e('div', { style: 'z-index:2', text: opts.label || 'Click or drop a file' }));
      }
      box.appendChild(input);
    }
    input.onchange = function () {
      if (!input.files[0]) return;
      readAsset(input.files[0], function (d) { obj[key] = d; save(); refresh(); if (opts.onChange) opts.onChange(); });
    };
    box.addEventListener('dragover', function (ev) { ev.preventDefault(); box.style.borderColor = '#4aa3ff'; });
    box.addEventListener('dragleave', function () { box.style.borderColor = ''; });
    box.addEventListener('drop', function (ev) {
      ev.preventDefault(); box.style.borderColor = '';
      var f = ev.dataTransfer.files[0];
      if (f) readAsset(f, function (d) { obj[key] = d; save(); refresh(); if (opts.onChange) opts.onChange(); });
    });
    refresh();
    return box;
  }

  /* ---------------- structural operations ---------------- */
  function entriesOf(map) { return Presets.entriesAvailable(map); }

  function applyMap(mapId) {
    var map = Presets.cloneMap(mapId);
    ui.mapId = mapId;
    cfg.map = map;
    var entries = entriesOf(map);
    cfg.office.left.enabled = entries.indexOf('left') >= 0;
    cfg.office.right.enabled = entries.indexOf('right') >= 0;
    cfg.office.vent.enabled = entries.indexOf('vent') >= 0;
    cfg.animatronics.forEach(function (a, i) {
      if (a.entry !== 'any' && entries.indexOf(a.entry) < 0) a.entry = entries[i % entries.length] || 'any';
      a.startRoom = map.start;
      if (a.pathMode === 'route') {
        a.route = Presets.routeToEntry(map, a.entry === 'any' ? entries[0] : a.entry, map.start);
        a.startRoom = a.route[0];
      }
    });
    ui.selRoom = map.rooms[0].id;
    cfg = FNAF.normalize(cfg);
    save();
  }

  function applyDifficulty(key) {
    ui.difficulty = key;
    cfg.animatronics.forEach(function (a, i) { a.ai = Presets.aiCurve(key, i); });
    save();
  }

  function setCount(n) {
    n = clamp(n, 1, 6);
    var cur = cfg.animatronics.length;
    if (n === cur) return;
    if (n < cur) { cfg.animatronics = cfg.animatronics.slice(0, n); }
    else {
      var entries = entriesOf(cfg.map);
      var ORDER = ['wanderer', 'rightStalker', 'crawler', 'runner', 'shy', 'jammer'];
      for (var i = cur; i < n; i++) {
        var a = FNAF.defaultAnimatronic(i);
        a.id = 'a' + (i + 1);
        var tpl = Presets.templateByKey(ORDER[i % ORDER.length]);
        tpl.apply(a); a.template = tpl.key;
        if (a.entry !== 'any' && entries.indexOf(a.entry) < 0) a.entry = entries[i % entries.length] || 'any';
        a.startRoom = cfg.map.start;
        if (a.pathMode === 'route') {
          a.route = Presets.routeToEntry(cfg.map, a.entry === 'any' ? entries[0] : a.entry, cfg.map.start);
          a.startRoom = a.route[0];
        }
        a.ai = Presets.aiCurve(ui.difficulty, i);
        cfg.animatronics.push(a);
      }
    }
    cfg = FNAF.normalize(cfg);
    save();
  }

  /* ---------------- validation ---------------- */
  function validate() {
    var out = [];
    var map = cfg.map, ids = map.rooms.map(function (r) { return r.id; });
    var entries = entriesOf(map);

    if (!cfg.meta.title.trim()) out.push({ l: 'bad', t: 'Your game has no title.' });
    if (!entries.length) out.push({ l: 'bad', t: 'No room is marked as an entrance (left / right / vent), so nothing can ever reach your office. Set at least one room’s "Leads to" field in the Map tab.' });

    ['left', 'right', 'vent'].forEach(function (side) {
      var used = cfg.animatronics.filter(function (a) { return a.entry === side; });
      var conf = cfg.office[side];
      if (used.length && (!conf || !conf.enabled)) {
        out.push({ l: 'bad', t: used.map(function (a) { return a.name; }).join(', ') + ' use the ' + side + ' entrance, but it is switched off in the Office tab.' });
      }
      if (used.length && entries.indexOf(side) < 0) {
        out.push({ l: 'bad', t: used.map(function (a) { return a.name; }).join(', ') + ' use the ' + side + ' entrance, but no room leads there.' });
      }
    });

    // reachability from the start room
    var seen = {}, q = [map.start], byId = {};
    map.rooms.forEach(function (r) { byId[r.id] = r; });
    seen[map.start] = 1;
    while (q.length) {
      var cur = byId[q.shift()];
      if (!cur) continue;
      cur.links.forEach(function (l) { if (!seen[l]) { seen[l] = 1; q.push(l); } });
    }
    var orphans = ids.filter(function (id) { return !seen[id]; });
    if (orphans.length) {
      out.push({ l: 'warn', t: orphans.length + ' room(s) can never be walked into from the start room: ' +
        orphans.map(function (i) { return byId[i].name; }).join(', ') + '. They still work as cameras.' });
    }
    map.rooms.forEach(function (r) {
      if (!r.links.length && !r.entry) out.push({ l: 'warn', t: '"' + r.name + '" is a dead end with no exits — anyone who walks in teleports back to their start room.' });
    });

    cfg.animatronics.forEach(function (a) {
      if (a.pathMode === 'route') {
        if (!a.route.length) out.push({ l: 'bad', t: a.name + ' is set to a fixed route but the route is empty.' });
        else {
          var last = byId[a.route[a.route.length - 1]];
          if (last && !last.entry) out.push({ l: 'warn', t: a.name + '’s route ends at "' + last.name + '", which does not lead to your office. They will still attack via the ' + a.entry + ' entrance.' });
        }
      }
      var playable = a.ai.slice(0, Math.max(1, cfg.meta.nights));
      if (playable.every(function (v) { return v <= 0; })) out.push({ l: 'warn', t: a.name + ' has AI level 0 on every playable night — they will never move.' });
      if (a.traits.ignoresDoors && !a.traits.stunnedByLight) out.push({ l: 'warn', t: a.name + ' ignores doors and is not repelled by light, so there is no way to survive them.' });
      if (a.entry === 'vent' && !cfg.office.vent.door && cfg.office.vent.enabled) out.push({ l: 'warn', t: a.name + ' comes through the vent, but the vent has no door to close.' });
    });

    if (cfg.power.enabled) {
      var idle = cfg.power.baseDrain * cfg.meta.hourSeconds * 6;
      if (idle >= cfg.power.start) out.push({ l: 'bad', t: 'Idle power drain alone (' + idle.toFixed(0) + '%) is more than your starting power. Nobody can reach 6 AM. Lower "Idle drain" or the hour length.' });
      else if (idle > cfg.power.start * 0.8) out.push({ l: 'warn', t: 'Idle drain uses ' + Math.round(idle / cfg.power.start * 100) + '% of your power before you touch a single button. Very tight.' });
    }
    if (cfg.meta.nights > 7) out.push({ l: 'warn', t: 'You have ' + cfg.meta.nights + ' nights but AI levels only go up to night 7 — later nights reuse the night 7 values.' });

    if (!out.length) out.push({ l: 'ok', t: 'No problems found. This game is playable and beatable.' });
    return out;
  }

  /* ============================================================
     SIMPLE TAB
     ============================================================ */
  /* ============================================================
     ULTRA SIMPLE TAB  — the default. A picture and a name, nothing else.
     Everything not shown here (map, difficulty, nights, AI, routes,
     traits, power) stays on whatever the project already has, which for
     a new project is the built-in defaults.
     ============================================================ */
  function panelUltra() {
    var wrap = e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Make a game' }),
      e('p', { class: 'sec', text: 'Drop in a picture, type a name. That is the whole thing — everything else is already set up for you.' })
    ]);

    wrap.appendChild(e('div', { class: 'card' }, [
      field('What is your game called?',
        txt(cfg.meta, 'title', { onChange: function () { $('#proj-name').value = cfg.meta.title; } }))
    ]));

    var grid = e('div', { class: 'ultra-grid' });

    function paintSlots() {
      grid.innerHTML = '';

      cfg.animatronics.slice(0, ULTRA_MAX).forEach(function (a, i) {
        var slot = e('div', { class: 'card ultra-slot', style: 'border-top:3px solid ' + a.color });

        slot.appendChild(drop(a, 'camImage', {
          label: 'Click or drop a picture',
          onChange: function () {
            // one picture is enough: use it on cameras, at the door and for the scare
            a.doorImage = a.camImage;
            a.jumpscareImage = a.camImage;
            save();
          }
        }));

        slot.appendChild(e('div', { style: 'margin-top:10px' }, [
          txt(a, 'name', { placeholder: 'Give it a name' })
        ]));

        var foot = e('div', { class: 'ultra-foot' }, [
          e('span', { class: 'pill', text: a.entry === 'any' ? 'any door' : a.entry + ' door' })
        ]);
        if (cfg.animatronics.length > 1) {
          var rm = e('button', { class: 'btn tiny danger', text: 'Remove' });
          rm.onclick = function () {
            cfg.animatronics.splice(i, 1);
            cfg = FNAF.normalize(cfg);
            save(); paintSlots();
          };
          foot.appendChild(rm);
        }
        slot.appendChild(foot);
        grid.appendChild(slot);
      });

      if (cfg.animatronics.length < ULTRA_MAX) {
        var addCard = e('button', { class: 'card ultra-slot ultra-add' }, [
          e('div', { class: 'plus', text: '+' }),
          e('div', { text: 'Add another' }),
          e('div', { class: 'sub', text: (ULTRA_MAX - cfg.animatronics.length) + ' left' })
        ]);
        addCard.onclick = function () {
          setCount(cfg.animatronics.length + 1);
          paintSlots();
        };
        grid.appendChild(addCard);
      }
    }
    paintSlots();

    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: 'Who is coming for you?' }),
      e('div', { class: 'desc', text: 'Up to four. No picture? It gets drawn for you. Each one automatically gets its own behaviour and its own way in.' }),
      grid
    ]));

    var playBtn = e('button', { class: 'btn go ultra-go', text: '▶  Play it' });
    playBtn.onclick = play;
    var oneBtn = e('button', { class: 'btn primary ultra-go', text: '⬇  Save as a game file' });
    oneBtn.onclick = doExportSingle;

    wrap.appendChild(e('div', { class: 'card' }, [
      e('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' }, [playBtn, oneBtn]),
      e('div', { class: 'desc', style: 'text-align:center;margin:12px 0 0',
        text: 'Saving gives you one .html file. Double-click it to play, or send it to a friend — it works on its own.' })
    ]));

    // only mention problems if there actually are any
    var bad = validate().filter(function (i) { return i.l === 'bad'; });
    if (bad.length) {
      var list = e('div', {});
      bad.forEach(function (i) { list.appendChild(e('div', { class: 'issue bad' }, [e('span', { text: i.t })])); });
      wrap.appendChild(e('div', { class: 'card' }, [
        e('h3', { text: 'Needs fixing first' }),
        list,
        e('div', { class: 'desc', style: 'margin-top:8px', text: 'These come from settings in the other tabs.' })
      ]));
    }

    wrap.appendChild(e('div', { class: 'desc', style: 'text-align:center;margin-top:18px',
      text: 'Want maps, difficulty and nights? Try the Simple tab. Want to control everything? Advanced.' }));
    return wrap;
  }

  function panelSimple() {
    var wrap = e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Simple mode' }),
      e('p', { class: 'sec', text: 'Name it, pick a place, drop in some pictures. Everything else is set up for you. Switch to Advanced any time — nothing here is thrown away.' })
    ]);

    /* 1. basics */
    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: '1 · Your game' }),
      e('div', { class: 'row' }, [
        field('Title', txt(cfg.meta, 'title', { onChange: function () { $('#proj-name').value = cfg.meta.title; } })),
        field('Tagline', txt(cfg.meta, 'subtitle'))
      ]),
      e('div', { class: 'row' }, [
        field('How many nights?', num(cfg.meta, 'nights', { min: 1, max: 20 })),
        field('Difficulty', sel(ui, 'difficulty', Object.keys(Presets.difficulties).map(function (k) {
          return { v: k, t: Presets.difficulties[k].label };
        }), { onChange: function (v) { applyDifficulty(v); toast('Difficulty set to ' + Presets.difficulties[v].label); } })),
        field('Minutes per in-game hour', num(cfg.meta, 'hourSeconds', { min: 10, max: 300 }), 'Seconds, really. 55 = a ~5½ minute night.')
      ])
    ]));

    /* 2. map */
    var grid = e('div', { class: 'mapgrid' });
    Presets.mapList().forEach(function (m) {
      var card = e('button', { class: 'mapcard' + (cfg.map.id === m.id ? ' on' : '') }, [
        e('b', { text: m.name }),
        e('em', { text: m.desc }),
        e('div', { style: 'margin-top:6px;font-size:11px;color:#5d6473', text: m.rooms.length + ' rooms · ' + entriesOf(m).join(' + ') + ' entrances' })
      ]);
      card.onclick = function () {
        applyMap(m.id);
        toast('Map switched to ' + m.name + '. Routes were rebuilt.');
        render();
      };
      grid.appendChild(card);
    });
    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: '2 · Where does it happen?' }),
      e('div', { class: 'desc', text: 'Pick a place. You can redesign it room-by-room in Advanced → Map.' }),
      grid
    ]));

    /* 3. office picture */
    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: '3 · Your office (optional)' }),
      e('div', { class: 'desc', text: 'A picture of the room you sit in. Leave empty for the built-in dark office.' }),
      e('div', { class: 'row' }, [
        field('Office background', drop(cfg.office, 'image', { label: 'Drop office picture' })),
        field('Left hallway', drop(cfg.office.left, 'image', { label: 'Drop left hallway' })),
        field('Right hallway', drop(cfg.office.right, 'image', { label: 'Drop right hallway' }))
      ])
    ]));

    /* 4. animatronics */
    var count = { n: cfg.animatronics.length };
    var aniWrap = e('div', { class: 'row' });
    function paintAnis() {
      aniWrap.innerHTML = '';
      cfg.animatronics.forEach(function (a, i) {
        var card = e('div', {
          class: 'card', style: 'flex:1 1 210px;margin:0;border-left:4px solid ' + a.color
        }, [
          field('Name', txt(a, 'name', { onChange: function () { paintTitle(card, a); } })),
          field('Picture', drop(a, 'camImage', {
            label: 'Drop a picture', onChange: function () {
              a.doorImage = a.camImage; a.jumpscareImage = a.camImage; save();
            }
          }), 'Used on cameras, at your door and for the jumpscare.'),
          e('div', { class: 'hint', style: 'color:#5d6473;font-size:11px',
            text: Presets.templateByKey(a.template || 'wanderer').label + ' · ' +
                  (a.entry === 'any' ? 'any entrance' : a.entry + ' entrance') })
        ]);
        aniWrap.appendChild(card);
      });
    }
    function paintTitle() {}
    paintAnis();

    var countRow = field('How many animatronics? (1–6)', num(count, 'n', {
      min: 1, max: 6, onChange: function (v) { setCount(v); paintAnis(); }
    }));

    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: '4 · The animatronics' }),
      e('div', { class: 'desc', text: 'Each one gets a different behaviour and route automatically. No picture? They get drawn for you.' }),
      countRow,
      aniWrap
    ]));

    /* 5. go */
    var playBtn = e('button', { class: 'btn go', style: 'padding:12px 28px;font-size:15px', text: '▶  Play it' });
    playBtn.onclick = play;
    var oneBtn = e('button', { class: 'btn primary', style: 'padding:12px 28px;font-size:15px', text: '⬇  Export one .html file' });
    oneBtn.onclick = doExportSingle;
    var expBtn = e('button', { class: 'btn', style: 'padding:12px 28px;font-size:15px', text: '⬇  Export game folder' });
    expBtn.onclick = doExport;
    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: '5 · Done' }),
      e('div', { class: 'desc', text: 'Play it here, or export it. One .html file is the easy option — double-click it, email it, drop it on itch.io. The folder version is the same game split into readable index.html / css / js.' }),
      e('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [playBtn, oneBtn, expBtn])
    ]));

    wrap.appendChild(issuesCard());
    return wrap;
  }

  function issuesCard() {
    var list = e('div', {});
    validate().forEach(function (i) {
      list.appendChild(e('div', { class: 'issue ' + i.l }, [
        e('span', { text: i.l === 'ok' ? '✓' : i.l === 'warn' ? '!' : '✕' }),
        e('span', { text: i.t })
      ]));
    });
    return e('div', { class: 'card' }, [
      e('h3', { text: 'Health check' }),
      e('div', { class: 'desc', text: 'Automatic checks for the mistakes that make a night unplayable.' }),
      list
    ]);
  }

  /* ============================================================
     ADVANCED TAB
     ============================================================ */
  var SECTIONS = [
    { k: 'game', t: 'Game', d: 'Title, nights, theme' },
    { k: 'office', t: 'Office', d: 'Doors, vent, pictures' },
    { k: 'map', t: 'Map', d: 'Rooms, cameras, links' },
    { k: 'anis', t: 'Animatronics', d: 'AI, paths, voices' },
    { k: 'power', t: 'Power', d: 'Drain and blackout' },
    { k: 'audio', t: 'Audio', d: 'Ambience and volume' },
    { k: 'export', t: 'Export', d: 'Download the folder' }
  ];

  function panelAdvanced() {
    switch (ui.section) {
      case 'office': return secOffice();
      case 'map': return secMap();
      case 'anis': return secAnis();
      case 'power': return secPower();
      case 'audio': return secAudio();
      case 'export': return secExport();
      default: return secGame();
    }
  }

  function secGame() {
    return e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Game' }),
      e('p', { class: 'sec', text: 'The wrapper around the nights: what it is called, how long it runs, what colour it is.' }),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Identity' }),
        e('div', { class: 'row' }, [
          field('Title', txt(cfg.meta, 'title', { onChange: function () { $('#proj-name').value = cfg.meta.title; } })),
          field('Tagline', txt(cfg.meta, 'subtitle'))
        ]),
        field('Intro text on the menu', area(cfg.text, 'intro', 'e.g. "Welcome to your first night on the job..."'))
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Night structure' }),
        e('div', { class: 'row' }, [
          field('Number of nights', num(cfg.meta, 'nights', { min: 1, max: 20 })),
          field('Seconds per in-game hour', num(cfg.meta, 'hourSeconds', { min: 10, max: 300 }),
            'A night is 6 hours. 55s → 5m30s per night.')
        ]),
        chk(cfg.meta, 'customNight', 'Unlock an endless night after the last one',
          'Uses the night-7 AI levels forever.')
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Theme' }),
        e('div', { class: 'row' }, [
          field('Accent colour', colorIn(cfg.theme, 'accent')),
          field('Title colour', colorIn(cfg.theme, 'titleColor')),
          field('Background', colorIn(cfg.theme, 'bg'))
        ])
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'End screens' }),
        e('div', { class: 'row' }, [
          field('Win headline', txt(cfg.text, 'win')),
          field('Win subtitle', txt(cfg.text, 'winSub'))
        ]),
        e('div', { class: 'row' }, [
          field('Lose headline', txt(cfg.text, 'lose')),
          field('Lose subtitle', txt(cfg.text, 'loseSub'))
        ])
      ]),
      issuesCard()
    ]);
  }

  function secOffice() {
    function sideCard(side, title) {
      var conf = cfg.office[side];
      return e('div', { class: 'card' }, [
        e('h3', { text: title }),
        chk(conf, 'enabled', 'This entrance exists', null, render),
        chk(conf, 'door', side === 'vent' ? 'Vent can be sealed' : 'Has a closing door'),
        side !== 'vent' ? chk(conf, 'light', 'Has a hallway light') : null,
        field(side === 'vent' ? 'Vent picture' : 'Hallway picture', drop(conf, 'image', { label: 'Drop a picture' }),
          'Shown when the light is on. Optional.')
      ]);
    }
    return e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Office' }),
      e('p', { class: 'sec', text: 'The room you never leave. Turn entrances on or off and give each one a picture.' }),
      e('div', { class: 'card' }, [
        e('h3', { text: 'The room' }),
        field('Office background picture', drop(cfg.office, 'image', { label: 'Drop office picture' }),
          'A wide picture works best — it pans as you move the mouse.'),
        chk(cfg.office, 'panEnabled', 'Look around with the mouse', 'Pans the office left and right.'),
        chk(cfg.office, 'fan', 'Show the desk fan')
      ]),
      e('div', { class: 'row' }, [
        sideCard('left', 'Left entrance'),
        sideCard('right', 'Right entrance'),
        sideCard('vent', 'Vent')
      ])
    ]);
  }

  /* ---------------- MAP EDITOR ---------------- */
  function secMap() {
    var map = cfg.map;
    var wrap = e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Map' }),
      e('p', { class: 'sec', text: 'Rooms are camera feeds and the places animatronics walk through. Links decide where they can go next; "Leads to" marks the rooms right outside your office.' })
    ]);

    /* presets */
    var presetSel = e('select', {}, Presets.mapList().map(function (m) {
      return e('option', { value: m.id, text: m.name });
    }));
    presetSel.value = Presets.maps[map.id] ? map.id : '';
    var loadBtn = e('button', { class: 'btn', text: 'Load preset' });
    loadBtn.onclick = function () {
      if (!confirm('Replace the current map with "' + Presets.maps[presetSel.value].name + '"? Room pictures and routes will be rebuilt.')) return;
      applyMap(presetSel.value); render();
    };
    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: 'Start from a preset' }),
      e('div', { style: 'display:flex;gap:10px;align-items:center' }, [presetSel, loadBtn]),
      e('div', { class: 'desc', style: 'margin-top:10px', text: 'Or just edit the rooms below — this is your map now.' })
    ]));

    /* canvas */
    var canvas = e('canvas', { id: 'map-canvas' });
    var canvasCard = e('div', { class: 'card' }, [
      e('h3', { text: 'Layout' }),
      e('div', { class: 'desc', text: 'Drag rooms to arrange them. This is the minimap players see, and it shows how rooms connect.' }),
      e('div', { id: 'map-canvas-wrap' }, [canvas])
    ]);
    wrap.appendChild(canvasCard);

    /* room list */
    var list = e('div', { class: 'room-list' });
    function roomRow(r, idx) {
      var row = e('div', { class: 'room-row' + (ui.selRoom === r.id ? ' sel' : '') });
      var head = e('div', { class: 'room-head' }, [
        e('span', { class: 'pill', text: '#' + (idx + 1) }),
        txt(r, 'name', { onChange: function () { drawMap(); } }),
        (function () {
          var s = e('input', { type: 'text', value: r.label, style: 'max-width:90px' });
          s.oninput = function () { r.label = s.value; save(); };
          return s;
        })()
      ]);
      var del = e('button', { class: 'btn tiny danger', text: 'Delete' });
      del.onclick = function () {
        if (cfg.map.rooms.length <= 2) return toast('A map needs at least two rooms', 'bad');
        cfg.map.rooms.splice(idx, 1);
        cfg.map.rooms.forEach(function (o) { o.links = o.links.filter(function (l) { return l !== r.id; }); });
        cfg.animatronics.forEach(function (a) {
          a.route = a.route.filter(function (l) { return l !== r.id; });
          if (a.startRoom === r.id) a.startRoom = null;
        });
        cfg = FNAF.normalize(cfg); save(); render();
      };
      head.appendChild(del);
      row.appendChild(head);

      row.appendChild(e('div', { class: 'row', style: 'margin-top:8px' }, [
        field('Look', sel(r, 'style', FNAF.Render.styleNames.map(function (s) { return { v: s, t: s }; }), { onChange: drawMap })),
        field('Leads to (entrance)', sel({ get v() { return r.entry || ''; }, set v(x) { r.entry = x || null; } }, 'v', [
          { v: '', t: '— nowhere (inner room) —' }, { v: 'left', t: 'Left door' }, { v: 'right', t: 'Right door' }, { v: 'vent', t: 'Vent' }
        ], { onChange: function () { save(); drawMap(); } })),
        field('Camera picture', drop(r, 'image', { label: 'Drop room picture' }))
      ]));

      var chips = e('div', { class: 'chiprow' });
      chips.appendChild(e('span', { class: 'pill', text: 'connects to:' }));
      cfg.map.rooms.forEach(function (o) {
        if (o.id === r.id) return;
        var on = r.links.indexOf(o.id) >= 0;
        var c = e('button', { class: 'chip' + (on ? ' on' : ''), text: o.name });
        c.onclick = function () {
          var i = r.links.indexOf(o.id);
          if (i >= 0) r.links.splice(i, 1); else r.links.push(o.id);
          c.className = 'chip' + (r.links.indexOf(o.id) >= 0 ? ' on' : '');
          save(); drawMap();
        };
        chips.appendChild(c);
      });
      row.appendChild(chips);
      row.onclick = function () { ui.selRoom = r.id; drawMap(); document.querySelectorAll('.room-row').forEach(function (x) { x.classList.remove('sel'); }); row.classList.add('sel'); };
      return row;
    }
    map.rooms.forEach(function (r, i) { list.appendChild(roomRow(r, i)); });

    var addBtn = e('button', { class: 'btn', text: '+ Add room' });
    addBtn.onclick = function () {
      var n = cfg.map.rooms.length + 1;
      var id = 'room' + Date.now().toString(36).slice(-4);
      cfg.map.rooms.push({
        id: id, name: 'New Room ' + n, label: 'CAM ' + n, style: 'generic', image: null,
        x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.5, links: [], entry: null
      });
      save(); render();
    };

    wrap.appendChild(e('div', { class: 'card' }, [
      e('h3', { text: 'Rooms (' + map.rooms.length + ')' }),
      e('div', { class: 'row', style: 'margin-bottom:12px' }, [
        field('Start room (where everyone begins)', sel(cfg.map, 'start', map.rooms.map(function (r) {
          return { v: r.id, t: r.name };
        }), { onChange: drawMap }))
      ]),
      list,
      e('div', { style: 'margin-top:12px' }, [addBtn])
    ]));

    wrap.appendChild(issuesCard());

    /* canvas drawing + dragging */
    function drawMap() {
      var cw = canvas.clientWidth || 700;
      var ch = Math.round(cw * 0.5);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr; canvas.height = ch * dpr;
      canvas.style.height = ch + 'px';
      var g = canvas.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#07080b'; g.fillRect(0, 0, cw, ch);

      var pad = 34;
      function X(r) { return pad + r.x * (cw - pad * 2); }
      function Y(r) { return pad + r.y * (ch - pad * 2); }
      var byId = {}; cfg.map.rooms.forEach(function (r) { byId[r.id] = r; });

      g.strokeStyle = '#2a3040'; g.lineWidth = 1.5;
      cfg.map.rooms.forEach(function (r) {
        r.links.forEach(function (l) {
          var t = byId[l]; if (!t) return;
          g.beginPath(); g.moveTo(X(r), Y(r)); g.lineTo(X(t), Y(t)); g.stroke();
        });
      });

      // office
      g.fillStyle = '#1a1d25'; g.strokeStyle = '#3a4152';
      g.fillRect(cw / 2 - 44, ch - 26, 88, 20); g.strokeRect(cw / 2 - 44, ch - 26, 88, 20);
      g.fillStyle = '#9aa3b5'; g.font = '11px system-ui'; g.textAlign = 'center';
      g.fillText('YOUR OFFICE', cw / 2, ch - 12);

      cfg.map.rooms.forEach(function (r) {
        var x = X(r), y = Y(r);
        if (r.entry) {
          g.strokeStyle = r.entry === 'left' ? '#c8931f' : r.entry === 'right' ? '#2b9ec2' : '#a05bd0';
          g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x, y); g.lineTo(cw / 2, ch - 26); g.stroke(); g.setLineDash([]);
        }
        var isSel = ui.selRoom === r.id;
        var isStart = cfg.map.start === r.id;
        g.beginPath(); g.arc(x, y, isSel ? 11 : 9, 0, 7);
        g.fillStyle = isSel ? '#4aa3ff' : isStart ? '#47c26a' : '#39404f';
        g.fill();
        g.strokeStyle = '#0b0c10'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#cfd5e0'; g.font = '11px system-ui'; g.textAlign = 'center';
        g.fillText(r.name, x, y - 16);
        if (r.entry) {
          g.fillStyle = '#8b93a3'; g.font = '9px system-ui';
          g.fillText('→ ' + r.entry, x, y + 24);
        }
      });
    }

    var dragging = null;
    function toNorm(ev) {
      var b = canvas.getBoundingClientRect();
      var pad = 34;
      return {
        x: clamp(((ev.clientX - b.left) - pad) / (b.width - pad * 2), 0, 1),
        y: clamp(((ev.clientY - b.top) - pad) / (b.height - pad * 2), 0, 1)
      };
    }
    canvas.addEventListener('pointerdown', function (ev) {
      var b = canvas.getBoundingClientRect(), pad = 34;
      var mx = ev.clientX - b.left, my = ev.clientY - b.top;
      var best = null, bd = 1e9;
      cfg.map.rooms.forEach(function (r) {
        var x = pad + r.x * (b.width - pad * 2), y = pad + r.y * (b.height - pad * 2);
        var d = Math.hypot(mx - x, my - y);
        if (d < bd) { bd = d; best = r; }
      });
      if (best && bd < 22) {
        dragging = best; ui.selRoom = best.id;
        canvas.setPointerCapture(ev.pointerId);
        drawMap();
        document.querySelectorAll('.room-row').forEach(function (x, i) {
          x.classList.toggle('sel', cfg.map.rooms[i] && cfg.map.rooms[i].id === best.id);
        });
      }
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var p = toNorm(ev);
      dragging.x = p.x; dragging.y = p.y;
      drawMap();
    });
    canvas.addEventListener('pointerup', function () { if (dragging) { dragging = null; save(); } });

    setTimeout(drawMap, 0);
    window.addEventListener('resize', drawMap);
    return wrap;
  }

  /* ---------------- ANIMATRONICS ---------------- */
  function secAnis() {
    var wrap = e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Animatronics (' + cfg.animatronics.length + '/6)' }),
      e('p', { class: 'sec', text: 'Up to six. Each one has its own look, route, behaviour rules and voice.' })
    ]);

    cfg.animatronics.forEach(function (a, idx) { wrap.appendChild(aniCard(a, idx)); });

    if (cfg.animatronics.length < 6) {
      var add = e('button', { class: 'btn', text: '+ Add animatronic' });
      add.onclick = function () { setCount(cfg.animatronics.length + 1); ui.openAni = cfg.animatronics.length - 1; render(); };
      wrap.appendChild(add);
    }
    wrap.appendChild(issuesCard());
    return wrap;
  }

  function aniCard(a, idx) {
    var open = ui.openAni === idx;
    var head = e('div', { class: 'ani-head' }, [
      e('div', { class: 'swatch', style: 'background:' + a.color }),
      e('div', { class: 'grow' }, [
        e('div', { class: 'nm', text: a.name }),
        e('div', { class: 'tag', text: Presets.templateByKey(a.template || 'wanderer').label + ' · ' +
          (a.pathMode === 'route' ? 'fixed route' : 'roams') + ' · ' +
          (a.entry === 'any' ? 'any entrance' : a.entry + ' entrance') + ' · ' +
          (a.voice.lines.length ? a.voice.lines.length + ' voicelines' : 'no voice') })
      ]),
      e('span', { class: 'pill', text: 'AI ' + a.ai.slice(0, 5).join('/') }),
      e('span', { class: 'btn tiny', text: open ? 'Close' : 'Edit' })
    ]);
    head.onclick = function (ev) {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
      ui.openAni = open ? -1 : idx; save(); render();
    };

    var card = e('div', { class: 'card ani-card', style: 'border-left-color:' + a.color }, [head]);
    if (!open) return card;

    var body = e('div', { class: 'ani-body' });

    /* identity */
    body.appendChild(e('div', { class: 'subhead', text: 'Identity' }));
    body.appendChild(e('div', { class: 'row' }, [
      field('Name', txt(a, 'name', { onChange: render_soft })),
      field('Body colour', colorIn(a, 'color')),
      field('Eye glow', colorIn(a, 'eyeColor')),
      field('Body shape (used when there is no picture)', sel(a, 'shape',
        ['bear', 'bunny', 'chicken', 'fox', 'bot', 'ghost'].map(function (s) { return { v: s, t: s }; })))
    ]));
    body.appendChild(e('div', { class: 'row' }, [
      field('Camera picture', drop(a, 'camImage', { label: 'On cameras' })),
      field('At-the-door picture', drop(a, 'doorImage', { label: 'In your doorway' })),
      field('Jumpscare picture', drop(a, 'jumpscareImage', { label: 'The scare' })),
      field('Jumpscare sound', drop(a, 'jumpscareSound', { label: 'Drop an audio file', accept: 'audio/*', audio: true }))
    ]));

    /* behaviour preset */
    body.appendChild(e('div', { class: 'subhead', text: 'Behaviour preset' }));
    var tplSel = e('select', {}, Presets.templates.map(function (t) {
      return e('option', { value: t.key, text: t.label + ' — ' + t.desc });
    }));
    tplSel.value = a.template || 'wanderer';
    var applyTpl = e('button', { class: 'btn', text: 'Apply preset' });
    applyTpl.onclick = function () {
      var t = Presets.templateByKey(tplSel.value);
      t.apply(a); a.template = t.key;
      var entries = entriesOf(cfg.map);
      if (a.entry !== 'any' && entries.indexOf(a.entry) < 0) a.entry = entries[0] || 'any';
      if (a.pathMode === 'route') {
        a.route = Presets.routeToEntry(cfg.map, a.entry === 'any' ? entries[0] : a.entry, cfg.map.start);
        a.startRoom = a.route[0];
      }
      save(); render();
      toast('Applied "' + t.label + '" to ' + a.name);
    };
    body.appendChild(e('div', { style: 'display:flex;gap:10px;align-items:center;margin-bottom:6px' }, [tplSel, applyTpl]));
    body.appendChild(e('div', { class: 'desc', text: 'A preset overwrites the movement settings below. Tune them afterwards.' }));

    /* AI levels */
    body.appendChild(e('div', { class: 'subhead', text: 'AI level per night (0 = never moves, 20 = relentless)' }));
    var grid = e('div', { class: 'ai-grid' });
    a.ai.forEach(function (_, n) {
      var box = { get v() { return a.ai[n]; }, set v(x) { a.ai[n] = x; } };
      grid.appendChild(e('div', {}, [
        e('label', { text: 'Night ' + (n + 1) }),
        num(box, 'v', { min: 0, max: 20 })
      ]));
    });
    body.appendChild(grid);

    /* movement */
    body.appendChild(e('div', { class: 'subhead', text: 'Movement' }));
    body.appendChild(e('div', { class: 'row' }, [
      field('Seconds between move attempts', num(a, 'moveInterval', { min: 0.5, max: 30, step: 0.5 })),
      field('Seconds at your door before attacking', num(a, 'attackDelay', { min: 0.5, max: 60, step: 0.5 })),
      field('Seconds blocked before giving up', num(a, 'retreatDelay', { min: 0.5, max: 60, step: 0.5 }))
    ]));
    body.appendChild(e('div', { class: 'row' }, [
      field('Path', sel(a, 'pathMode', [
        { v: 'random', t: 'Roams the map at random' },
        { v: 'route', t: 'Follows a fixed route' }
      ], { onChange: function (mode) {
        // an empty route is meaningless — hand them a working one straight away
        if (mode === 'route' && !a.route.length) {
          var ent = entriesOf(cfg.map);
          a.route = Presets.routeToEntry(cfg.map, a.entry === 'any' ? ent[0] : a.entry, a.startRoom || cfg.map.start);
          a.startRoom = a.route[0];
        }
        save(); render();
      } })),
      field('Enters through', sel(a, 'entry', [
        { v: 'any', t: 'Whichever it reaches' }, { v: 'left', t: 'Left door' },
        { v: 'right', t: 'Right door' }, { v: 'vent', t: 'Vent' }
      ], { onChange: function () { save(); render(); } })),
      field('Starts the night in', sel(a, 'startRoom', cfg.map.rooms.map(function (r) {
        return { v: r.id, t: r.name };
      })))
    ]));

    if (a.pathMode === 'route') {
      body.appendChild(e('div', { class: 'subhead', text: 'Route' }));
      var routeBox = e('div', { class: 'room-list' });
      var byId = {}; cfg.map.rooms.forEach(function (r) { byId[r.id] = r; });
      a.route.forEach(function (rid, i) {
        var room = byId[rid];
        var up = e('button', { class: 'btn tiny', text: '↑' });
        up.onclick = function () { if (i > 0) { a.route.splice(i - 1, 0, a.route.splice(i, 1)[0]); save(); render(); } };
        var dn = e('button', { class: 'btn tiny', text: '↓' });
        dn.onclick = function () { if (i < a.route.length - 1) { a.route.splice(i + 1, 0, a.route.splice(i, 1)[0]); save(); render(); } };
        var rm = e('button', { class: 'btn tiny danger', text: '✕' });
        rm.onclick = function () { a.route.splice(i, 1); save(); render(); };
        routeBox.appendChild(e('div', { class: 'room-row', style: 'display:flex;align-items:center;gap:8px' }, [
          e('span', { class: 'pill', text: (i + 1) }),
          e('span', { style: 'flex:1', text: room ? room.name : '(deleted room)' }),
          room && room.entry ? e('span', { class: 'chip entry-' + room.entry, text: '→ ' + room.entry }) : null,
          up, dn, rm
        ]));
      });
      var addSel = e('select', {}, cfg.map.rooms.map(function (r) { return e('option', { value: r.id, text: r.name }); }));
      var addBtn = e('button', { class: 'btn', text: '+ Add step' });
      addBtn.onclick = function () { a.route.push(addSel.value); save(); render(); };
      var autoBtn = e('button', { class: 'btn', text: 'Auto-route to ' + (a.entry === 'any' ? 'nearest entrance' : a.entry) });
      autoBtn.onclick = function () {
        var entries = entriesOf(cfg.map);
        a.route = Presets.routeToEntry(cfg.map, a.entry === 'any' ? entries[0] : a.entry, a.startRoom || cfg.map.start);
        a.startRoom = a.route[0];
        save(); render(); toast('Route rebuilt');
      };
      body.appendChild(routeBox);
      body.appendChild(e('div', { style: 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap' }, [addSel, addBtn, autoBtn]));
      body.appendChild(e('div', { class: 'desc', style: 'margin-top:8px',
        text: 'They walk this list in order, then step into your ' + (a.entry === 'any' ? 'nearest' : a.entry) + ' entrance.' }));
    }

    /* traits */
    body.appendChild(e('div', { class: 'subhead', text: 'Special features' }));
    body.appendChild(e('div', { class: 'row' }, [
      e('div', {}, [
        chk(a.traits, 'stoppedByDoor', 'Doors stop them', 'Turn off and only lights or luck save you.'),
        chk(a.traits, 'ignoresDoors', 'Walks straight through closed doors', 'Brutal — pair with light stun.'),
        chk(a.traits, 'stunnedByLight', 'Hall light drives them away', 'Flash the light when they are at the door.'),
        chk(a.traits, 'knock', 'Makes a sound when arriving at your door')
      ]),
      e('div', {}, [
        chk(a.traits, 'freezeWhenWatched', 'Freezes while you watch its camera', 'Rewards camera checking.'),
        chk(a.traits, 'rushWhenIgnored', 'Speeds up while its room is NOT watched', 'The classic runner.'),
        chk(a.traits, 'invisibleOnCam', 'Never appears on cameras', 'Only the hall light reveals them.'),
        chk(a.traits, 'jamsCameras', 'Wrecks the camera feed in its room')
      ])
    ]));
    body.appendChild(field('Power drained per second while blocked at your door (%)',
      num(a.traits, 'drainsPower', { min: 0, max: 10, step: 0.1 }),
      '0 = none. 1.2 punishes leaving the door shut on them.'));

    /* voice */
    body.appendChild(e('div', { class: 'subhead', text: 'Voicelines (' + a.voice.lines.length + ')' }));
    body.appendChild(voiceEditor(a));

    /* delete */
    var del = e('button', { class: 'btn danger', style: 'margin-top:18px', text: 'Delete ' + a.name });
    del.onclick = function () {
      if (cfg.animatronics.length <= 1) return toast('You need at least one animatronic', 'bad');
      if (!confirm('Delete ' + a.name + '?')) return;
      cfg.animatronics.splice(idx, 1);
      ui.openAni = -1; save(); render();
    };
    body.appendChild(del);

    card.appendChild(body);
    return card;
  }

  var TRIGGERS = [
    { v: 'move', t: 'When they move to a new room' },
    { v: 'cam', t: 'When you spot them on a camera' },
    { v: 'door', t: 'When they arrive at your door' },
    { v: 'attack', t: 'As they attack you' },
    { v: 'ambient', t: 'Idle (random)' }
  ];

  function voiceEditor(a) {
    var box = e('div', {});
    var voiceNames = FNAF.Audio.voiceList();

    a.voice.lines.forEach(function (line, i) {
      var row = e('div', { class: 'voice-line' });
      var top = e('div', { class: 'row' }, [
        field('When', sel(line, 'trigger', TRIGGERS)),
        field('Type', sel(line, 'mode', [
          { v: 'tts', t: 'Typed line (computer voice)' },
          { v: 'file', t: 'Audio file' }
        ], { onChange: function () { save(); render(); } }))
      ]);
      row.appendChild(top);

      if (line.mode === 'file') {
        row.appendChild(field('Sound', drop(line, 'data', { label: 'Drop an audio file', accept: 'audio/*', audio: true })));
      } else {
        row.appendChild(field('What they say', txt(line, 'text', { placeholder: 'I can hear you breathing.' })));
        row.appendChild(e('div', { class: 'row' }, [
          field('Voice', voiceNames.length
            ? sel(line, 'voice', [{ v: '', t: 'Default' }].concat(voiceNames.map(function (n) { return { v: n, t: n }; })))
            : e('div', { class: 'hint', text: 'No system voices found — the default will be used.' })),
          field('Pitch', range(line, 'pitch', 0, 2, 0.05, function (v) { return v.toFixed(2); })),
          field('Speed', range(line, 'rate', 0.3, 2, 0.05, function (v) { return v.toFixed(2); }))
        ]));
      }

      var prev = e('button', { class: 'btn tiny', text: '▶ Preview' });
      prev.onclick = function () { FNAF.Audio.init(); FNAF.Audio.speakLine(line, a.voice.volume); };
      var del = e('button', { class: 'btn tiny danger', text: 'Remove' });
      del.onclick = function () { a.voice.lines.splice(i, 1); save(); render(); };
      row.appendChild(e('div', { style: 'display:flex;gap:8px' }, [prev, del]));
      box.appendChild(row);
    });

    var add = e('button', { class: 'btn', text: '+ Add voiceline' });
    add.onclick = function () {
      a.voice.lines.push({ trigger: 'door', mode: 'tts', text: '', voice: '', pitch: 0.4, rate: 0.85, data: null, volume: 1 });
      save(); render();
    };
    box.appendChild(e('div', { style: 'display:flex;gap:10px;align-items:center;margin-top:6px' }, [
      add,
      e('div', { style: 'flex:1;max-width:240px' }, [field('Voice volume', range(a.voice, 'volume', 0, 1, 0.05, function (v) { return Math.round(v * 100) + '%'; }))])
    ]));
    if (!a.voice.lines.length) {
      box.appendChild(e('div', { class: 'desc', text: 'No voicelines. Typed lines use your computer’s speech voices and are exported with the game; audio files are copied into assets/.' }));
    }
    return box;
  }

  function secPower() {
    return e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Power' }),
      e('p', { class: 'sec', text: 'The resource that makes doors a decision instead of a solution. All values are % per second.' }),
      e('div', { class: 'card' }, [
        chk(cfg.power, 'enabled', 'Use the power system', 'Off = doors are free and the night is about timing only.'),
        e('div', { class: 'row' }, [
          field('Starting power (%)', num(cfg.power, 'start', { min: 10, max: 999 })),
          field('Idle drain', num(cfg.power, 'baseDrain', { min: 0, max: 10, step: 0.01 })),
          field('Per closed door', num(cfg.power, 'doorDrain', { min: 0, max: 10, step: 0.01 }))
        ]),
        e('div', { class: 'row' }, [
          field('Per hall light', num(cfg.power, 'lightDrain', { min: 0, max: 10, step: 0.01 })),
          field('Cameras open', num(cfg.power, 'camDrain', { min: 0, max: 10, step: 0.01 })),
          field('Vent sealed', num(cfg.power, 'ventDrain', { min: 0, max: 10, step: 0.01 }))
        ])
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Blackout' }),
        e('div', { class: 'desc', text: 'What happens at 0%: everything opens, the lights die, and something comes for you.' }),
        e('div', { class: 'row' }, [
          field('Seconds of darkness before the attack', num(cfg.power, 'blackoutDelay', { min: 1, max: 120, step: 1 })),
          field('Blackout music (optional)', drop(cfg.power, 'blackoutMusic', { label: 'Drop an audio file', accept: 'audio/*', audio: true }))
        ])
      ]),
      (function () {
        var idle = cfg.power.baseDrain * cfg.meta.hourSeconds * 6;
        var full = (cfg.power.baseDrain + cfg.power.doorDrain * 2 + cfg.power.camDrain) * cfg.meta.hourSeconds * 6;
        return e('div', { class: 'card' }, [
          e('h3', { text: 'Budget for a full night' }),
          e('div', { class: 'issue ' + (idle >= cfg.power.start ? 'bad' : 'ok') }, [
            e('span', { text: 'Doing nothing all night costs ' + idle.toFixed(0) + '% of your ' + cfg.power.start + '%.' })
          ]),
          e('div', { class: 'issue warn' }, [
            e('span', { text: 'Both doors shut and cameras up all night would cost ' + full.toFixed(0) + '%.' })
          ])
        ]);
      })()
    ]);
  }

  function secAudio() {
    return e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Audio' }),
      e('p', { class: 'sec', text: 'Sound effects are generated in code, so they work with no files at all. Add your own ambience if you want.' }),
      e('div', { class: 'card' }, [
        e('div', { class: 'row' }, [
          field('Master volume', range(cfg.audio, 'master', 0, 1, 0.05, function (v) { return Math.round(v * 100) + '%'; })),
          field('Ambience volume', range(cfg.audio, 'ambientVolume', 0, 1, 0.05, function (v) { return Math.round(v * 100) + '%'; }))
        ]),
        field('Room ambience', sel(cfg.audio, 'ambient', [
          { v: 'none', t: 'Silence' }, { v: 'fan', t: 'Desk fan' }, { v: 'drone', t: 'Low drone' },
          { v: 'wind', t: 'Wind / air' }, { v: 'heartbeat', t: 'Heartbeat' }
        ])),
        field('Custom ambience track (loops, replaces the above)',
          drop(cfg.audio, 'ambientFile', { label: 'Drop an audio file', accept: 'audio/*', audio: true })),
        chk(cfg.audio, 'footsteps', 'Play footsteps when animatronics move')
      ])
    ]);
  }

  function secExport() {
    var out = e('div', {});
    var btn = e('button', { class: 'btn', style: 'padding:12px 26px;font-size:15px', text: '⬇  Export game folder (.zip)' });
    btn.onclick = doExport;
    var oneBtn = e('button', { class: 'btn primary', style: 'padding:12px 26px;font-size:15px', text: '⬇  Export one .html file' });
    oneBtn.onclick = doExportSingle;
    var playBtn = e('button', { class: 'btn go', style: 'padding:12px 26px;font-size:15px', text: '▶  Play here first' });
    playBtn.onclick = play;

    return e('div', { class: 'sheet' }, [
      e('h2', { class: 'sec', text: 'Export' }),
      e('p', { class: 'sec', text: 'Two shapes of the same game. Both are plain browser games — no server, no build step, no install.' }),
      e('div', { class: 'card' }, [
        e('h3', { text: 'One .html file' }),
        e('div', { class: 'desc', text: 'Everything — code, styling, your pictures and sounds — baked into a single file. Double-click it, put it on a USB stick, email it, or upload it anywhere. Easiest to share, hardest to edit afterwards.' }),
        e('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [oneBtn])
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Game folder' }),
        e('div', { class: 'desc', text: 'The same game as readable source files. Unzip and double-click index.html.' }),
        e('pre', { style: 'font:12px/1.7 Consolas,monospace;color:#9aa3b5;background:#0e1015;padding:14px;border-radius:8px;overflow:auto',
          text:
            Bundler.slug(cfg.meta.title) + '/\n' +
            '├── index.html\n' +
            '├── css/\n' +
            '│   └── style.css\n' +
            '├── js/\n' +
            '│   ├── data.js      ← your rooms, animatronics, AI, voicelines\n' +
            '│   ├── audio.js\n' +
            '│   ├── render.js\n' +
            '│   ├── engine.js\n' +
            '│   ├── boot.js\n' +
            '│   └── main.js\n' +
            '├── assets/          ← every picture and sound you uploaded\n' +
            '└── README.txt' })
      ]),
      e('div', { class: 'card' }, [
        e('h3', { text: 'Go' }),
        e('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [playBtn, btn]),
        e('div', { class: 'desc', style: 'margin-top:12px',
          text: 'Hosting it: drop the folder into a GitHub Pages repo, a Neocities site, or upload the zip to itch.io as an HTML game (tick "This file will be played in the browser").' }),
        out
      ]),
      issuesCard()
    ]);
  }

  /* ---------------- play & export ---------------- */
  function play() {
    var ov = $('#play-overlay');
    var frame = $('#play-frame');
    ov.classList.add('on');
    frame.srcdoc = '<div style="color:#666;font:14px monospace;padding:20px">Building…</div>';
    Bundler.buildPreviewHTML(cfg).then(function (html) {
      frame.srcdoc = html;
      setTimeout(function () { try { frame.contentWindow.focus(); } catch (err) {} }, 300);
    }).catch(function (err) {
      frame.srcdoc = '<body style="background:#111;color:#f88;font:14px monospace;padding:26px">' +
        '<b>Could not build the preview.</b><br><br>' + String(err) +
        '<br><br>A runtime file failed to load. Make sure the whole folder is present:<br>' +
        'game/module.js, game/style.js, game/audio.js, game/render.js, game/engine.js, game/boot.js</body>';
    });
  }
  function stopPlay() {
    $('#play-overlay').classList.remove('on');
    $('#play-frame').srcdoc = '';
  }

  function doExport() {
    var bad = validate().filter(function (i) { return i.l === 'bad'; });
    if (bad.length && !confirm('There ' + (bad.length === 1 ? 'is 1 problem' : 'are ' + bad.length + ' problems') +
        ' that will break the game:\n\n• ' + bad.map(function (b) { return b.t; }).join('\n• ') +
        '\n\nExport anyway?')) return;
    toast('Building…');
    Bundler.downloadZip(cfg).then(function (out) {
      toast('Exported ' + out.folder + '.zip — ' + out.files.length + ' files, ' + out.assetCount + ' assets', 'good');
    }).catch(function (err) {
      toast('Export failed: ' + err.message, 'bad');
    });
  }

  /* One .html file with everything baked in — the whole game in a single
     double-clickable / uploadable file. */
  function doExportSingle() {
    toast('Building…');
    Bundler.downloadSingleFile(cfg).then(function (out) {
      toast('Exported ' + out.file + ' — ' + out.kb + ' KB, one self-contained file', 'good');
    }).catch(function (err) {
      toast('Export failed: ' + err.message, 'bad');
    });
  }

  /* ---------------- render ---------------- */
  function render_soft() { /* text edits that should not rebuild the DOM */ }

  function render() {
    var tabs = $('#tabs');
    tabs.innerHTML = '';
    [['ultra', 'Ultra Simple', 'photo + name'],
     ['simple', 'Simple', 'maps & difficulty'],
     ['advanced', 'Advanced', 'everything else']].forEach(function (t) {
      var b = e('button', { class: 'tab' + (ui.tab === t[0] ? ' active' : '') }, [
        document.createTextNode(t[1]), e('small', { text: t[2] })
      ]);
      b.onclick = function () { ui.tab = t[0]; save(); render(); };
      tabs.appendChild(b);
    });

    var nav = $('#sidenav');
    nav.innerHTML = '';
    if (ui.tab === 'advanced') {
      nav.classList.remove('hidden');
      SECTIONS.forEach(function (s) {
        var b = e('button', { class: 'navitem' + (ui.section === s.k ? ' active' : '') }, [
          e('b', { text: s.t }), e('em', { text: s.d })
        ]);
        b.onclick = function () { ui.section = s.k; save(); render(); };
        nav.appendChild(b);
      });
    } else {
      nav.classList.add('hidden');
    }

    var panel = $('#panel');
    panel.innerHTML = '';
    panel.appendChild(
      ui.tab === 'ultra' ? panelUltra() :
      ui.tab === 'simple' ? panelSimple() : panelAdvanced());
    panel.scrollTop = 0;
    $('#proj-name').value = cfg.meta.title;
  }

  /* ---------------- boot ---------------- */
  function init() {
    if (!load()) { newProject('pizzeria'); }
    cfg = FNAF.normalize(cfg);
    save();

    $('#proj-name').oninput = function () { cfg.meta.title = this.value; save(); };
    $('#btn-new').onclick = function () {
      if (!confirm('Start a new project? Anything unsaved is lost.')) return;
      newProject('pizzeria'); save(); render();
    };
    $('#btn-save').onclick = saveToFile;
    $('#btn-load').onclick = function () { $('#file-load').click(); };
    $('#file-load').onchange = function () { if (this.files[0]) loadFromFile(this.files[0]); this.value = ''; };
    $('#btn-play').onclick = play;
    $('#btn-export').onclick = doExport;
    $('#btn-close-play').onclick = stopPlay;
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && $('#play-overlay').classList.contains('on')) stopPlay();
    });

    render();

    Bundler.loadRuntime().catch(function (err) {
      toast('Runtime files missing (' + err.message + ') — Play and Export will not work.', 'bad');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
