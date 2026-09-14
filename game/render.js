/* ============================================================
   FNAF Runtime — procedural renderer
   Draws camera rooms and animatronics. Every asset is optional:
   with no uploads at all the game still looks like a game.
   ============================================================ */
FNAF_MODULE('render.js', function (root) {
  var R = {};
  var imgCache = {};

  /* Cached image loader — returns an Image that may not be ready yet. */
  R.img = function (src) {
    if (!src) return null;
    if (imgCache[src]) return imgCache[src];
    var im = new Image();
    im.decoding = 'async';
    im.src = src;
    imgCache[src] = im;
    return im;
  };
  R.ready = function (im) { return im && im.complete && im.naturalWidth > 0; };

  function rnd(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  R.hash = function (str) {
    var h = 2166136261;
    str = String(str || '');
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  };

  function shade(ctx, w, h, top, bottom) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- room art styles ---------------- */
  var STYLES = {
    stage: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#140a0a', '#050303');
      ctx.fillStyle = '#1d0d0d'; ctx.fillRect(w * 0.1, h * 0.58, w * 0.8, h * 0.42);
      ctx.fillStyle = '#2a1010'; ctx.fillRect(0, 0, w * 0.1, h); ctx.fillRect(w * 0.9, 0, w * 0.1, h);
      for (var i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(70,40,14,' + (0.08 + i * 0.02) + ')';
        ctx.fillRect(w * 0.1, h * (0.54 - i * 0.09), w * 0.8, 3);
      }
      ctx.fillStyle = 'rgba(60,45,10,.5)';
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.28, h); ctx.lineTo(w * 0.72, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a2c06';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.06, w * 0.05, 0, 7); ctx.fill();
    },
    dining: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0b0b0c', '#040404');
      ctx.fillStyle = '#131315'; ctx.fillRect(0, h * 0.68, w, h * 0.32);
      for (var i = 0; i < 4; i++) {
        var tx = w * (0.1 + i * 0.23), ty = h * (0.46 + (i % 2) * 0.09);
        ctx.fillStyle = '#1c1c1e'; ctx.fillRect(tx, ty, w * 0.13, h * 0.07);
        ctx.fillStyle = '#101012'; ctx.fillRect(tx + w * 0.05, ty + h * 0.07, w * 0.03, h * 0.09);
        ctx.fillStyle = '#161618';
        ctx.fillRect(tx - w * 0.03, ty - h * 0.02, w * 0.03, h * 0.11);
        ctx.fillRect(tx + w * 0.13, ty - h * 0.02, w * 0.03, h * 0.11);
      }
      ctx.fillStyle = 'rgba(120,120,140,.05)';
      ctx.fillRect(w * 0.35, 0, w * 0.3, h * 0.35);
    },
    hall: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0a0a09', '#050504');
      ctx.fillStyle = '#141412';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.3, h * 0.18); ctx.lineTo(w * 0.3, h * 0.9);
      ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.7, h * 0.18); ctx.lineTo(w * 0.7, h * 0.9);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#101010'; ctx.fillRect(w * 0.3, h * 0.18, w * 0.4, h * 0.72);
      for (var y = 0; y < 5; y++) {
        ctx.fillStyle = 'rgba(190,180,140,' + (0.05 + y * 0.012) + ')';
        ctx.fillRect(w * 0.42, h * (0.2 + y * 0.14), w * 0.16, 4);
      }
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(w * 0.38, h * 0.3, w * 0.24, h * 0.5);
    },
    corner: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0a0a0b', '#040405');
      ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, w * 0.52, h);
      ctx.fillStyle = '#17171a'; ctx.fillRect(w * 0.52, h * 0.26, w * 0.48, h * 0.74);
      ctx.strokeStyle = '#232326'; ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.58, h * 0.08, w * 0.16, h * 0.22);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(w * 0.2, h * 0.4, w * 0.25, h * 0.45);
    },
    vent: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0c0c0c', '#050505');
      for (var y = 0; y < h; y += Math.max(14, h / 14)) {
        ctx.fillStyle = 'rgba(40,40,40,.85)'; ctx.fillRect(0, y, w, 2);
      }
      ctx.fillStyle = 'rgba(20,20,20,.9)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.28, h * 0.3);
      ctx.lineTo(w * 0.72, h * 0.3); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.28, h * 0.72);
      ctx.lineTo(w * 0.72, h * 0.72); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    },
    kitchen: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#080a0a', '#030404');
      ctx.fillStyle = '#131617'; ctx.fillRect(0, h * 0.55, w, h * 0.12);
      ctx.fillStyle = '#0e1112'; ctx.fillRect(0, h * 0.67, w, h * 0.33);
      for (var i = 0; i < 5; i++) {
        ctx.strokeStyle = '#191d1e'; ctx.lineWidth = 1;
        ctx.strokeRect(w * (0.04 + i * 0.19), h * 0.67, w * 0.17, h * 0.3);
      }
      ctx.fillStyle = '#1a1e20'; ctx.fillRect(w * 0.62, h * 0.18, w * 0.28, h * 0.36);
      ctx.fillStyle = '#0a0c0d'; ctx.fillRect(w * 0.66, h * 0.24, w * 0.2, h * 0.24);
      ctx.fillStyle = 'rgba(150,170,180,.06)'; ctx.fillRect(w * 0.05, h * 0.12, w * 0.4, h * 0.3);
    },
    bedroom: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0b090d', '#040305');
      ctx.fillStyle = '#15121a'; ctx.fillRect(w * 0.08, h * 0.5, w * 0.5, h * 0.3);
      ctx.fillStyle = '#1c1822'; ctx.fillRect(w * 0.08, h * 0.44, w * 0.16, h * 0.1);
      ctx.fillStyle = '#0f0d13'; ctx.fillRect(w * 0.62, h * 0.34, w * 0.3, h * 0.5);
      ctx.strokeStyle = '#221d29'; ctx.strokeRect(w * 0.62, h * 0.34, w * 0.3, h * 0.5);
      ctx.fillStyle = 'rgba(90,90,160,.07)'; ctx.fillRect(w * 0.34, h * 0.06, w * 0.22, h * 0.26);
      ctx.strokeStyle = '#1d1a24'; ctx.strokeRect(w * 0.34, h * 0.06, w * 0.22, h * 0.26);
    },
    arcade: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#07070d', '#020205');
      for (var i = 0; i < 5; i++) {
        var x = w * (0.04 + i * 0.2);
        ctx.fillStyle = '#12121c'; ctx.fillRect(x, h * 0.3, w * 0.15, h * 0.55);
        var hue = (i * 67) % 360;
        ctx.fillStyle = 'hsla(' + hue + ',70%,50%,.16)';
        ctx.fillRect(x + w * 0.02, h * 0.36, w * 0.11, h * 0.16);
      }
      ctx.fillStyle = '#0d0d14'; ctx.fillRect(0, h * 0.85, w, h * 0.15);
    },
    storage: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0a0908', '#040403');
      for (var i = 0; i < 9; i++) {
        var bx = rn() * w * 0.85, by = h * (0.4 + rn() * 0.5), bw = w * (0.08 + rn() * 0.1);
        ctx.fillStyle = 'rgba(40,34,26,' + (0.5 + rn() * 0.4) + ')';
        ctx.fillRect(bx, by, bw, bw * 0.7);
        ctx.strokeStyle = 'rgba(20,17,13,.9)'; ctx.strokeRect(bx, by, bw, bw * 0.7);
      }
    },
    bathroom: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#090b0b', '#030404');
      var t = Math.max(16, w / 16);
      ctx.strokeStyle = 'rgba(60,70,70,.18)'; ctx.lineWidth = 1;
      for (var x = 0; x < w; x += t) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (var y = 0; y < h; y += t) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = '#111414'; ctx.fillRect(w * (0.08 + i * 0.3), h * 0.28, w * 0.22, h * 0.62);
      }
    },
    office: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0d0b08', '#040302');
      ctx.fillStyle = '#151109'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = '#1c170c'; ctx.fillRect(w * 0.2, h * 0.5, w * 0.6, h * 0.16);
      ctx.fillStyle = 'rgba(120,110,60,.09)'; ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, w * 0.22, 0, 7); ctx.fill();
    },
    generic: function (ctx, w, h, rn) {
      shade(ctx, w, h, '#0a0a0a', '#040404');
      ctx.fillStyle = '#111'; ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, h * 0.4);
      ctx.strokeStyle = '#1a1a1a'; ctx.strokeRect(w * 0.1, h * 0.55, w * 0.8, h * 0.4);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(w * 0.4, h * 0.1, w * 0.2, h * 0.25);
    }
  };
  R.styleNames = Object.keys(STYLES);

  /* ---------------- animatronic shapes ---------------- */
  function ear(ctx, x, y, w, h, shape) {
    ctx.beginPath();
    if (shape === 'bunny') { ctx.ellipse(x, y - h * 0.5, w * 0.22, h * 0.8, 0, 0, 7); }
    else if (shape === 'fox') { ctx.moveTo(x - w * 0.3, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w * 0.3, y); ctx.closePath(); }
    else if (shape === 'bear') { ctx.arc(x, y - h * 0.1, w * 0.3, 0, 7); }
    else if (shape === 'chicken') { ctx.moveTo(x - w * 0.25, y); ctx.lineTo(x, y - h * 0.8); ctx.lineTo(x + w * 0.25, y); ctx.closePath(); }
    else if (shape === 'bot') { ctx.rect(x - w * 0.16, y - h * 0.7, w * 0.32, h * 0.7); }
    else { ctx.arc(x, y, w * 0.2, 0, 7); }
    ctx.fill();
  }

  /* Draws a procedural animatronic. Used whenever an image is missing. */
  R.drawCreature = function (ctx, x, y, w, h, def, opt) {
    opt = opt || {};
    def = def || {};
    var color = def.color || '#8a5a2b';
    var shape = def.shape || 'bear';
    var rn = rnd(R.hash(def.id || def.name || 'x') + 1);
    var glow = opt.glow == null ? 1 : opt.glow;
    var jitter = opt.jitter || 0;
    var jx = (rn() - 0.5) * jitter, jy = (rn() - 0.5) * jitter;

    ctx.save();
    ctx.translate(x + jx, y + jy);

    var dark = opt.dark == null ? 0.55 : opt.dark;
    function mix(c, f) {
      // c = '#rrggbb'
      var n = parseInt(c.slice(1), 16);
      var r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    var body = mix(color, dark);
    var belly = mix(color, dark * 1.5);

    var headR = w * 0.3;
    var headY = h * 0.24;

    // torso
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - w * 0.26, h);
    ctx.lineTo(w * 0.5 - w * 0.22, h * 0.44);
    ctx.quadraticCurveTo(w * 0.5, h * 0.36, w * 0.5 + w * 0.22, h * 0.44);
    ctx.lineTo(w * 0.5 + w * 0.26, h);
    ctx.closePath(); ctx.fill();

    // belly plate
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.72, w * 0.15, h * 0.2, 0, 0, 7);
    ctx.fill();

    // arms
    ctx.fillStyle = body;
    ctx.fillRect(w * 0.5 - w * 0.36, h * 0.46, w * 0.11, h * 0.4);
    ctx.fillRect(w * 0.5 + w * 0.25, h * 0.46, w * 0.11, h * 0.4);

    // ears / horns
    ctx.fillStyle = body;
    ear(ctx, w * 0.5 - headR * 0.62, headY - headR * 0.7, headR, headR * 1.5, shape);
    ear(ctx, w * 0.5 + headR * 0.62, headY - headR * 0.7, headR, headR * 1.5, shape);

    // head
    ctx.fillStyle = body;
    ctx.beginPath();
    if (shape === 'bot') ctx.rect(w * 0.5 - headR, headY - headR, headR * 2, headR * 2);
    else ctx.ellipse(w * 0.5, headY, headR, headR * 1.02, 0, 0, 7);
    ctx.fill();

    // snout
    if (shape !== 'bot' && shape !== 'ghost') {
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, headY + headR * 0.42, headR * 0.52, headR * 0.36, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(w * 0.5, headY + headR * 0.24, headR * 0.13, headR * 0.1, 0, 0, 7); ctx.fill();
    }

    // eye sockets
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(w * 0.5 - headR * 0.42, headY - headR * 0.16, headR * 0.28, headR * 0.26, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.5 + headR * 0.42, headY - headR * 0.16, headR * 0.28, headR * 0.26, 0, 0, 7); ctx.fill();

    // glowing pupils
    if (glow > 0) {
      var eg = opt.eyeColor || '#ffffff';
      ctx.save();
      ctx.shadowColor = eg; ctx.shadowBlur = headR * 0.7 * glow;
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(w * 0.5 - headR * 0.42, headY - headR * 0.14, headR * 0.11, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.5 + headR * 0.42, headY - headR * 0.14, headR * 0.11, 0, 7); ctx.fill();
      ctx.restore();
    }

    // teeth
    if (opt.teeth !== false) {
      var ty = headY + headR * (shape === 'bot' || shape === 'ghost' ? 0.5 : 0.62);
      var tw = headR * 0.9;
      ctx.fillStyle = '#000';
      ctx.fillRect(w * 0.5 - tw / 2, ty - headR * 0.06, tw, headR * 0.22);
      ctx.fillStyle = '#d8d3c4';
      for (var i = 0; i < 6; i++) {
        ctx.fillRect(w * 0.5 - tw / 2 + i * (tw / 6) + 1, ty - headR * 0.04, tw / 6 - 2, headR * 0.11);
        ctx.fillRect(w * 0.5 - tw / 2 + i * (tw / 6) + 1, ty + headR * 0.06, tw / 6 - 2, headR * 0.09);
      }
    }

    // bowtie
    if (opt.tie !== false && shape !== 'ghost') {
      ctx.fillStyle = mix('#c02020', dark * 1.6);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.5 - w * 0.11, h * 0.42); ctx.lineTo(w * 0.5 - w * 0.11, h * 0.52);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.5 + w * 0.11, h * 0.42); ctx.lineTo(w * 0.5 + w * 0.11, h * 0.52);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  /* Draw either the uploaded image or the procedural fallback. */
  R.drawActor = function (ctx, x, y, w, h, def, imgSrc, opt) {
    var im = imgSrc ? R.img(imgSrc) : null;
    if (R.ready(im)) {
      var ratio = Math.min(w / im.naturalWidth, h / im.naturalHeight);
      var dw = im.naturalWidth * ratio, dh = im.naturalHeight * ratio;
      ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      return true;
    }
    R.drawCreature(ctx, x, y, w, h, def, opt);
    return false;
  };

  /* ---------------- static ---------------- */
  var staticTiles = null;
  R.staticTile = function (size, alpha) {
    size = size || 64;
    if (staticTiles) return staticTiles;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var id = g.createImageData(size, size), d = id.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = Math.random() * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = alpha == null ? 255 : alpha;
    }
    g.putImageData(id, 0, 0);
    staticTiles = c.toDataURL();
    return staticTiles;
  };

  R.drawStatic = function (ctx, w, h, amount) {
    if (!amount) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, amount);
    var n = Math.floor(w * h * 0.0016 * Math.min(1, amount * 3));
    for (var i = 0; i < n; i++) {
      var v = 60 + Math.floor(Math.random() * 196);
      ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.restore();
  };

  /* ---------------- main camera render ---------------- */
  /* room: {name,label,style,image}, occupants: [animatronic defs] */
  R.drawRoom = function (canvas, room, occupants, opt) {
    opt = opt || {};
    var parent = canvas.parentElement;
    var cw = Math.max(2, parent ? parent.clientWidth : canvas.width);
    var ch = Math.max(2, parent ? parent.clientHeight : canvas.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = cw, h = ch;

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

    var bg = room && room.image ? R.img(room.image) : null;
    if (R.ready(bg)) {
      // cover-fit
      var sc = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
      var dw = bg.naturalWidth * sc, dh = bg.naturalHeight * sc;
      ctx.drawImage(bg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, w, h);
    } else {
      var drawer = STYLES[(room && room.style) || 'generic'] || STYLES.generic;
      drawer(ctx, w, h, rnd(R.hash((room && room.id) || 'r') + 7));
    }

    // occupants
    (occupants || []).forEach(function (a, i) {
      var n = occupants.length;
      var slot = n === 1 ? 0.5 : 0.22 + (i * 0.56) / Math.max(1, n - 1);
      var aw = w * (n > 2 ? 0.26 : 0.34);
      var ah = h * 0.72;
      var ax = w * slot - aw / 2;
      var ay = h * 0.16;
      ctx.save();
      ctx.globalAlpha = 0.92;
      R.drawActor(ctx, ax, ay, aw, ah, a, a.camImage, {
        jitter: 3, dark: 0.5, eyeColor: a.eyeColor || '#fff', glow: 1
      });
      ctx.restore();
    });

    // green night-vision cast
    ctx.fillStyle = 'rgba(30,60,30,.12)'; ctx.fillRect(0, 0, w, h);

    // interference
    R.drawStatic(ctx, w, h, opt.staticAmount == null ? 0.06 : opt.staticAmount);

    if (opt.glitch) {
      for (var g2 = 0; g2 < 5; g2++) {
        var sy = Math.random() * h, sh = 3 + Math.random() * 14;
        try {
          var slice = ctx.getImageData(0, sy * dpr, canvas.width, sh * dpr);
          ctx.putImageData(slice, (Math.random() - 0.5) * 40 * dpr, sy * dpr);
        } catch (e) { /* tainted canvas (file:// images) — skip glitch */ opt.glitch = false; break; }
      }
    }

    // label + timestamp
    ctx.fillStyle = 'rgba(220,220,220,.65)';
    ctx.font = '11px "Courier New", monospace';
    var d = new Date();
    var stamp = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' +
                String(d.getSeconds()).padStart(2, '0');
    ctx.fillText(stamp, w - 74, h - 12);
    if (room && room.label) ctx.fillText(room.label, 12, h - 12);
  };

  /* ---------------- minimap ---------------- */
  R.drawMiniMap = function (canvas, rooms, currentId, hotIds) {
    var cw = canvas.clientWidth || 180, ch = Math.round(cw * 0.72);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    canvas.style.height = ch + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, cw, ch);
    var pad = 12;
    function px(r) { return pad + r.x * (cw - pad * 2); }
    function py(r) { return pad + r.y * (ch - pad * 2); }
    var byId = {};
    rooms.forEach(function (r) { byId[r.id] = r; });

    ctx.strokeStyle = '#242424'; ctx.lineWidth = 1;
    rooms.forEach(function (r) {
      (r.links || []).forEach(function (l) {
        var t = byId[l]; if (!t) return;
        ctx.beginPath(); ctx.moveTo(px(r), py(r)); ctx.lineTo(px(t), py(t)); ctx.stroke();
      });
    });
    // office marker
    ctx.fillStyle = '#333';
    ctx.fillRect(cw / 2 - 12, ch - 14, 24, 10);
    ctx.fillStyle = '#666'; ctx.font = '7px "Courier New"';
    ctx.fillText('OFFICE', cw / 2 - 13, ch - 6);

    rooms.forEach(function (r) {
      var hot = hotIds && hotIds.indexOf(r.id) >= 0;
      ctx.fillStyle = r.id === currentId ? '#4af' : hot ? '#f33' : '#2e2e2e';
      ctx.beginPath(); ctx.arc(px(r), py(r), r.id === currentId ? 5 : 4, 0, 7); ctx.fill();
    });
  };

  root.FNAF = root.FNAF || {};
  root.FNAF.Render = R;
});
