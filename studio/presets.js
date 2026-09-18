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

    hospital: {
      id: 'hospital', name: "St. Agatha's Hospital", start: 'morgue',
      desc: 'Night shift in a closed wing. The morgue is closer than you would like.',
      rooms: [
        R('morgue',   'Morgue',            'CAM 1',  'storage',  0.50, 0.06, ['basement']),
        R('basement', 'Basement Hall',     'CAM 2',  'hall',     0.50, 0.24, ['surgery', 'pharmacy', 'boiler']),
        R('surgery',  'Operating Theatre', 'CAM 3',  'office',   0.16, 0.26, ['wardA']),
        R('pharmacy', 'Pharmacy',          'CAM 4',  'storage',  0.84, 0.26, ['wardB']),
        R('boiler',   'Boiler Room',       'CAM 5',  'storage',  0.50, 0.48, ['airDuct']),
        R('wardA',    'Ward A',            'CAM 6',  'bedroom',  0.18, 0.54, ['westCorr']),
        R('wardB',    'Ward B',            'CAM 7',  'bedroom',  0.82, 0.54, ['eastCorr']),
        R('westCorr', 'West Corridor',     'CAM 8',  'hall',     0.26, 0.82, [], 'left'),
        R('eastCorr', 'East Corridor',     'CAM 9',  'hall',     0.74, 0.82, [], 'right'),
        R('airDuct',  'Air Duct',          'CAM 10', 'vent',     0.50, 0.74, [], 'vent')
      ]
    },

    mall: {
      id: 'mall', name: 'Starlight Mall', start: 'toyStore',
      desc: 'Shutters down, fountain still running. Something is walking the upper level.',
      rooms: [
        R('toyStore',  'Toy Store',        'CAM 1',  'arcade',   0.50, 0.07, ['fountain']),
        R('fountain',  'Fountain Court',   'CAM 2',  'dining',   0.50, 0.27, ['foodCourt', 'cinema', 'dept', 'escalator']),
        R('foodCourt', 'Food Court',       'CAM 3',  'dining',   0.15, 0.30, ['westWing']),
        R('cinema',    'Cinema Lobby',     'CAM 4',  'stage',    0.85, 0.30, ['eastWing']),
        R('dept',      'Department Store', 'CAM 5',  'storage',  0.30, 0.52, ['westWing']),
        R('escalator', 'Escalators',       'CAM 6',  'corner',   0.66, 0.52, ['eastWing', 'serviceDuct']),
        R('restrooms', 'Restrooms',        'CAM 7',  'bathroom', 0.92, 0.60, ['eastWing']),
        R('westWing',  'West Wing',        'CAM 8',  'hall',     0.24, 0.82, [], 'left'),
        R('eastWing',  'East Wing',        'CAM 9',  'hall',     0.78, 0.82, [], 'right'),
        R('serviceDuct','Service Duct',    'CAM 10', 'vent',     0.50, 0.74, [], 'vent')
      ]
    },

    ship: {
      id: 'ship', name: 'The S.S. Marionette', start: 'ballroom',
      desc: 'A cruise ship out of season. Cabins below deck, engines that never stop.',
      rooms: [
        R('ballroom',  'Grand Ballroom',     'CAM 1',  'stage',   0.50, 0.07, ['deck']),
        R('deck',      'Promenade Deck',     'CAM 2',  'hall',    0.50, 0.25, ['galley', 'casino', 'stairwell']),
        R('galley',    'Galley',             'CAM 3',  'kitchen', 0.14, 0.28, ['cabinsP']),
        R('casino',    'Casino',             'CAM 4',  'arcade',  0.86, 0.28, ['cabinsS']),
        R('stairwell', 'Stairwell',          'CAM 5',  'corner',  0.50, 0.44, ['engine']),
        R('engine',    'Engine Room',        'CAM 6',  'storage', 0.50, 0.60, ['bilge']),
        R('cabinsP',   'Port Cabins',        'CAM 7',  'bedroom', 0.20, 0.55, ['portHall']),
        R('cabinsS',   'Starboard Cabins',   'CAM 8',  'bedroom', 0.80, 0.55, ['starHall']),
        R('portHall',  'Port Corridor',      'CAM 9',  'hall',    0.24, 0.82, [], 'left'),
        R('starHall',  'Starboard Corridor', 'CAM 10', 'hall',    0.76, 0.82, [], 'right'),
        R('bilge',     'Bilge Vent',         'CAM 11', 'vent',    0.50, 0.76, [], 'vent')
      ]
    },

    station: {
      id: 'station', name: 'Outpost Kepler-9', start: 'bridge',
      desc: 'Deep-space research station. The crew stopped answering three days ago.',
      rooms: [
        R('bridge',    'Command Bridge',    'CAM 1',  'office',   0.50, 0.07, ['spine']),
        R('spine',     'Central Spine',     'CAM 2',  'hall',     0.50, 0.26, ['hydro', 'lab', 'reactor']),
        R('hydro',     'Hydroponics',       'CAM 3',  'generic',  0.15, 0.30, ['quarters']),
        R('lab',       'Xeno Lab',          'CAM 4',  'storage',  0.85, 0.30, ['medbay']),
        R('reactor',   'Reactor Core',      'CAM 5',  'storage',  0.50, 0.50, ['ductShaft']),
        R('quarters',  'Crew Quarters',     'CAM 6',  'bedroom',  0.20, 0.56, ['portLock']),
        R('medbay',    'Med Bay',           'CAM 7',  'bathroom', 0.80, 0.56, ['starLock']),
        R('portLock',  'Port Airlock',      'CAM 8',  'corner',   0.24, 0.82, [], 'left'),
        R('starLock',  'Starboard Airlock', 'CAM 9',  'corner',   0.76, 0.82, [], 'right'),
        R('ductShaft', 'Maintenance Shaft', 'CAM 10', 'vent',     0.50, 0.74, [], 'vent')
      ]
    },

    theater: {
      id: 'theater', name: 'Palace Picture House', start: 'screen',
      desc: 'An old single-screen cinema. The projector still runs at midnight.',
      rooms: [
        R('screen',      'Main Screen',      'CAM 1',  'stage',    0.50, 0.07, ['aisles']),
        R('aisles',      'Aisles',           'CAM 2',  'dining',   0.50, 0.26, ['booth', 'balcony', 'lobby']),
        R('booth',       'Projection Booth', 'CAM 3',  'office',   0.85, 0.12, ['balcony']),
        R('balcony',     'Balcony',          'CAM 4',  'corner',   0.82, 0.38, ['eastExit']),
        R('lobby',       'Lobby',            'CAM 5',  'dining',   0.50, 0.48, ['concessions', 'restrooms', 'crawl']),
        R('concessions', 'Concessions',      'CAM 6',  'kitchen',  0.18, 0.44, ['westExit']),
        R('restrooms',   'Restrooms',        'CAM 7',  'bathroom', 0.84, 0.60, []),
        R('westExit',    'West Exit',        'CAM 8',  'hall',     0.24, 0.82, [], 'left'),
        R('eastExit',    'East Exit',        'CAM 9',  'hall',     0.76, 0.82, [], 'right'),
        R('crawl',       'Under the Stage',  'CAM 10', 'vent',     0.50, 0.74, [], 'vent')
      ]
    },

    hotel: {
      id: 'hotel', name: 'Hotel Vesper', start: 'ballroom',
      desc: 'A grand hotel with one guest left. Room 313 has not been cleaned in forty years.',
      rooms: [
        R('ballroom', 'Ballroom',       'CAM 1',  'stage',   0.50, 0.07, ['lobby']),
        R('lobby',    'Lobby',          'CAM 2',  'dining',  0.50, 0.26, ['bar', 'kitchen', 'elevator']),
        R('bar',      'Hotel Bar',      'CAM 3',  'arcade',  0.16, 0.28, ['room313']),
        R('kitchen',  'Kitchen',        'CAM 4',  'kitchen', 0.84, 0.28, ['laundry']),
        R('elevator', 'Elevator Shaft', 'CAM 5',  'corner',  0.50, 0.48, ['chute']),
        R('room313',  'Room 313',       'CAM 6',  'bedroom', 0.18, 0.55, ['westHall']),
        R('laundry',  'Laundry',        'CAM 7',  'storage', 0.82, 0.55, ['eastHall']),
        R('westHall', 'West Hallway',   'CAM 8',  'hall',    0.24, 0.82, [], 'left'),
        R('eastHall', 'East Hallway',   'CAM 9',  'hall',    0.76, 0.82, [], 'right'),
        R('chute',    'Laundry Chute',  'CAM 10', 'vent',    0.50, 0.74, [], 'vent')
      ]
    },

    factory: {
      id: 'factory', name: 'Funtime Toy Works', start: 'assembly',
      desc: 'The toy factory never turned its conveyor belts off. Neither did the toys.',
      rooms: [
        R('assembly',  'Assembly Line',    'CAM 1',  'storage', 0.50, 0.07, ['floor']),
        R('floor',     'Factory Floor',    'CAM 2',  'hall',    0.50, 0.26, ['paint', 'packing', 'qa']),
        R('paint',     'Paint Shop',       'CAM 3',  'generic', 0.15, 0.28, ['warehouse']),
        R('packing',   'Packing',          'CAM 4',  'storage', 0.85, 0.28, ['breakroom']),
        R('qa',        'Quality Control',  'CAM 5',  'office',  0.50, 0.48, ['conveyor']),
        R('warehouse', 'Warehouse',        'CAM 6',  'storage', 0.20, 0.55, ['loadingW']),
        R('breakroom', 'Break Room',       'CAM 7',  'kitchen', 0.80, 0.55, ['loadingE']),
        R('loadingW',  'West Loading Bay', 'CAM 8',  'corner',  0.24, 0.82, [], 'left'),
        R('loadingE',  'East Loading Bay', 'CAM 9',  'corner',  0.76, 0.82, [], 'right'),
        R('conveyor',  'Conveyor Duct',    'CAM 10', 'vent',    0.50, 0.74, [], 'vent')
      ]
    },

    museum: {
      id: 'museum', name: 'Hallowell Museum', start: 'dino',
      desc: 'After hours at the natural history museum. Not every exhibit is stuffed.',
      rooms: [
        R('dino',        'Dinosaur Hall',    'CAM 1',  'stage',   0.50, 0.07, ['rotunda']),
        R('rotunda',     'Rotunda',          'CAM 2',  'dining',  0.50, 0.26, ['egypt', 'gallery', 'archives']),
        R('egypt',       'Egyptian Wing',    'CAM 3',  'storage', 0.15, 0.28, ['giftShop']),
        R('gallery',     'Portrait Gallery', 'CAM 4',  'hall',    0.85, 0.28, ['restoration']),
        R('archives',    'Archives',         'CAM 5',  'storage', 0.50, 0.48, ['heating']),
        R('giftShop',    'Gift Shop',        'CAM 6',  'arcade',  0.20, 0.55, ['westStair']),
        R('restoration', 'Restoration Lab',  'CAM 7',  'office',  0.80, 0.55, ['eastStair']),
        R('westStair',   'West Stairs',      'CAM 8',  'corner',  0.24, 0.82, [], 'left'),
        R('eastStair',   'East Stairs',      'CAM 9',  'corner',  0.76, 0.82, [], 'right'),
        R('heating',     'Heating Duct',     'CAM 10', 'vent',    0.50, 0.74, [], 'vent')
      ]
    },

    camp: {
      id: 'camp', name: 'Camp Blackwater', start: 'lake',
      desc: 'Summer camp, off season. No vents out here — just two doors and the woods.',
      rooms: [
        R('lake',      'Lake Dock',     'CAM 1', 'generic',  0.50, 0.07, ['boathouse', 'campfire']),
        R('boathouse', 'Boathouse',     'CAM 2', 'storage',  0.84, 0.14, ['cabinsE']),
        R('campfire',  'Campfire Ring', 'CAM 3', 'stage',    0.40, 0.28, ['messHall', 'cabinsW']),
        R('messHall',  'Mess Hall',     'CAM 4', 'dining',   0.64, 0.40, ['cabinsE', 'showers']),
        R('cabinsW',   'West Cabins',   'CAM 5', 'bedroom',  0.16, 0.44, ['westTrail']),
        R('cabinsE',   'East Cabins',   'CAM 6', 'bedroom',  0.84, 0.44, ['eastTrail']),
        R('showers',   'Shower Block',  'CAM 7', 'bathroom', 0.50, 0.60, ['westTrail']),
        R('westTrail', 'West Trail',    'CAM 8', 'hall',     0.24, 0.82, [], 'left'),
        R('eastTrail', 'East Trail',    'CAM 9', 'hall',     0.76, 0.82, [], 'right')
      ]
    },

    subway: {
      id: 'subway', name: 'Line 9 Station', start: 'tunnel',
      desc: 'The last train left hours ago. Something got off it.',
      rooms: [
        R('tunnel',      'Tunnel Mouth',     'CAM 1',  'hall',     0.50, 0.07, ['platform']),
        R('platform',    'Platform',         'CAM 2',  'hall',     0.50, 0.26, ['ticket', 'maintenance', 'substation']),
        R('ticket',      'Ticket Hall',      'CAM 3',  'dining',   0.16, 0.30, ['stairsW', 'restrooms']),
        R('maintenance', 'Maintenance Room', 'CAM 4',  'storage',  0.84, 0.30, ['stairsE', 'control']),
        R('substation',  'Power Substation', 'CAM 5',  'storage',  0.50, 0.48, ['ventShaft']),
        R('restrooms',   'Restrooms',        'CAM 6',  'bathroom', 0.12, 0.58, []),
        R('control',     'Control Booth',    'CAM 7',  'office',   0.88, 0.58, []),
        R('stairsW',     'West Stairs',      'CAM 8',  'corner',   0.26, 0.82, [], 'left'),
        R('stairsE',     'East Stairs',      'CAM 9',  'corner',   0.74, 0.82, [], 'right'),
        R('ventShaft',   'Vent Shaft',       'CAM 10', 'vent',     0.50, 0.74, [], 'vent')
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

  /* Built-in maps are walkable in both directions. Writing every link twice by
     hand is how Midnight Arcade shipped with its right door unreachable, so
     each map lists a link once and it is mirrored here. */
  Object.keys(P.maps).forEach(function (k) {
    var map = P.maps[k], by = {};
    map.rooms.forEach(function (r) { by[r.id] = r; });
    map.rooms.forEach(function (r) {
      r.links.forEach(function (l) {
        if (by[l] && by[l].links.indexOf(r.id) < 0) by[l].links.push(r.id);
      });
    });
  });

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
      // empty = "use the camera picture" (the engine falls back to it)
      a.doorImage = src.doorImage || null;
      a.jumpscareImage = src.jumpscareImage || null;
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
