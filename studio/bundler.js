/* ============================================================
   Studio — bundler

   One code path builds all three outputs:
     · the in-studio preview  (single self-contained HTML string)
     · "single file" export   (that same string, downloaded)
     · "folder" export        (index.html + css/ + js/ + assets/)

   Nothing here fetches anything. The runtime files register their
   own source through FNAF_MODULE (see game/module.js) and the
   stylesheet lives in FNAF.CSS, so the studio runs from file://
   and from any static host with no server.
   ============================================================ */
(function (root) {
  var B = {};
  var RUNTIME_JS = ['audio.js', 'render.js', 'engine.js', 'boot.js'];

  B.loadRuntime = function () {
    var FNAF = root.FNAF || {};
    var missing = RUNTIME_JS.filter(function (n) { return !(FNAF.__src && FNAF.__src[n]); });
    if (missing.length || typeof FNAF.CSS !== 'string') {
      return Promise.reject(new Error('runtime not loaded (' + (missing.join(', ') || 'style.js') + ')'));
    }
    return Promise.resolve({ css: FNAF.CSS, js: FNAF.__src });
  };

  /* ---------- asset extraction ---------- */
  var EXT = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
    'image/svg+xml': 'svg', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
    'audio/webm': 'webm', 'audio/mp4': 'm4a'
  };

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* Deep-walks the config, pulling every data: URL out into a real file. */
  function extractAssets(cfg) {
    var assets = [], seen = {}, n = 0;
    function walk(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      Object.keys(obj).forEach(function (k) {
        var v = obj[k];
        if (typeof v === 'string' && v.indexOf('data:') === 0) {
          if (seen[v]) { obj[k] = seen[v]; return; }
          var m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(v);
          if (!m) return;
          var mime = m[1], isB64 = !!m[2], payload = m[3];
          var ext = EXT[mime] || (mime.indexOf('audio') === 0 ? 'audio' : 'bin');
          var name = 'assets/' + k.replace(/[^a-z0-9]/gi, '') + '-' + (++n) + '.' + ext;
          var bytes = isB64 ? b64ToBytes(payload) : new TextEncoder().encode(decodeURIComponent(payload));
          assets.push({ name: name, data: bytes });
          seen[v] = name;
          obj[k] = name;
        } else if (v && typeof v === 'object') { walk(v); }
      });
      return obj;
    }
    walk(cfg);
    return assets;
  }

  function esc(s) {
    return String(s).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; });
  }
  /* JSON that can live safely inside a <script> block */
  function safeJson(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
      .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  function slug(s) {
    return String(s || 'my-fnaf-game').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 40) || 'my-fnaf-game';
  }
  B.slug = slug;

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  /* ---------- single self-contained HTML file ----------
     Used for the live preview AND for the one-file export. */
  B.buildPreviewHTML = function (cfg) {
    return B.loadRuntime().then(function (rt) {
      var js = RUNTIME_JS.map(function (n) { return rt.js[n]; }).join('\n');
      return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>' + esc(cfg.meta.title) + '</title><style>' + rt.css + '</style></head>' +
        '<body><div id="fnaf-root"></div>' +
        '<script>window.GAME_DATA=' + safeJson(cfg) + ';<\/script>' +
        '<script>' + js + '<\/script>' +
        '<script>FNAF.autoBoot();<\/script>' +
        '</body></html>';
    });
  };

  B.downloadSingleFile = function (cfg) {
    return B.buildPreviewHTML(cfg).then(function (html) {
      var name = slug(cfg.meta.title) + '.html';
      download(new Blob([html], { type: 'text/html' }), name);
      return { file: name, kb: Math.round(html.length / 1024) };
    });
  };

  /* ---------- folder export ---------- */
  B.buildExport = function (rawCfg) {
    return B.loadRuntime().then(function (rt) {
      var cfg = JSON.parse(JSON.stringify(rawCfg));
      var assets = extractAssets(cfg);
      var name = slug(cfg.meta.title);
      var files = [];

      var indexHtml =
'<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<title>' + esc(cfg.meta.title) + '</title>\n' +
'<link rel="stylesheet" href="css/style.css">\n' +
'</head>\n<body>\n' +
'<div id="fnaf-root"></div>\n' +
'<script src="js/data.js"></script>\n' +
'<script src="js/audio.js"></script>\n' +
'<script src="js/render.js"></script>\n' +
'<script src="js/engine.js"></script>\n' +
'<script src="js/boot.js"></script>\n' +
'<script src="js/main.js"></script>\n' +
'</body>\n</html>\n';

      var dataJs =
'/* Game data — everything the editor produced.\n' +
'   Safe to hand-edit: names, AI levels, routes, traits, voicelines. */\n' +
'window.GAME_DATA = ' + JSON.stringify(cfg, null, 2) + ';\n';

      var mainJs =
'/* Boots the game once the page is ready. */\n' +
'(function () {\n' +
'  function go() { window.FNAF.autoBoot(); }\n' +
'  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);\n' +
'  else go();\n' +
'})();\n';

      var readme =
cfg.meta.title + '\n' + '='.repeat(cfg.meta.title.length) + '\n\n' +
'Made with CFNAM (Custom Five Nights At Maker).\n\n' +
'HOW TO PLAY\n' +
'  Double-click index.html. That is it — no server, no install.\n' +
'  (For sound to work, click the page once; browsers block audio until you do.)\n\n' +
'CONTROLS\n' +
'  A / D or arrows .... left / right door\n' +
'  W or up arrow ...... vent\n' +
'  Q / E (hold) ....... hall lights\n' +
'  SPACE .............. cameras     1-9 ... switch camera\n' +
'  P or ESC ........... pause\n\n' +
'FILES\n' +
'  index.html ......... the page\n' +
'  css/style.css ...... all styling\n' +
'  js/data.js ......... your game: rooms, animatronics, AI, voicelines\n' +
'  js/audio.js ........ sound engine (synth SFX + samples + text-to-speech)\n' +
'  js/render.js ....... procedural room + animatronic drawing\n' +
'  js/engine.js ....... night simulation, AI, power, jumpscares\n' +
'  js/boot.js ......... menus and night flow\n' +
'  js/main.js ......... start-up\n' +
'  assets/ ............ your uploaded images and sounds\n\n' +
'PUTTING IT ON THE WEB\n' +
'  Upload the whole folder anywhere static (GitHub Pages, itch.io, Neocities).\n' +
'  For itch.io: zip the folder CONTENTS with index.html at the top level and\n' +
'  tick "This file will be played in the browser".\n';

      files.push({ name: name + '/index.html', data: indexHtml });
      files.push({ name: name + '/css/style.css', data: rt.css });
      files.push({ name: name + '/js/data.js', data: dataJs });
      RUNTIME_JS.forEach(function (n) {
        files.push({ name: name + '/js/' + n, data: rt.js[n] });
      });
      files.push({ name: name + '/js/main.js', data: mainJs });
      files.push({ name: name + '/README.txt', data: readme });
      assets.forEach(function (a) { files.push({ name: name + '/' + a.name, data: a.data }); });

      return { folder: name, files: files, assetCount: assets.length };
    });
  };

  B.downloadZip = function (cfg) {
    return B.buildExport(cfg).then(function (out) {
      download(root.MiniZip.make(out.files), out.folder + '.zip');
      return out;
    });
  };

  root.Bundler = B;
})(window);
