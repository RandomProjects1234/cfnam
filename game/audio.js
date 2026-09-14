/* ============================================================
   FNAF Runtime — audio engine
   Synth SFX + uploaded samples + text-to-speech voicelines.
   All of it is optional: if the browser blocks audio the game
   still runs, it just goes quiet.
   ============================================================ */
FNAF_MODULE('audio.js', function (root) {
  var Audio_ = {};
  var ctx = null, master = null, ambient = null;
  var settings = { master: 0.8, ambientVolume: 0.35 };
  var samples = {};        // src -> HTMLAudioElement pool
  var voices = [];
  var ttsReady = false;

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
    ttsReady = voices.length > 0;
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  Audio_.voiceList = function () { loadVoices(); return voices.map(function (v) { return v.name; }); };

  Audio_.init = function (opts) {
    if (opts) {
      if (typeof opts.master === 'number') settings.master = opts.master;
      if (typeof opts.ambientVolume === 'number') settings.ambientVolume = opts.ambientVolume;
    }
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = settings.master;
    master.connect(ctx.destination);
    return ctx;
  };

  Audio_.setMaster = function (v) {
    settings.master = v;
    if (master) master.gain.value = v;
  };

  Audio_.resume = function () { if (ctx && ctx.state === 'suspended') ctx.resume(); };

  function env(gain, peak, attack, decay) {
    var t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function tone(type, from, to, dur, peak) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, ctx.currentTime);
    if (to !== from) o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), ctx.currentTime + dur);
    env(g, peak, 0.008, dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + dur + 0.05);
  }

  function noise(dur, peak, filterFreq, sweepTo) {
    if (!ctx) return;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = ctx.createGain();
    var out = g;
    if (filterFreq) {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(filterFreq, ctx.currentTime);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + dur);
      src.connect(f); f.connect(g);
    } else { src.connect(g); }
    g.gain.setValueAtTime(peak, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    out.connect(master);
    src.start(); src.stop(ctx.currentTime + dur + 0.02);
  }

  /* ---------------- named SFX ---------------- */
  var SFX = {
    click:      function () { tone('square', 900, 700, 0.05, 0.09); },
    door:       function () { tone('sine', 90, 38, 0.32, 0.32); noise(0.22, 0.12, 900, 200); },
    vent:       function () { tone('square', 150, 70, 0.22, 0.12); noise(0.18, 0.1, 1600, 400); },
    light:      function () { tone('square', 1200, 1200, 0.03, 0.05); noise(0.09, 0.05, 3000); },
    camopen:    function () { noise(0.22, 0.2, 4000, 800); tone('sine', 300, 120, 0.16, 0.08); },
    camswitch:  function () { noise(0.13, 0.16, 5000, 1200); },
    step:       function () { tone('sine', 130, 58, 0.14, 0.16); noise(0.1, 0.06, 700); },
    knock:      function () { tone('sine', 180, 70, 0.1, 0.3); tone('sine', 120, 50, 0.16, 0.22); },
    run:        function () { for (var i = 0; i < 8; i++) setTimeout(function () { tone('sine', 150, 60, 0.08, 0.16); }, i * 90); },
    scare:      function () {
      if (!ctx) return;
      noise(1.6, 0.75, 9000, 300);
      tone('sawtooth', 720, 46, 1.1, 0.4);
      tone('square', 330, 28, 1.3, 0.28);
    },
    powerdown:  function () { tone('sawtooth', 220, 20, 1.4, 0.25); },
    chime:      function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone('triangle', f, f, 0.5, 0.16); }, i * 150); }); },
    alarm:      function () { for (var i = 0; i < 3; i++) setTimeout(function () { tone('square', 880, 440, 0.2, 0.12); }, i * 240); },
    stun:       function () { tone('square', 1400, 300, 0.25, 0.14); }
  };

  Audio_.sfx = function (name) {
    if (!ctx || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* never let audio break the game */ }
  };

  /* ---------------- ambience ---------------- */
  var AMBIENT = {
    none:  null,
    drone: function () {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 52;
      f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.value = 0.05 * settings.ambientVolume * 2;
      o.connect(f); f.connect(g); g.connect(master); o.start();
      return { stop: function () { try { o.stop(); } catch (e) {} } };
    },
    fan: function () {
      var len = Math.floor(ctx.sampleRate * 2);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / ctx.sampleRate * Math.PI * 2 * 11));
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      var g = ctx.createGain(); g.gain.value = 0.09 * settings.ambientVolume * 2;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: function () { try { src.stop(); } catch (e) {} } };
    },
    wind: function () {
      var len = Math.floor(ctx.sampleRate * 3);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { last = last * 0.98 + (Math.random() * 2 - 1) * 0.02; d[i] = last * 6; }
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 320; f.Q.value = 0.7;
      var g = ctx.createGain(); g.gain.value = 0.14 * settings.ambientVolume * 2;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: function () { try { src.stop(); } catch (e) {} } };
    },
    heartbeat: function () {
      var stopped = false;
      function beat() {
        if (stopped || !ctx) return;
        tone('sine', 62, 30, 0.16, 0.22 * settings.ambientVolume * 2);
        setTimeout(function () { if (!stopped) tone('sine', 54, 26, 0.14, 0.15 * settings.ambientVolume * 2); }, 230);
        setTimeout(beat, 1250);
      }
      beat();
      return { stop: function () { stopped = true; } };
    }
  };

  Audio_.startAmbient = function (kind, fileSrc) {
    Audio_.stopAmbient();
    if (fileSrc) {
      var a = new window.Audio(fileSrc);
      a.loop = true; a.volume = Math.min(1, settings.ambientVolume * settings.master);
      a.play().catch(function () {});
      ambient = { stop: function () { try { a.pause(); } catch (e) {} } };
      return;
    }
    if (!ctx || !kind || kind === 'none' || !AMBIENT[kind]) return;
    try { ambient = AMBIENT[kind](); } catch (e) { ambient = null; }
  };

  Audio_.stopAmbient = function () {
    if (ambient) { try { ambient.stop(); } catch (e) {} ambient = null; }
  };

  /* ---------------- samples ---------------- */
  Audio_.playSample = function (src, volume) {
    if (!src) return null;
    try {
      var a = new window.Audio(src);
      a.volume = Math.max(0, Math.min(1, (volume == null ? 1 : volume) * settings.master));
      a.play().catch(function () {});
      samples[src] = a;
      return a;
    } catch (e) { return null; }
  };

  Audio_.stopAllSamples = function () {
    Object.keys(samples).forEach(function (k) { try { samples[k].pause(); } catch (e) {} });
    samples = {};
  };

  /* ---------------- voicelines ----------------
     line = { mode:'tts'|'file', text, voice, pitch, rate, data, volume } */
  Audio_.speakLine = function (line, globalVolume) {
    if (!line) return;
    var vol = (line.volume == null ? 1 : line.volume) * (globalVolume == null ? 1 : globalVolume);
    if (line.mode === 'file' && line.data) { Audio_.playSample(line.data, vol); return; }
    if (!line.text || !('speechSynthesis' in window)) return;
    try {
      var u = new SpeechSynthesisUtterance(line.text);
      u.pitch = line.pitch == null ? 0.4 : line.pitch;
      u.rate = line.rate == null ? 0.85 : line.rate;
      u.volume = Math.max(0, Math.min(1, vol * settings.master));
      if (line.voice) {
        loadVoices();
        var v = voices.filter(function (x) { return x.name === line.voice; })[0];
        if (v) u.voice = v;
      }
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };

  Audio_.cancelSpeech = function () {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  };

  Audio_.shutdown = function () {
    Audio_.stopAmbient();
    Audio_.stopAllSamples();
    Audio_.cancelSpeech();
  };

  root.FNAF = root.FNAF || {};
  root.FNAF.Audio = Audio_;
});
