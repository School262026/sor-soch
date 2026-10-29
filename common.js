// Ортақ: тіл ауыстыру, жоғарғы панель, localStorage көмекшілері
(function () {
  const LANGS = ['kk', 'ru'];
  const LABELS = { kk: 'ҚАЗ', ru: 'РУС' };

  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function pickLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = store.get('mt-lang');
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'kk').slice(0, 2);
    return nav === 'ru' || q === 'en' ? 'ru' : 'kk';
  }

  const COMMON = {
    home: { kk: 'Мұғалім құралдары', ru: 'Инструменты учителя', en: 'Teacher Tools' },
    footer: {
      kk: 'Тегін. Тіркелусіз. Деректер тек сіздің құрылғыңызда сақталады.',
      ru: 'Бесплатно. Без регистрации. Данные хранятся только на вашем устройстве.',
      en: 'Free. No sign-up. Data stays on your device only.'
    }
  };

  const App = {
    lang: pickLang(),
    dict: {},
    store,
    t(key) {
      const e = App.dict[key] || COMMON[key];
      if (!e) return key;
      return e[App.lang] != null ? e[App.lang] : e.kk;
    },
    // {kk,ru,en} нысанынан мәтін алу
    tx(obj) { return obj == null ? '' : typeof obj === 'string' ? obj : (obj[App.lang] != null ? obj[App.lang] : obj.kk); },
    apply(root) {
      root = root || document;
      root.querySelectorAll('[data-i]').forEach(el => { el.textContent = App.t(el.dataset.i); });
      root.querySelectorAll('[data-ih]').forEach(el => { el.innerHTML = App.t(el.dataset.ih); });
      root.querySelectorAll('[data-ip]').forEach(el => { el.placeholder = App.t(el.dataset.ip); });
      root.querySelectorAll('[data-it]').forEach(el => { el.title = App.t(el.dataset.it); });
      document.documentElement.lang = App.lang;
      if (App.dict.pageTitle) document.title = App.t('pageTitle') + ' · ' + App.t('home');
      document.querySelectorAll('.langs button').forEach(b => b.classList.toggle('on', b.dataset.l === App.lang));
    },
    setLang(l) {
      App.lang = l; store.set('mt-lang', l);
      const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState(null, '', u);
      App.apply();
      App.onLang.forEach(fn => fn(l));
    },
    onLang: [],
    // pageKey — бет атауының кілті; bar=false болса панель салынбайды
    init(dict, opts) {
      App.dict = dict || {};
      opts = opts || {};
      if (opts.bar !== false) {
        const bar = document.createElement('header');
        bar.className = 'topbar';
        bar.innerHTML =
          '<a class="home" href="index.html"><span class="logo">✎</span><span data-i="home"></span></a>' +
          '<span class="title">' + (App.dict.pageTitle ? '<span data-i="pageTitle"></span>' : '') + '</span>' +
          '<div class="langs">' + LANGS.map(l => '<button type="button" data-l="' + l + '">' + LABELS[l] + '</button>').join('') + '</div>';
        document.body.prepend(bar);
      }
      document.querySelectorAll('.langs button').forEach(b => b.addEventListener('click', () => App.setLang(b.dataset.l)));
      if (opts.footer !== false) {
        const f = document.createElement('footer');
        f.className = 'footer';
        f.innerHTML = '<span data-i="footer"></span>';
        document.body.append(f);
      }
      App.apply();
      // ішкі сілтемелерге тілді қосу
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href$=".html"], a[href*=".html#"]');
        if (!a || a.target === '_blank') return;
        const u = new URL(a.href, location.href);
        if (u.origin !== location.origin) return;
        u.searchParams.set('lang', App.lang);
        a.href = u.toString();
      }, true);
    },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    // қарапайым дыбыс (файлсыз)
    beep(freq, dur, type) {
      try {
        App._ac = App._ac || new (window.AudioContext || window.webkitAudioContext)();
        const ac = App._ac, o = ac.createOscillator(), g = ac.createGain();
        o.type = type || 'sine'; o.frequency.value = freq || 880;
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (dur || 0.25));
        o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + (dur || 0.25) + 0.05);
      } catch (e) {}
    },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => App.beep(f, 0.35, 'triangle'), i * 180)); },
    fullscreen(el) {
      el = el || document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    }
  };
  window.App = App;
})();
