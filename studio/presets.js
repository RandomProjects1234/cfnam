/* ============================================================
   Studio — built-in maps, animatronic templates, difficulty
   ============================================================ */
(function (root) {
  var P = {};

  function R(id, name, label, style, x, y, links, entry) {
    return { id: id, name: name, label: label, style: style, image: null, x: x, y: y, links: links, entry: entry || null };
  }

  /* ---------------- MAPS ---------------- */
  P.maps = {
    pizzeria: {
      id: 'pizzeria', name: "Freddy's Pizzeria", start: 'stage',
      desc: 'The classic: show stage, dining hall, two corridors and a vent.',
      rooms: [
        R('stage',      'Show Stage',     'CAM 1A', 'stage',   0.50, 0.07, ['dining', 'backstage']),
        R('backstage',  'Backstage',      'CAM 5',  'storage', 0.14, 0.14, ['dining', 'stage']),
        R('dining',     'Dining Area',    'CAM 1B', 'dining',  0.50, 0.30, ['stage', 'backstage', 'westHall', 'eastHall', 'kitchen', 'cove', 'ventShaft']),
        R('cove',       'Pirate Cove',    'CAM 1C', 'arcade',  0.12, 0.38, ['dining', 'westHall']),
        R('kitchen',    'Kitchen',        'CAM 6',  'kitchen', 0.88, 0.22, ['dining']),
        R('westHall',   'West Hall',      'CAM 2A', 'hall',    0.28, 0.56, ['dining', 'westCorner', 'closet', 'cove']),
        R('closet',     'Supply Closet',  'CAM 3',  'storage', 0.10, 0.66, ['westHall']),
        R('westCorner', 'West Corner',    'CAM 2B', 'corner',  0.24, 0.82, ['westHall'], 'left'),
        R('eastHall',   'East Hall',      'CAM 4A', 'hall',    0.72, 0.56, ['dining', 'eastCorner']),
        R('eastCorner', 'East Corner',    'CAM 4B', 'corner',  0.76, 0.82, ['eastHall'], 'right'),
        R('ventShaft',  'Vent Shaft',     'CAM 7',  'vent',    0.50, 0.72, ['dining'], 'vent')
      ]
    },

    house: {
      id: 'house', name: 'The House on Elm Row', start: 'living',
      desc: 'A two-storey home. Bedrooms upstairs, a long hallway to your study.',
      rooms: [
        R('attic',    'Attic',          'CAM 1', 'storage', 0.50, 0.06, ['upstairs']),
        R('upstairs', 'Upstairs Landing', 'CAM 2', 'hall',  0.50, 0.22, ['attic', 'bedA', 'bedB', 'stairs']),
        R('bedA',     "Left Bedroom",   'CAM 3', 'bedroom', 0.18, 0.22, ['upstairs']),
        R('bedB',     "Right Bedroom",  'CAM 4', 'bedroom', 0.82, 0.22, ['upstairs']),
        R('stairs',   'Staircase',      'CAM 5', 'corner',  0.50, 0.40, ['upstairs', 'living']),
        R('living',   'Living Room',    'CAM 6', 'dining',  0.50, 0.55, ['stairs', 'kitchen', 'westHall', 'ductwork']),
        R('kitchen',  'Kitchen',        'CAM 7', 'kitchen', 0.84, 0.55, ['living', 'eastHall']),
        R('westHall', 'Study Hallway',  'CAM 8', 'hall',    0.26, 0.74, ['living'], 'left'),
        R('eastHall', 'Back Hallway',   'CAM 9', 'hall',    0.76, 0.74, ['kitchen'], 'right'),
        R('ductwork', 'Ductwork',       'CAM 10', 'vent',   0.50, 0.82, ['living'], 'vent')
      ]
    },

    arcade: {
      id: 'arcade', name: 'Midnight Arcade', start: 'floor',
      desc: 'Neon cabinets, a prize corner and a crawlspace nobody maintains.',
      rooms: [
        R('booth',   'Ticket Booth',   'CAM 1', 'office',   0.50, 0.07, ['floor']),
        R('floor',   'Arcade Floor',   'CAM 2', 'arcade',   0.50, 0.26, ['booth', 'prize', 'tunnel', 'restroom', 'duct']),
        R('prize',   'Prize Corner',   'CAM 3', 'storage',  0.16, 0.30, ['floor', 'tunnel']),
        R('restroom','Restrooms',      'CAM 4', 'bathroom', 0.86, 0.30, ['floor']),
        R('tunnel',  'Neon Tunnel',    'CAM 5', 'hall',     0.26, 0.52, ['floor', 'prize', 'westApp']),
        R('server',  'Server Room',    'CAM 6', 'storage',  0.80, 0.52, ['restroom', 'eastApp', 'floor']),
        R('westApp', 'West Approach',  'CAM 7', 'corner',   0.24, 0.78, ['tunnel'], 'left'),
        R('eastApp', 'East Approach',  'CAM 8', 'corner',   0.78, 0.78, ['server'], 'right'),
        R('duct',    'Crawlspace',     'CAM 9', 'vent',     0.50, 0.72, ['floor'], 'vent')
      ]
    },

    school: {
      id: 'school', name: 'Nightshift Academy', start: 'gym',
      desc: 'Empty classrooms, a gym that echoes, and ceiling ducts.',
      rooms: [
        R('gym',      'Gymnasium',    'CAM 1', 'stage',    0.50, 0.08, ['cafeteria', 'lockers']),
        R('cafeteria','Cafeteria',    'CAM 2', 'dining',   0.72, 0.24, ['gym', 'kitchen', 'eastCorr']),
        R('kitchen',  'Lunch Kitchen','CAM 3', 'kitchen',  0.90, 0.40, ['cafeteria']),
        R('lockers',  'Locker Row',   'CAM 4', 'hall',     0.28, 0.24, ['gym', 'class', 'westCorr']),
        R('class',    'Classroom 2B', 'CAM 5', 'bedroom',  0.10, 0.42, ['lockers', 'library']),
        R('library',  'Library',      'CAM 6', 'storage',  0.16, 0.60, ['class', 'westCorr']),
        R('boiler',   'Boiler Room',  'CAM 7', 'storage',  0.50, 0.55, ['ceiling', 'westCorr', 'eastCorr']),
        R('westCorr', 'West Corridor','CAM 8', 'hall',     0.28, 0.80, ['lockers', 'library', 'boiler'], 'left'),
        R('eastCorr', 'East Corridor','CAM 9', 'hall',     0.72, 0.80, ['cafeteria', 'boiler'], 'right'),
        R('ceiling',  'Ceiling Duct', 'CAM 10','vent',     0.50, 0.72, ['boiler'], 'vent')
      ]
    },

    blank: {
      id: 'blank', name: 'Blank (build your own)', start: 'main',
      desc: 'Three rooms to start from. Add your own in the Map editor.',
      rooms: [
        R('main',  'Main Room',   'CAM 1', 'stage', 0.50, 0.16, ['leftApp', 'rightApp', 'ductA']),
        R('leftApp',  'Left Approach',  'CAM 2', 'hall', 0.24, 0.62, ['main'], 'left'),
        R('rightApp', 'Right Approach', 'CAM 3', 'hall', 0.76, 0.62, ['main'], 'right'),
        R('ductA',    'Duct',           'CAM 4', 'vent', 0.50, 0.74, ['main'], 'vent')
      ]
    }
  };

  P.mapList = function () {
    return Object.keys(P.maps).map(function (k) { return P.maps[k]; });
  };
  P.cloneMap = function (id) {
    return JSON.parse(JSON.stringify(P.maps[id] || P.maps.blank));
  };

  /* ---------------- ANIMATRONIC TEMPLATES ---------------- */
  P.templates = [
    {
      key: 'wanderer', label: 'Wanderer',
      desc: 'Roams the whole map at random and uses whichever door it reaches.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'any';
        a.moveInterval = 5; a.attackDelay = 7; a.retreatDelay = 5;
        a.traits.stoppedByDoor = true;
      }
    },
    {
      key: 'leftStalker', label: 'Left Stalker',
      desc: 'Follows a fixed route straight to your left door.',
      apply: function (a) { a.pathMode = 'route'; a.entry = 'left'; a.moveInterval = 5.5; a.attackDelay = 7; }
    },
    {
      key: 'rightStalker', label: 'Right Stalker',
      desc: 'Follows a fixed route straight to your right door.',
      apply: function (a) { a.pathMode = 'route'; a.entry = 'right'; a.moveInterval = 5.5; a.attackDelay = 7; }
    },
    {
      key: 'crawler', label: 'Vent Crawler',
      desc: 'Only ever comes through the vent. Fast, but the vent stops it.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'vent';
        a.moveInterval = 4; a.attackDelay = 5; a.traits.knock = true;
      }
    },
    {
      key: 'runner', label: 'The Runner',
      desc: 'Sprints when you are not watching its room and drains power at the door.',
      apply: function (a) {
        a.pathMode = 'route'; a.entry = 'left';
        a.moveInterval = 6; a.attackDelay = 3; a.retreatDelay = 2.5;
        a.traits.rushWhenIgnored = true; a.traits.drainsPower = 1.2;
      }
    },
    {
      key: 'shy', label: 'Shy One',
      desc: 'Freezes while you watch it on camera — so check it, but not for long.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'any';
        a.moveInterval = 4.5; a.attackDelay = 6;
        a.traits.freezeWhenWatched = true;
      }
    },
    {
      key: 'phantom', label: 'Phantom',
      desc: 'Never shows up on camera. Only the hall light reveals it — and repels it.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'any';
        a.moveInterval = 5; a.attackDelay = 6;
        a.traits.invisibleOnCam = true; a.traits.stunnedByLight = true;
      }
    },
    {
      key: 'jammer', label: 'Signal Jammer',
      desc: 'Wrecks the camera feed in whatever room it stands in.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'any';
        a.moveInterval = 5.5; a.attackDelay = 7;
        a.traits.jamsCameras = true;
      }
    },
    {
      key: 'brute', label: 'The Brute',
      desc: 'Doors will not stop it. Only the hall light drives it back. Very rare mover.',
      apply: function (a) {
        a.pathMode = 'random'; a.entry = 'any';
        a.moveInterval = 9; a.attackDelay = 9;
        a.traits.ignoresDoors = true; a.traits.stoppedByDoor = false; a.traits.stunnedByLight = true;
      }
    }
  ];

  P.templateByKey = function (k) {
    return P.templates.filter(function (t) { return t.key === k; })[0] || P.templates[0];
  };

  /* ---------------- difficulty ---------------- */
  P.difficulties = {
    easy:      { label: 'Easy',      mul: 0.55, base: [0, 1, 2, 3, 5, 7, 9] },
    normal:    { label: 'Normal',    mul: 1.00, base: [1, 3, 5, 8, 11, 14, 17] },
    hard:      { label: 'Hard',      mul: 1.35, base: [3, 6, 9, 12, 15, 18, 20] },
    nightmare: { label: 'Nightmare', mul: 1.75, base: [6, 10, 13, 16, 19, 20, 20] }
  };

  P.aiCurve = function (diffKey, slot) {
    var d = P.difficulties[diffKey] || P.difficulties.normal;
    // later animatronics in the roster start slightly weaker so night 1 is fair
    var offset = slot * 0.75;
    return d.base.map(function (v) {
      return Math.max(0, Math.min(20, Math.round((v - offset) * d.mul)));
    });
  };

  /* Build a route from the map graph toward a given entry side. */
  P.routeToEntry = function (map, entry, startId) {
    var byId = {}; map.rooms.forEach(function (r) { byId[r.id] = r; });
    var target = map.rooms.filter(function (r) { return r.entry === entry; })[0];
    if (!target) target = map.rooms.filter(function (r) { return r.entry; })[0];
    if (!target) return [map.start];
    // BFS from start to target
    var start = byId[startId] ? startId : map.start;
    var q = [[start]], seen = {};
    seen[start] = 1;
    while (q.length) {
      var path = q.shift();
      var node = path[path.length - 1];
      if (node === target.id) return path;
      (byId[node].links || []).forEach(function (l) {
        if (seen[l]) return;
        seen[l] = 1;
        q.push(path.concat([l]));
      });
    }
    return [start, target.id];
  };

  P.entriesAvailable = function (map) {
    var set = {};
    map.rooms.forEach(function (r) { if (r.entry) set[r.entry] = 1; });
    return Object.keys(set);
  };

  /* ---------------- build a full config ---------------- */
  var PALETTE = ['#8a5a2b', '#7a4fa3', '#c9a227', '#b03a2e', '#2e86a3', '#3f7d3f'];
  var SHAPES = ['bear', 'bunny', 'chicken', 'fox', 'bot', 'ghost'];
  var ORDER = ['wanderer', 'rightStalker', 'crawler', 'runner', 'shy', 'jammer'];

  /* opts: {title, subtitle, mapId, difficulty, nights, officeImage, animatronics:[{name,camImage,jumpscareImage}]} */
  P.buildSimple = function (opts) {
    var map = P.cloneMap(opts.mapId || 'pizzeria');
    var entries = P.entriesAvailable(map);
    var list = (opts.animatronics || []).slice(0, 6);
    if (!list.length) list = [{ name: 'Animatronic 1' }];

    var anis = list.map(function (src, i) {
      var a = window.FNAF.defaultAnimatronic(i);
      a.id = 'a' + (i + 1);
      a.name = src.name || a.name;
      a.color = src.color || PALETTE[i % PALETTE.length];
      a.shape = src.shape || SHAPES[i % SHAPES.length];
      a.camImage = src.camImage || null;
      a.doorImage = src.doorImage || src.camImage || null;
      a.jumpscareImage = src.jumpscareImage || src.camImage || null;
      a.jumpscareSound = src.jumpscareSound || null;
      a.voice = src.voice || { volume: 1, lines: [] };

      var tpl = P.templateByKey(ORDER[i % ORDER.length]);
      tpl.apply(a);
      a.template = tpl.key;

      // make sure the chosen entry actually exists on this map
      if (a.entry !== 'any' && entries.indexOf(a.entry) < 0) a.entry = entries[i % entries.length] || 'any';
      if (a.entry === 'any' && a.pathMode === 'route') a.entry = entries[i % entries.length] || 'left';

      a.startRoom = map.start;
      if (a.pathMode === 'route') {
        a.route = P.routeToEntry(map, a.entry, map.start);
        a.startRoom = a.route[0];
      }
      a.ai = P.aiCurve(opts.difficulty || 'normal', i);
      return a;
    });

    return window.FNAF.normalize({
      version: 2,
      meta: {
        title: opts.title || 'Five Nights at My Place',
        subtitle: opts.subtitle || 'A Security Nightmare',
        nights: opts.nights || 5,
        hourSeconds: opts.hourSeconds || 55,
        customNight: true
      },
      theme: opts.theme || { accent: '#ff3b3b', titleColor: '#ffffff', bg: '#000000' },
      power: opts.power || {},
      audio: opts.audio || {},
      text: opts.text || {},
      office: {
        image: opts.officeImage || null,
        panEnabled: true, fan: true,
        left: { enabled: entries.indexOf('left') >= 0, door: true, light: true, image: opts.leftImage || null },
        right: { enabled: entries.indexOf('right') >= 0, door: true, light: true, image: opts.rightImage || null },
        vent: { enabled: entries.indexOf('vent') >= 0, door: true, image: opts.ventImage || null }
      },
      map: map,
      animatronics: anis
    });
  };

  root.Presets = P;
})(window);
