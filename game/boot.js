/* ============================================================
   FNAF Runtime — shell: title screen, night select, end screens.
   Entry point for both the studio preview and exported games.
   ============================================================ */
FNAF_MODULE('boot.js', function (root) {
  var FNAF = root.FNAF = root.FNAF || {};

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'style') e.setAttribute('style', attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  FNAF.boot = function (mount, rawCfg) {
    var cfg = FNAF.normalize(rawCfg);
    var engine = null;
    var saveKey = 'fnaf-progress:' + (cfg.meta.title || 'game');

    document.title = cfg.meta.title;
    var rootEl = document.documentElement;
    rootEl.style.setProperty('--accent', cfg.theme.accent);
    rootEl.style.setProperty('--titleColor', cfg.theme.titleColor);
    rootEl.style.setProperty('--bg', cfg.theme.bg);

    function loadProgress() {
      try { return parseInt(localStorage.getItem(saveKey), 10) || 0; } catch (e) { return 0; }
    }
    function saveProgress(n) {
      try { localStorage.setItem(saveKey, String(Math.max(n, loadProgress()))); } catch (e) {}
    }

    function clear() {
      if (engine) { engine.destroy(); engine = null; }
      mount.innerHTML = '';
    }

    /* ---------------- title ---------------- */
    function title() {
      clear();
      var done = loadProgress();
      var nightsWrap = h('div', { class: 'fn-nights' });
      var total = Math.max(1, Math.min(20, cfg.meta.nights));
      for (var i = 1; i <= total; i++) (function (n) {
        var b = h('button', { class: 'fn-night-btn' + (n <= done ? ' done' : ''), text: 'Night ' + n });
        b.disabled = n > done + 1;
        b.onclick = function () { FNAF.Audio.init(); startNight(n); };
        nightsWrap.appendChild(b);
      })(i);

      var reset = h('button', { class: 'fn-btn small', text: 'Reset progress' });
      reset.onclick = function () {
        try { localStorage.removeItem(saveKey); } catch (e) {}
        title();
      };

      var screen = h('div', { class: 'fn-screen on' }, [
        h('h1', { class: 'fn-title', html: String(cfg.meta.title).replace(/\n/g, '<br>') }),
        h('div', { class: 'fn-sub', text: cfg.meta.subtitle || '' }),
        nightsWrap,
        cfg.meta.customNight && done >= total
          ? (function () {
              var b = h('button', { class: 'fn-btn', text: 'Night ' + (total + 1) + '+' });
              b.onclick = function () { FNAF.Audio.init(); startNight(total + 1); };
              return b;
            })()
          : null,
        reset,
        h('div', { class: 'fn-hint', html:
          'A/D or ←/→ doors &nbsp;·&nbsp; W or ↑ vent &nbsp;·&nbsp; Q/E hold for lights<br>' +
          'SPACE cameras &nbsp;·&nbsp; 1–9 switch camera &nbsp;·&nbsp; P pause' })
      ]);
      mount.appendChild(screen);
      if (cfg.text.intro) {
        screen.insertBefore(h('div', { class: 'fn-hint', style: 'margin-bottom:10px;max-width:640px', text: cfg.text.intro }), nightsWrap);
      }
    }

    /* ---------------- night card ---------------- */
    function startNight(n) {
      clear();
      var card = h('div', { class: 'fn-screen on', id: 'fn-nightcard' }, [
        h('div', { class: 'n', text: 'Night ' + n }),
        h('div', { class: 'sub', text: '12:00 AM' })
      ]);
      mount.appendChild(card);
      setTimeout(function () {
        if (!card.parentNode) return;
        mount.removeChild(card);
        run(n);
      }, 1600);
    }

    function run(n) {
      var host = h('div', { class: 'fn-layer on' });
      mount.appendChild(host);
      engine = FNAF.Engine({
        mount: host, cfg: cfg, night: n,
        onEnd: function (res) {
          if (res.win) { saveProgress(res.night); win(res); }
          else lose(res);
        }
      });
    }

    /* ---------------- end screens ---------------- */
    function win(res) {
      clear();
      var next = res.night + 1;
      var more = next <= cfg.meta.nights || cfg.meta.customNight;
      var btn = h('button', { class: 'fn-btn', text: more ? 'Night ' + next : 'Menu' });
      btn.onclick = function () { more ? startNight(next) : title(); };
      var menu = h('button', { class: 'fn-btn small', text: 'Menu' });
      menu.onclick = title;
      mount.appendChild(h('div', { class: 'fn-screen on', id: 'fn-win' }, [
        h('h1', { class: 'fn-title', text: cfg.text.win }),
        h('div', { class: 'fn-sub', text: cfg.text.winSub }),
        h('div', { style: 'margin-top:26px' }, [btn, menu])
      ]));
    }

    function lose(res) {
      clear();
      var again = h('button', { class: 'fn-btn', text: 'Retry Night ' + res.night });
      again.onclick = function () { startNight(res.night); };
      var menu = h('button', { class: 'fn-btn small', text: 'Menu' });
      menu.onclick = title;
      mount.appendChild(h('div', { class: 'fn-screen on', id: 'fn-lose' }, [
        h('h1', { class: 'fn-title', text: cfg.text.lose }),
        h('div', { class: 'fn-sub', text: res.killer ? 'Caught by ' + res.killer.name : cfg.text.loseSub }),
        h('div', { style: 'margin-top:26px' }, [again, menu])
      ]));
    }

    // static overlay texture (generated once, no external asset)
    try {
      var tile = FNAF.Render.staticTile(64, 255);
      var sty = document.createElement('style');
      sty.textContent = '.fn-static{background-image:url(' + tile + ')}';
      document.head.appendChild(sty);
    } catch (e) {}

    title();
    return { title: title, startNight: startNight, cfg: cfg };
  };

  /* auto-boot for exported games */
  FNAF.autoBoot = function () {
    var mount = document.getElementById('fnaf-root');
    if (mount && root.GAME_DATA) FNAF.boot(mount, root.GAME_DATA);
  };
});
