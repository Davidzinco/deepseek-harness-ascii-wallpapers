/* DeepSeek Harness animated ASCII themes runtime. All artwork and preferences stay on this device. */
function mountDshAsciiWallpapers(ctx, drawAsciiScene) {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  if (window.self !== window.top) return () => {};
  if (typeof window.__dshAsciiDispose === 'function') {
    try { window.__dshAsciiDispose(); } catch {}
  }
  if (window.__dshAsciiInstalled) return () => {};
  window.__dshAsciiInstalled = true;

  const KEY = 'dshAsciiWallpaperPreferences.v1';
  const THEME_PREFIX = 'dsh-ascii-wallpaper:';
  const themes = [
    {id:'clouds',name:'Cloud Drift',light:true,sky:'#b4d9ee',floor:'#cceaf8',beam:'#62b9f1',chrome:'#b7e1f3',panel:'#f1faff',card:'#f0faff',fg:'#203645',muted:'#476475',border:'#9bbdce',accent:'#367ca6',ink:'#fffef7',glyph:'#648798'},
    {id:'aurora',name:'Aurora',light:false,sky:'#061220',floor:'#0d2233',beam:'#1f6b62',chrome:'#0a1724',panel:'#0b1826',card:'#16283a',fg:'#e9f4f2',muted:'#a9c4c4',border:'#35506a',accent:'#7cf2b4',ink:'#7cf2b4',glyph:'#10202e'},
    {id:'lagoon',name:'Honu Lagoon',light:false,sky:'#286f70',floor:'#084d63',beam:'#45e0d9',chrome:'#1d6666',panel:'#103c45',card:'#225560',fg:'#effaf6',muted:'#bfdfdb',border:'#49868a',accent:'#a2e2c2',ink:'#e3dcaa',glyph:'#375957'},
    {id:'koi',name:'Koi Pond',light:false,sky:'#315c4f',floor:'#1c493e',beam:'#8ce2bd',chrome:'#2d584b',panel:'#193d34',card:'#315b4e',fg:'#f0f7e9',muted:'#c2d8c3',border:'#638c71',accent:'#dfc890',ink:'#ead0a1',glyph:'#475e39'},
    {id:'jelly',name:'Jellyfish',light:false,sky:'#0c2e3e',floor:'#07111f',beam:'#286db0',chrome:'#0b2c3e',panel:'#0b1520',card:'#172b39',fg:'#edf1f7',muted:'#b6c6d6',border:'#42566e',accent:'#e8a7d0',ink:'#bca5d2',glyph:'#2d3148'},
    {id:'boats',name:'Paper Boats',light:true,sky:'#badbd5',floor:'#d4e8df',beam:'#7ebdc1',chrome:'#c4dfd8',panel:'#f2faf5',card:'#f0f8f3',fg:'#263f3b',muted:'#49665e',border:'#a0bdb2',accent:'#3e7a71',ink:'#fffef2',glyph:'#69887c'},
    {id:'sakura',name:'Sakura',light:true,sky:'#f6dfe7',floor:'#fbeef2',beam:'#f3b8cc',chrome:'#f4dbe4',panel:'#fff7fa',card:'#fff4f7',fg:'#4a2d38',muted:'#7a5866',border:'#e2b8c7',accent:'#c2557d',ink:'#ffffff',glyph:'#a1576f'},
    {id:'fireflies',name:'Fireflies',light:false,sky:'#071a17',floor:'#102b21',beam:'#1b493a',chrome:'#0a1c17',panel:'#0b1b15',card:'#172c22',fg:'#f0f2df',muted:'#b9c8ad',border:'#425e48',accent:'#d5e59d',ink:'#d6df9c',glyph:'#374c2c'},
    {id:'moon',name:'Moonlit',light:false,sky:'#090c1a',floor:'#1e2c60',beam:'#263f91',chrome:'#101528',panel:'#0d1224',card:'#1e263c',fg:'#edf0fa',muted:'#bdc6df',border:'#465375',accent:'#ddd8ad',ink:'#8b9bc8',glyph:'#212943'},
    {id:'dunes',name:'Ember Dunes',light:false,sky:'#2b1534',floor:'#8a4a32',beam:'#c86a3e',chrome:'#231228',panel:'#1f1024',card:'#352032',fg:'#fbeadb',muted:'#d8b8a4',border:'#6a4352',accent:'#ffb46b',ink:'#ffd9a8',glyph:'#3a1f22'},
    {id:'rain',name:'Night Rain',light:false,sky:'#0a1120',floor:'#141d31',beam:'#24365a',chrome:'#0c1322',panel:'#0d1424',card:'#1a2438',fg:'#e8eef8',muted:'#aebbd2',border:'#3a4a68',accent:'#ffd27a',ink:'#8fb4e6',glyph:'#0d1526'},
    {id:'snow',name:'Snowfall',light:true,sky:'#c7d9e8',floor:'#eef4f9',beam:'#ffffff',chrome:'#d6e4ef',panel:'#f6fafd',card:'#f3f8fc',fg:'#1f3242',muted:'#4b6275',border:'#a9bfd0',accent:'#3a6f96',ink:'#ffffff',glyph:'#5e7d94'},
    {id:'lanterns',name:'Sky Lanterns',light:false,sky:'#0b1030',floor:'#141a40',beam:'#3a3470',chrome:'#0c1028',panel:'#0d1230',card:'#1b2146',fg:'#f4eee4',muted:'#c2bccf',border:'#3d4170',accent:'#ffb35c',ink:'#ffcf8a',glyph:'#1c1a3a'},
    {id:'meadow',name:'Windy Meadow',light:true,sky:'#cfe9f3',floor:'#dcefd0',beam:'#9fd38a',chrome:'#d4ebde',panel:'#f6fbf2',card:'#f3f9ee',fg:'#213a24',muted:'#4b6a4c',border:'#a9c9a0',accent:'#3f7f3a',ink:'#ffffff',glyph:'#5e8a52'},
    {id:'galaxy',name:'Spiral Galaxy',light:false,sky:'#06051a',floor:'#0e0a26',beam:'#3a2a7a',chrome:'#09071c',panel:'#0a081e',card:'#181436',fg:'#eeeaff',muted:'#b8b0d8',border:'#3c3570',accent:'#b9a3ff',ink:'#cbbcff',glyph:'#141030'},
    {id:'bamboo',name:'Bamboo Grove',light:true,sky:'#dcebdc',floor:'#e8f1e0',beam:'#b5d6a5',chrome:'#dbe9d6',panel:'#f6faf2',card:'#f2f8ee',fg:'#1f3520',muted:'#4d6a4a',border:'#a7c4a0',accent:'#3e7a36',ink:'#f4fbef',glyph:'#5f8754'},
    {id:'code',name:'Digital Rain',light:false,sky:'#020b06',floor:'#04140b',beam:'#0f5a2a',chrome:'#030d07',panel:'#04110a',card:'#0c2214',fg:'#d9ffe4',muted:'#8fc9a2',border:'#1f5a34',accent:'#5dff8a',ink:'#5dff8a',glyph:'#062a12'},
    {id:'tide',name:'Morning Tide',light:true,sky:'#fbe2d0',floor:'#cfe6ea',beam:'#ffd2b0',chrome:'#f5e0d4',panel:'#fffaf6',card:'#fdf6f0',fg:'#2a3440',muted:'#5a6670',border:'#d9c3b5',accent:'#2f7f95',ink:'#ffffff',glyph:'#7a8f99'},
    {id:'autumn',name:'Autumn Leaves',light:true,sky:'#f6e3c8',floor:'#efd3b0',beam:'#f0b070',chrome:'#f2dcc0',panel:'#fff8ef',card:'#fdf3e6',fg:'#3a2416',muted:'#6e5040',border:'#ddb994',accent:'#c0502a',ink:'#fff6e8',glyph:'#9a6040'},
    {id:'alpine',name:'Alpine Dawn',light:true,sky:'#d6cfee',floor:'#f8e2d4',beam:'#f3c9c6',chrome:'#e2d9f0',panel:'#fbf8ff',card:'#f7f3fd',fg:'#2a2545',muted:'#5a5478',border:'#c4b9de',accent:'#6a5aa8',ink:'#ffffff',glyph:'#8a80b4'},
    {id:'retro',name:'Retro Sunset',light:false,sky:'#0d0221',floor:'#1a0630',beam:'#7a1f8a',chrome:'#10032a',panel:'#10042a',card:'#22104a',fg:'#fbeaff',muted:'#d0b4e0',border:'#5a2a7a',accent:'#ff5ad8',ink:'#ff7ad8',glyph:'#2a0a3a'},
    {id:'lava',name:'Lava Lamp',light:false,sky:'#1a0726',floor:'#3a0d22',beam:'#8a2a3a',chrome:'#16061e',panel:'#170620',card:'#2c1230',fg:'#ffeede',muted:'#d8b4b4',border:'#5e2a44',accent:'#ff9a3c',ink:'#ffb070',glyph:'#2a0a18'},
    {id:'catnap',name:'Starry Catnap',light:false,sky:'#070a24',floor:'#1a1a50',beam:'#4b3fb0',chrome:'#0a0c28',panel:'#0b0e2a',card:'#1b1e44',fg:'#f1eeff',muted:'#bfbcdc',border:'#3f4078',accent:'#f0a95e',ink:'#ffc88a',glyph:'#1b1f4a'},
    {id:'supercell',name:'Supercell',light:false,sky:'#262a18',floor:'#3a3820',beam:'#8a8a4a',chrome:'#22261a',panel:'#262a1c',card:'#363a26',fg:'#f6f4dc',muted:'#c8c6a0',border:'#5a5e3a',accent:'#ecd070',ink:'#f4f0b0',glyph:'#383c22'},
    {id:'vents',name:'Black Smokers',light:false,sky:'#040303',floor:'#140a08',beam:'#6a2a14',chrome:'#080505',panel:'#0a0706',card:'#1a1412',fg:'#fff2e6',muted:'#c8b4a8',border:'#3a2a24',accent:'#ff8a3a',ink:'#ffb040',glyph:'#1e1614'},
    {id:'candles',name:'Candlelight',light:false,sky:'#120804',floor:'#2e1a0c',beam:'#6a4018',chrome:'#140a05',panel:'#170c06',card:'#2a1a0e',fg:'#fff4e0',muted:'#d4bc98',border:'#4e3418',accent:'#ffc878',ink:'#ffd474',glyph:'#2a1a0e'},
    {id:'neon',name:'Neon Alley',light:false,sky:'#05030c',floor:'#120a20',beam:'#6a2aa0',chrome:'#08050f',panel:'#0a0614',card:'#1a1230',fg:'#f6eeff',muted:'#c4b4e0',border:'#44306e',accent:'#ff3fbf',ink:'#3ff0ff',glyph:'#150d24'},
    {id:'blackhole',name:'Black Hole',light:false,sky:'#04020a',floor:'#0a0614',beam:'#5a2a4a',chrome:'#06040c',panel:'#080610',card:'#18121e',fg:'#fff4e8',muted:'#cdb8b0',border:'#3e2a3a',accent:'#ffc46a',ink:'#ffc46a',glyph:'#120a12'},
    {id:'volcano',name:'Volcano',light:false,sky:'#0c0610',floor:'#2a0e10',beam:'#8a2a1a',chrome:'#100810',panel:'#120a12',card:'#261418',fg:'#ffeee2',muted:'#d4b4a8',border:'#5a2e2a',accent:'#ffa040',ink:'#ffa040',glyph:'#1e0e10'},
    {id:'starry',name:'Swirling Night',light:false,sky:'#10245e',floor:'#0c1838',beam:'#24458e',chrome:'#0e1e4a',panel:'#10204e',card:'#1c3266',fg:'#f6f4e0',muted:'#bccae8',border:'#3a5aa0',accent:'#ffd84a',ink:'#ffd84a',glyph:'#24458e'},
    {id:'radar',name:'Radar Scope',light:false,sky:'#0c0702',floor:'#160c03',beam:'#6a4612',chrome:'#0e0803',panel:'#110a04',card:'#22160a',fg:'#fff2c4',muted:'#d4b880',border:'#4a3210',accent:'#ffc24a',ink:'#ffc24a',glyph:'#2e1e08'},
    {id:'saturn',name:'Ice Giant',light:false,sky:'#020a12',floor:'#05182a',beam:'#145a7a',chrome:'#030c16',panel:'#04101c',card:'#0e2030',fg:'#effdff',muted:'#a8d4e2',border:'#1e4a62',accent:'#6cd0e6',ink:'#b4f0fa',glyph:'#0e2a3e'},
    {id:'kelp',name:'Kelp Forest',light:false,sky:'#2a6e9e',floor:'#061c3a',beam:'#14385a',chrome:'#0a2440',panel:'#0c2846',card:'#163a5c',fg:'#eef6ff',muted:'#a8c4dc',border:'#2e5478',accent:'#f0cc64',ink:'#d4a83c',glyph:'#14385a'},
    {id:'glitch',name:'Signal Glitch',light:false,sky:'#050508',floor:'#0a0a12',beam:'#34344a',chrome:'#07070c',panel:'#09090e',card:'#18181f',fg:'#ffffff',muted:'#b4b4c8',border:'#34344a',accent:'#ff2a6a',ink:'#2af0ff',glyph:'#20202e'},
    {id:'peacock',name:'Peacock Feathers',light:false,sky:'#04100e',floor:'#081e1c',beam:'#14806e',chrome:'#06120f',panel:'#071613',card:'#102a26',fg:'#eefff6',muted:'#a4d4c4',border:'#1e5048',accent:'#f4d860',ink:'#38d0bc',glyph:'#0e3430'},
    {id:'blueprint',name:'Blueprint',light:false,sky:'#0f3c8c',floor:'#0a2c6c',beam:'#5a86d0',chrome:'#0d3478',panel:'#0e387e',card:'#1a4892',fg:'#ffffff',muted:'#cfe2ff',border:'#5a86d0',accent:'#ffd84a',ink:'#cfe2ff',glyph:'#2a5aa8'},
    {id:'stainedglass',name:'Stained Glass',light:false,sky:'#1e1814',floor:'#2a221c',beam:'#5a4c44',chrome:'#1a1511',panel:'#1e1814',card:'#2e2620',fg:'#fff4d0',muted:'#d4c4a8',border:'#4a3e34',accent:'#f0b02a',ink:'#f0b02a',glyph:'#3a302c'},
    {id:'inkwash',name:'Ink Wash',light:true,sky:'#f3eee2',floor:'#e9e2d2',beam:'#d8d2c4',chrome:'#ece6d8',panel:'#faf8f2',card:'#f3efe4',fg:'#1e1e1e',muted:'#5a5a58',border:'#cfc8b8',accent:'#c4302a',ink:'#ffffff',glyph:'#8e8e8e'},
    {id:'glacier',name:'Ice Cave',light:true,sky:'#d8ecf8',floor:'#cfe6f0',beam:'#aee0f6',chrome:'#d4eaf4',panel:'#f4fbff',card:'#eaf6fc',fg:'#123a54',muted:'#3e6680',border:'#9ccbe2',accent:'#1e88c8',ink:'#ffffff',glyph:'#5a8aa8'},
    {id:'balloons',name:'Hot Air Balloons',light:true,sky:'#f2c4dc',floor:'#eef4dc',beam:'#ffe2ee',chrome:'#f2dce6',panel:'#fffaf8',card:'#fdf2f4',fg:'#3a2a32',muted:'#6e5a64',border:'#e0c4d0',accent:'#e0508a',ink:'#ffffff',glyph:'#a07888'},
    {id:'reef',name:'Coral Reef',light:true,sky:'#6ad4e6',floor:'#c4eeee',beam:'#a8f0f4',chrome:'#bfe8ee',panel:'#f2fcfc',card:'#eaf8f8',fg:'#1e3a44',muted:'#486a74',border:'#9ccad2',accent:'#e0506a',ink:'#ffffff',glyph:'#5a8a94'},
    {id:'popart',name:'Pop Art',light:true,sky:'#fff4d4',floor:'#ffeec4',beam:'#ffe02a',chrome:'#fff0c8',panel:'#fffbec',card:'#fff6dc',fg:'#111111',muted:'#4a4a4a',border:'#111111',accent:'#ff2a2a',ink:'#ffffff',glyph:'#2a64ff'},
    {id:'cranes',name:'Paper Cranes',light:true,sky:'#e6ddf0',floor:'#fbf3e6',beam:'#f4c8d4',chrome:'#ece4ee',panel:'#fdfaff',card:'#f8f2f8',fg:'#3a2e3e',muted:'#6a5a6e',border:'#d4c4d8',accent:'#c8506e',ink:'#ffffff',glyph:'#8a7a8e'},
    {id:'tea',name:'Matcha',light:true,sky:'#f4f0e2',floor:'#e6dcc4',beam:'#c4dc84',chrome:'#ece6d4',panel:'#fbf9f0',card:'#f4efe0',fg:'#24201c',muted:'#5e5446',border:'#d4c8a8',accent:'#6e9a2e',ink:'#ffffff',glyph:'#8a7a5a'},
    {id:'oasis',name:'Desert Oasis',light:true,sky:'#f6d8a0',floor:'#f0d8a0',beam:'#ffe6b0',chrome:'#f2e0bc',panel:'#fffaee',card:'#fcf2de',fg:'#3a2c1a',muted:'#6e5a3e',border:'#dcc49a',accent:'#2e8a6a',ink:'#ffffff',glyph:'#9a8058'},
    {id:'lavender',name:'Lavender Fields',light:true,sky:'#ffd8c4',floor:'#e8cce8',beam:'#e4c4f0',chrome:'#f0dce6',panel:'#fdf8fc',card:'#f8eef6',fg:'#36283e',muted:'#685874',border:'#d6bed8',accent:'#8a5ac8',ink:'#ffffff',glyph:'#8a7a96'},
    {id:'windmills',name:'Windmills',light:true,sky:'#aeb4bf',floor:'#eeede6',beam:'#d9dce2',chrome:'#dcdee2',panel:'#f8f8f6',card:'#f0f0ec',fg:'#22262c',muted:'#50565e',border:'#b8bcc4',accent:'#e04a5a',ink:'#ffffff',glyph:'#6a707a'},
    {id:'island',name:'Island Palms',light:true,sky:'#7ccaf0',floor:'#2aa0c0',beam:'#a8e8f0',chrome:'#c4e6f2',panel:'#f2fbfe',card:'#eaf6fa',fg:'#16323e',muted:'#40606c',border:'#94c4d4',accent:'#1a8ab0',ink:'#ffffff',glyph:'#4e7a88'},
    {id:'opart',name:'Moire',light:true,sky:'#f7f7f3',floor:'#efefea',beam:'#dcdcd6',chrome:'#efefea',panel:'#fbfbf8',card:'#f2f2ee',fg:'#121212',muted:'#555555',border:'#cfcfc8',accent:'#e23a3a',ink:'#ffffff',glyph:'#444444'},
    {id:'zen',name:'Zen Garden',light:true,sky:'#f4ece0',floor:'#ece2d2',beam:'#e8dcc8',chrome:'#ece4d8',panel:'#fbf8f2',card:'#f6f0e6',fg:'#2e2a22',muted:'#625a4c',border:'#d4c8b4',accent:'#5a8a4a',ink:'#ffffff',glyph:'#8a8270'}
  ];

  const reduced = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener() {}, removeEventListener() {} };
  const GLYPHS = ['ascii', 'braille', 'blocks', 'katakana'];
  const SCALES = ['fine', 'normal', 'chunky'];
  let prefs = { theme: 'clouds', intensity: 100, paused: !!reduced.matches, reactive: true, recolor: true, glyphs: 'ascii', scale: 'normal' };

  let alive = true, suspended = false, open = false;
  let frameEl = null, canvas = null, ctx2d = null, host = null, shadow = null, style = null;
  let observer = null, resizeObserver = null;
  let sceneWidth = 0, sceneHeight = 0, calmBox = null;
  let raf = 0, last = 0, time = 0, layoutTimer = 0, resizeRaf = 0, previewRaf = 0, lastPreview = -1;
  const cleanups = [];

  // Agent activity: energy eases toward 1 while sessions run; pulse is a one-shot ripple when one finishes.
  let agents = 0, energy = 0, pulse = 0;

  // ThemeRuntime integration via Cordis
  let themeService = null;
  let savedBasePreference = null;
  let activeThemeDispose = null;
  let activeThemeId = null;

  const current = () => themes.find(t => t.id === prefs.theme) || themes[0];
  function validate(p) {
    return {
      theme: p?.theme === 'off' || themes.some(t => t.id === p?.theme) ? p.theme : 'clouds',
      intensity: Number.isFinite(p?.intensity) ? Math.min(100, Math.max(15, p.intensity)) : 100,
      paused: typeof p?.paused === 'boolean' ? p.paused : !!reduced.matches,
      reactive: p?.reactive !== false,
      recolor: p?.recolor !== false,
      glyphs: GLYPHS.includes(p?.glyphs) ? p.glyphs : 'ascii',
      scale: SCALES.includes(p?.scale) ? p.scale : 'normal'
    };
  }

  const make = (tag, attrs = {}, text = '') => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text) e.textContent = text;
    return e;
  };
  function listen(e, name, fn, options) {
    if (!e || typeof e.addEventListener !== 'function') return;
    e.addEventListener(name, fn, options);
    cleanups.push(() => e.removeEventListener(name, fn, options));
  }

  function loadSavedPrefs() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
      if (raw) prefs = validate(JSON.parse(raw));
    } catch {}
  }
  function save() {
    const err = shadow?.querySelector('.save-error');
    const tr = shadow?.querySelector('.trigger');
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(prefs));
      if (err) { err.hidden = true; err.textContent = ''; }
      if (tr) { tr.removeAttribute('data-save-error'); tr.title = triggerTitle; }
    } catch {
      const msg = 'Could not save this theme. Please try again.';
      if (err) { err.textContent = msg; err.hidden = false; }
      if (tr) { tr.setAttribute('data-save-error', ''); tr.title = msg; }
      const st = shadow?.querySelector('.status');
      if (st) st.textContent = msg;
    }
  }

  function onAgents(n) {
    if (!Number.isFinite(n) || n < 0) return;
    const previous = agents;
    agents = n;
    if (n < previous && prefs.reactive && !prefs.paused && prefs.theme !== 'off') pulse = 1;
    schedule();
  }

  function bindSessionStatus(sessionService) {
    const obs = sessionService?.sessionStatus;
    if (!obs || typeof obs.getSnapshot !== 'function' || typeof obs.subscribe !== 'function') return () => {};
    const updateCount = () => {
      if (!alive || suspended) return;
      try {
        const snap = obs.getSnapshot();
        let count = 0;
        if (snap && typeof snap.values === 'function') {
          for (const st of snap.values()) if (st && st.running === true) count++;
        }
        onAgents(count);
      } catch {}
    };
    const unsub = obs.subscribe(updateCount);
    updateCount();
    return () => { try { unsub?.(); } catch {} };
  }

  function dswTokenMap(t) {
    const glassPanel = `color-mix(in srgb, ${t.panel} 88%, transparent)`;
    const glassCard = `color-mix(in srgb, ${t.card} 86%, transparent)`;
    const glassSidebar = `color-mix(in srgb, ${t.chrome} 40%, transparent)`;
    const activeRow = `color-mix(in srgb, ${t.accent} 20%, ${t.panel})`;
    const hoverRow = `color-mix(in srgb, ${t.fg} 8%, transparent)`;
    return {
      '--dsw-alias-bg-base': 'transparent',
      '--dsw-alias-bg-layer-1': glassPanel,
      '--dsw-alias-bg-layer-2': glassCard,
      '--dsw-alias-bg-layer-3': t.card,
      '--dsw-alias-bg-module-platform': activeRow,
      '--dsw-alias-bg-overlay': t.panel,
      '--dsw-alias-card-fill': glassCard,
      '--dsw-alias-card-fill-hover': `color-mix(in srgb, ${t.accent} 12%, ${t.card})`,
      '--dsw-alias-card-tile-fill': glassCard,
      '--dsw-alias-border-l1': `color-mix(in srgb, ${t.border} 28%, transparent)`,
      '--dsw-alias-border-l2': `color-mix(in srgb, ${t.border} 48%, transparent)`,
      '--dsw-alias-border-l3': `color-mix(in srgb, ${t.border} 65%, transparent)`,
      '--dsw-alias-border-l4': t.border,
      '--dsw-alias-border-selected': t.accent,
      '--dsw-alias-label-primary': t.fg,
      '--dsw-alias-label-primary-dimmed': t.fg,
      '--dsw-alias-label-secondary': t.muted,
      '--dsw-alias-label-tertiary': t.muted,
      '--dsw-alias-label-caption': t.muted,
      '--dsw-alias-label-dimmed': `color-mix(in srgb, ${t.muted} 65%, transparent)`,
      '--dsw-alias-link': t.accent,
      '--dsw-alias-brand-primary': t.accent,
      '--dsw-alias-brand-text': t.accent,
      '--dsw-alias-button-primary-fill': t.accent,
      '--dsw-alias-button-primary-hover': `color-mix(in srgb, ${t.accent} 85%, ${t.fg})`,
      '--dsw-alias-interactive-bg-hover': hoverRow,
      '--dsw-alias-interactive-bg-active': activeRow,
      '--dsw-alias-scrollbar-bg-l1': `color-mix(in srgb, ${t.muted} 28%, transparent)`,
      '--dsw-alias-scrollbar-bg-l2': `color-mix(in srgb, ${t.muted} 34%, transparent)`,
      '--dsw-alias-scrollbar-hover-l1': `color-mix(in srgb, ${t.muted} 52%, transparent)`,
      '--dsw-alias-scrollbar-hover-l2': `color-mix(in srgb, ${t.muted} 58%, transparent)`,
      '--dsw-specific-sidebar-fill': t.chrome,
      '--dsw-specific-sidebar-tint': glassSidebar,
      '--dsw-specific-sidebar-nav-item-active': activeRow,
      '--dsw-specific-sidebar-nav-item-active-accent': activeRow,
      '--dsw-specific-input-major': glassCard,
      '--dsw-specific-menu': glassPanel,
      '--dsw-specific-bubble': glassCard,
      '--dsw-specific-bubble-highlight': activeRow,
      '--dsw-specific-selector': glassCard
    };
  }

  function restoreThemeRuntime() {
    const prevDispose = activeThemeDispose;
    activeThemeDispose = null;
    activeThemeId = null;
    if (themeService && savedBasePreference) {
      try {
        const snap = themeService.getTheme?.();
        if (snap?.preference?.startsWith(THEME_PREFIX)) {
          themeService.setTheme(savedBasePreference);
        }
      } catch {}
    }
    if (prevDispose) {
      try { prevDispose(); } catch {}
    }
  }

  function syncThemeRuntime(t, full) {
    if (!themeService) return;
    if (!full) {
      restoreThemeRuntime();
      return;
    }
    try {
      const snap = themeService.getTheme?.();
      if (!savedBasePreference) {
        const pref = snap?.preference;
        savedBasePreference = pref && !String(pref).startsWith(THEME_PREFIX) ? pref : 'system';
      }
      const nextId = `${THEME_PREFIX}${t.id}`;
      if (activeThemeId === nextId) return;
      const prevDispose = activeThemeDispose;
      const tokens = dswTokenMap(t);
      const disposeNew = themeService.register({
        id: nextId,
        colorScheme: t.light ? 'light' : 'dark',
        tokens
      });
      activeThemeId = nextId;
      activeThemeDispose = disposeNew;
      themeService.setTheme(nextId);
      if (prevDispose) {
        try { prevDispose(); } catch {}
      }
    } catch {}
  }

  function hostIsLight() {
    if (document.body?.hasAttribute('data-ds-dark-theme')) return false;
    const source = document.documentElement?.getAttribute('data-ds-theme-source');
    if (source === 'light') return true;
    if (source === 'dark') return false;
    try {
      const bg = getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim()
        || getComputedStyle(document.body).backgroundColor;
      const m = bg.match(/^#([0-9a-f]{3,8})$/i);
      if (m) {
        let h = m[1];
        if (h.length === 3) h = h.replace(/./g, c => c + c);
        if (h.length >= 6) {
          const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
          return (0.299 * r + 0.587 * g + 0.114 * b) > 128;
        }
      }
      const rgb = bg.match(/rgb\w*\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
      if (rgb) return (0.299 * rgb[1] + 0.587 * rgb[2] + 0.114 * rgb[3]) > 128;
    } catch {}
    return !reduced.matches && typeof matchMedia === 'function' ? !matchMedia('(prefers-color-scheme: dark)').matches : false;
  }

  function hostPalette(off, t) {
    if (!off) return t;
    return hostIsLight()
      ? { panel: '#ffffff', card: '#f4f4f5', fg: '#18181b', muted: '#52525b', border: '#d4d4d8', accent: '#2563eb' }
      : { panel: '#18181b', card: '#27272a', fg: '#f4f4f5', muted: '#a1a1aa', border: '#3f3f46', accent: '#60a5fa' };
  }

  function appearance(t, off) {
    const full = !off && prefs.recolor;
    syncThemeRuntime(t, full);
    const viewerReset = `
      body[data-dsh-aw-theme] [data-composer-card],
      body[data-dsh-aw-theme] iframe,
      body[data-dsh-aw-theme] embed,
      body[data-dsh-aw-theme] object,
      body[data-dsh-aw-theme] .pdfViewer,
      body[data-dsh-aw-theme] .textLayer,
      body[data-dsh-aw-theme] [class*="pdf" i],
      body[data-dsh-aw-theme] [class*="pdf" i] *,
      body[data-dsh-aw-theme] .monaco-editor,
      body[data-dsh-aw-theme] .monaco-editor *,
      body[data-dsh-aw-theme] pre,
      body[data-dsh-aw-theme] code,
      body[data-dsh-aw-theme] .shiki {
        text-shadow: none !important;
      }
      body[data-dsh-aw-theme] iframe,
      body[data-dsh-aw-theme] embed,
      body[data-dsh-aw-theme] object,
      body[data-dsh-aw-theme] .pdfViewer,
      body[data-dsh-aw-theme] [class*="pdf" i] {
        isolation: isolate;
        color: initial;
      }
    `;
    if (off) {
      delete document.body.dataset.dshAwTheme;
      delete document.body.dataset.dshAwMode;
      style.textContent = '';
      if (host) host.style.colorScheme = hostIsLight() ? 'light' : 'dark';
    } else {
      document.body.dataset.dshAwTheme = t.id;
      if (full) document.body.dataset.dshAwMode = t.light ? 'light' : 'dark';
      else delete document.body.dataset.dshAwMode;
      if (host) host.style.colorScheme = t.light ? 'light' : 'dark';

      const halo = t.light ? t.floor : t.sky;
      const tokens = full ? Object.entries(dswTokenMap(t)).map(([k, v]) => `${k}:${v}!important`).join(';') : '';
      const glassSidebar = `color-mix(in srgb, ${t.chrome} 34%, transparent)`;
      const glassCard = `color-mix(in srgb, ${t.card} 82%, transparent)`;
      const glassMenu = `color-mix(in srgb, ${t.panel} 90%, transparent)`;

      style.textContent = `
        ${full ? `body[data-dsh-aw-theme] { ${tokens}; color-scheme: ${t.light ? 'light' : 'dark'}; color: ${t.fg}; }` : ''}
        body[data-dsh-aw-theme] [data-dsh-aw-frame] {
          position: relative !important;
          isolation: isolate !important;
          background: transparent !important;
          background-color: transparent !important;
        }
        body[data-dsh-aw-theme] [data-dsh-aw-frame] > div {
          background-color: transparent !important;
        }
        body[data-dsh-aw-theme] [data-phase="hero"],
        body[data-dsh-aw-theme] [data-conversation-scroll],
        body[data-dsh-aw-theme] [data-global-panel] {
          background: transparent !important;
          background-color: transparent !important;
        }
        body[data-dsh-aw-theme] [data-home-whale] {
          opacity: 0 !important;
        }
        body[data-dsh-aw-theme] [data-dsh-aw-frame] > div:first-of-type > aside,
        body[data-dsh-aw-theme] [data-dsh-aw-frame] nav,
        body[data-dsh-aw-theme] [data-dsh-aw-frame] > div:first-of-type {
          ${full ? '' : ''}
        }
        body[data-dsh-aw-theme] [data-composer-card] {
          background: ${glassCard} !important;
          border-color: color-mix(in srgb, ${t.border} 55%, transparent) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          box-shadow: 0 10px 32px rgba(0,0,0,0.22), 0 0 0 1px color-mix(in srgb, ${t.accent} 18%, transparent) !important;
        }
        body[data-dsh-aw-theme] [role="menu"],
        body[data-dsh-aw-theme] [role="dialog"],
        body[data-dsh-aw-theme] [role="listbox"] {
          background-color: ${glassMenu} !important;
          backdrop-filter: blur(22px) !important;
          -webkit-backdrop-filter: blur(22px) !important;
          border-color: color-mix(in srgb, ${t.border} 50%, transparent) !important;
        }
        body[data-dsh-aw-theme] [data-dsh-aw-frame] > :nth-child(2):not([data-shell-bottom]):not([data-shell-overlay]):not([data-shell-leading]),
        body[data-dsh-aw-theme] [data-dsh-aw-frame] aside {
          background-color: ${glassSidebar} !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        body[data-dsh-aw-theme] [data-conversation-scroll] {
          text-shadow: 0 0 2px ${halo}, 0 0 6px ${halo}, 0 0 12px ${halo};
        }
        ${viewerReset}
      `;
    }
    const ui = hostPalette(off, t);
    if (host) {
      for (const k of ['panel', 'card', 'fg', 'muted', 'border', 'accent']) {
        host.style.setProperty('--aw-' + k, ui[k]);
      }
    }
  }

  const paletteIcon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>';
  const closeIcon = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
  const isMac = typeof navigator !== 'undefined' && (/(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || '') || /Mac/i.test(navigator.userAgent || ''));
  const triggerTitle = 'Themes · ' + (isMac ? '⌥⌘W' : 'Ctrl+Alt+W');

  function build() {
    host = make('div', { id: 'dsh-ascii-controls' });
    if (isMac) host.setAttribute('data-platform', 'darwin');
    host.style.visibility = 'hidden';
    document.body.append(host);
    shadow = host.attachShadow({ mode: 'open' });
    const css = make('style');
    css.textContent = `
      :host{all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483000;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:var(--aw-fg,#edf0fa);--aw-panel:#0d1224;--aw-card:#1e263c;--aw-fg:#edf0fa;--aw-muted:#bdc6df;--aw-border:#465375;--aw-accent:#ddd8ad}
      *{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:2px solid var(--aw-accent);outline-offset:3px}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}
      .trigger{position:fixed;top:7px;right:154px;pointer-events:auto;-webkit-app-region:no-drag;display:flex;align-items:center;gap:6px;height:26px;padding:0 9px;border:1px solid transparent;border-radius:6px;color:var(--aw-fg);background:transparent;font-size:11.5px}
      :host([data-platform=darwin]) .trigger{right:20px;top:9px}
      .trigger:hover,.trigger[aria-expanded=true]{background:color-mix(in srgb,var(--aw-fg) 10%,transparent)}.trigger[data-save-error]{color:color-mix(in srgb,#ff5f5f 85%,var(--aw-fg))}
      .panel{position:fixed;top:46px;right:8px;bottom:8px;width:min(340px,calc(100vw - 24px));display:flex;flex-direction:column;gap:10px;pointer-events:auto;-webkit-app-region:no-drag;padding:12px;border:1px solid var(--aw-border);border-radius:10px;background:color-mix(in srgb,var(--aw-panel) 94%,transparent);backdrop-filter:blur(18px);color:var(--aw-fg);box-shadow:0 12px 40px #00000030}
      .panel:not([hidden]){animation:aw-in .18s ease-out}@keyframes aw-in{from{opacity:0;transform:translateX(18px)}}
      .header{display:flex;align-items:center;gap:8px;height:24px;font-size:13px;white-space:nowrap}.header strong{font-weight:600}.count{color:var(--aw-muted);font-size:11px;font-variant-numeric:tabular-nums}
      .now{display:flex;align-items:baseline;gap:8px;min-height:16px;font-size:12px;white-space:nowrap}.current{overflow:hidden;text-overflow:ellipsis}.kind{color:var(--aw-muted);font-size:11px}.spacer{flex:1}
      .tools{display:flex;gap:2px}.tool{display:flex;align-items:center;justify-content:center;height:22px;padding:0 7px;border:0;border-radius:4px;color:var(--aw-muted);background:none;font-size:11px}.tool:hover{color:var(--aw-fg);background:color-mix(in srgb,var(--aw-fg) 8%,transparent)}.tool[aria-pressed=true]{color:var(--aw-fg)}
      .find{display:flex;gap:6px}.search{flex:1;min-width:0;height:28px;padding:0 10px;border:1px solid var(--aw-border);border-radius:6px;background:var(--aw-card);color:var(--aw-fg);font:inherit;font-size:12px}.search::placeholder{color:var(--aw-muted)}.search:focus-visible{outline:2px solid var(--aw-accent);outline-offset:1px}
      .shuffle{height:28px;padding:0 10px;border:1px solid var(--aw-border);border-radius:6px;background:var(--aw-card);color:var(--aw-fg);font-size:11px}.shuffle:hover{border-color:var(--aw-accent)}
      .filters{display:flex;padding:2px;border-radius:7px;background:color-mix(in srgb,var(--aw-fg) 7%,transparent)}.filter{flex:1;height:24px;border:0;border-radius:5px;background:none;color:var(--aw-muted);font-size:11px}.filter[aria-pressed=true]{background:var(--aw-card);color:var(--aw-fg);box-shadow:0 1px 3px #0000001f}
      .choices{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:12px 10px;padding:3px 4px 4px 3px;scrollbar-width:thin}
      .choice{display:flex;flex-direction:column;gap:5px;padding:0;border:0;border-radius:6px;background:none;color:var(--aw-fg);text-align:left;min-width:0}.choice:focus-visible{outline-offset:3px}
      .preview{display:block;width:100%;aspect-ratio:8/5;height:auto;border-radius:6px;opacity:.85;transition:opacity .12s,transform .12s}.choice:hover .preview,.choice:focus-visible .preview,.choice[aria-pressed=true] .preview{opacity:1}.choice:hover .preview{transform:translateY(-1px)}
      .choice[aria-pressed=true] .preview{box-shadow:0 0 0 2px var(--aw-panel),0 0 0 4px var(--aw-accent)}
      .name{display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.2}.name span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name .kind{font-size:10px}
      .empty{grid-column:1/-1;padding:24px 0;text-align:center;color:var(--aw-muted);font-size:12px}
      .settings{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 2px 0;border-top:1px solid color-mix(in srgb,var(--aw-border) 60%,transparent);font-size:11px;color:var(--aw-muted)}.settings label{display:flex;align-items:center;gap:6px;white-space:nowrap}.settings input[type=range]{width:110px;accent-color:var(--aw-fg)}.settings input[type=checkbox]{margin:0;accent-color:var(--aw-fg)}.settings select{height:22px;padding:0 6px;border:1px solid var(--aw-border);border-radius:4px;background:var(--aw-card);color:var(--aw-fg);font:inherit;cursor:pointer}.settings select:focus-visible{outline:2px solid var(--aw-accent);outline-offset:2px}.value{font-variant-numeric:tabular-nums;min-width:28px}.save-error{padding:6px 8px;border:1px solid color-mix(in srgb,#ff5f5f 55%,transparent);border-radius:6px;background:color-mix(in srgb,#ff5f5f 14%,transparent);color:var(--aw-fg);font-size:11px}.status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
      @media(max-width:650px){.trigger span{display:none}.trigger{right:145px}.settings input[type=range]{width:100px}}
      @media(prefers-reduced-motion:reduce){.preview{transition:none}.panel:not([hidden]){animation:none}}
    `;
    shadow.append(css);

    const trigger = make('button', { class: 'trigger', type: 'button', 'aria-label': 'Choose theme', 'aria-expanded': 'false', 'aria-controls': 'theme-picker', title: triggerTitle });
    trigger.innerHTML = paletteIcon + '<span>Themes</span>';
    const panel = make('aside', { class: 'panel', id: 'theme-picker', 'aria-label': 'ASCII wallpaper themes', hidden: '' });
    const header = make('div', { class: 'header' });
    header.append(make('strong', {}, 'Themes'), make('span', { class: 'count' }, String(themes.length)), make('span', { class: 'spacer' }));
    const now = make('div', { class: 'now' });
    now.append(make('span', { class: 'current' }), make('span', { class: 'kind' }));
    const tools = make('div', { class: 'tools' });
    const pause = make('button', { class: 'tool pause', type: 'button', title: 'Pause or resume the wallpaper', 'aria-pressed': 'false' }, 'Pause');
    const settings = make('button', { class: 'tool settings-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'theme-settings' }, 'Adjust');
    const off = make('button', { class: 'tool reset', type: 'button', title: "Restore DeepSeek Harness's original appearance" }, 'Off');
    const close = make('button', { class: 'tool close', type: 'button', 'aria-label': 'Close theme picker' });
    close.innerHTML = closeIcon;
    tools.append(pause, settings, off, close);
    header.append(tools);

    const find = make('div', { class: 'find' });
    const search = make('input', { class: 'search', type: 'search', placeholder: `Search ${themes.length} themes`, 'aria-label': 'Search themes', spellcheck: 'false' });
    const shuffle = make('button', { class: 'shuffle', type: 'button', title: 'Pick a random theme' }, 'Shuffle');
    find.append(search, shuffle);

    const filters = make('div', { class: 'filters', role: 'group', 'aria-label': 'Filter themes' });
    for (const [id, name] of [['all', 'All'], ['light', 'Light'], ['dark', 'Dark']]) {
      filters.append(make('button', { class: 'filter', type: 'button', 'data-filter': id, 'aria-pressed': String(id === 'all') }, name));
    }
    panel.append(header, now, find, filters);

    const choices = make('div', { class: 'choices', 'aria-label': 'Themes' });
    for (const t of themes) {
      const b = make('button', { class: 'choice', type: 'button', 'data-theme': t.id, 'aria-pressed': 'false', 'aria-label': `${t.name}, ${t.light ? 'light' : 'dark'}` });
      const preview = make('canvas', { class: 'preview', width: '160', height: '100', 'aria-hidden': 'true' });
      const name = make('span', { class: 'name', 'aria-hidden': 'true' });
      name.append(make('span', {}, t.name), make('span', { class: 'kind' }, t.light ? 'Light' : 'Dark'));
      b.append(preview, name);
      listen(b, 'click', () => select(t.id));
      listen(b, 'pointerenter', () => label(t));
      listen(b, 'focus', () => label(t));
      choices.append(b);
    }
    const empty = make('div', { class: 'empty', hidden: '' }, 'No themes match');
    choices.append(empty);
    listen(choices, 'pointerleave', () => label());
    listen(choices, 'focusout', e => { if (!choices.contains(e.relatedTarget)) label(); });

    let filter = 'all';
    const applyFilter = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      for (const b of choices.querySelectorAll('.choice')) {
        const t = themes.find(x => x.id === b.dataset.theme);
        const hit = (filter === 'all' || (filter === 'light') === t.light) && (!q || t.name.toLowerCase().includes(q) || t.id.includes(q));
        b.hidden = !hit;
        shown += hit;
      }
      empty.hidden = shown > 0;
      previews(true);
    };
    listen(search, 'input', applyFilter);
    listen(search, 'keydown', e => {
      if (e.key !== 'Escape') e.stopPropagation();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        choices.querySelector('.choice:not([hidden])')?.focus();
      }
    });
    listen(filters, 'click', e => {
      const b = e.target.closest('.filter');
      if (!b) return;
      filter = b.dataset.filter;
      filters.querySelectorAll('.filter').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      applyFilter();
    });
    listen(shuffle, 'click', () => {
      const pool = [...choices.querySelectorAll('.choice:not([hidden])')].map(b => b.dataset.theme).filter(id => id !== prefs.theme);
      if (pool.length) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        select(id);
        shadow.querySelector(`[data-theme="${id}"]`)?.scrollIntoView({ block: 'nearest' });
      }
    });

    const adjust = make('div', { class: 'settings', id: 'theme-settings', hidden: '' });
    const intensity = make('label', {}, 'Intensity');
    const range = make('input', { type: 'range', min: '15', max: '100', step: '1', 'aria-label': 'Wallpaper intensity' });
    intensity.append(range);
    const glyphLabel = make('label', {}, 'Glyphs');
    const glyphSelect = make('select', { class: 'glyphs', 'aria-label': 'Character style' });
    for (const [id, name] of [['ascii', 'ASCII'], ['braille', 'Braille'], ['blocks', 'Blocks'], ['katakana', 'Katakana']]) {
      glyphSelect.append(make('option', { value: id }, name));
    }
    glyphLabel.append(glyphSelect);
    const scaleLabel = make('label', {}, 'Grid');
    const scaleSelect = make('select', { class: 'scale', 'aria-label': 'Grid density' });
    for (const [id, name] of [['fine', 'Fine'], ['normal', 'Normal'], ['chunky', 'Chunky']]) {
      scaleSelect.append(make('option', { value: id }, name));
    }
    scaleLabel.append(scaleSelect);
    const recolor = make('label', { title: 'Recolor the sidebar, composer and title bar to match the scene' }, 'Theme app');
    const recolorBox = make('input', { type: 'checkbox', class: 'recolor' });
    recolor.prepend(recolorBox);
    const reactive = make('label', { title: 'Speed up while agents run and ripple when one finishes' }, 'React to agents');
    const reactiveBox = make('input', { type: 'checkbox', class: 'reactive' });
    reactive.prepend(reactiveBox);
    adjust.append(intensity, make('span', { class: 'value' }), glyphLabel, scaleLabel, make('span', { class: 'spacer' }), recolor, reactive);

    panel.append(choices, adjust, make('div', { class: 'save-error', role: 'alert', hidden: '' }), make('div', { class: 'status', 'aria-live': 'polite' }));
    shadow.append(trigger, panel);

    listen(trigger, 'click', () => toggle(!open));
    listen(close, 'click', () => toggle(false));
    listen(off, 'click', () => select('off'));
    listen(pause, 'click', () => { prefs.paused = !prefs.paused; apply(); save(); });
    listen(settings, 'click', () => {
      adjust.hidden = !adjust.hidden;
      settings.setAttribute('aria-expanded', String(!adjust.hidden));
      syncLayout();
    });
    listen(range, 'input', () => {
      prefs.intensity = Number(range.value);
      shadow.querySelector('.value').textContent = prefs.intensity + '%';
      render();
    });
    listen(range, 'change', save);
    listen(glyphSelect, 'change', () => { prefs.glyphs = glyphSelect.value; render(); previews(true); save(); });
    listen(scaleSelect, 'change', () => { prefs.scale = scaleSelect.value; render(); save(); });
    listen(recolorBox, 'change', () => { prefs.recolor = recolorBox.checked; apply(); save(); });
    listen(reactiveBox, 'change', () => { prefs.reactive = reactiveBox.checked; if (!prefs.reactive) pulse = 0; save(); });

    listen(choices, 'keydown', e => {
      const all = [...choices.querySelectorAll('.choice:not([hidden])')];
      const i = all.indexOf(e.target.closest('.choice'));
      if (i < 0) return;
      let next = i;
      if (e.key === 'ArrowRight') next = Math.min(all.length - 1, i + 1);
      else if (e.key === 'ArrowLeft') next = Math.max(0, i - 1);
      else if (e.key === 'ArrowDown') next = Math.min(all.length - 1, i + 2);
      else if (e.key === 'ArrowUp') { if (i < 2) { e.preventDefault(); search.focus(); return; } next = i - 2; }
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = all.length - 1;
      else return;
      e.preventDefault();
      all[next].focus();
      all[next].scrollIntoView({ block: 'nearest' });
      select(all[next].dataset.theme);
    });

    listen(document, 'pointerdown', e => {
      if (e.composedPath().includes(host)) return;
      if (open) toggle(false, false);
    });
    listen(document, 'keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyW') {
        e.preventDefault(); e.stopPropagation(); toggle(!open);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault(); e.stopPropagation(); toggle(false);
      }
      const editor = e.target?.closest?.('[contenteditable=true],[contenteditable=""],textarea');
      if (e.key === 'Enter' && !e.shiftKey && editor) {
        const text = (editor.value ?? editor.textContent ?? '').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();
        const match = text.match(/^\/themes?(?:\s+(.+))?$/i);
        if (match) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (editor.matches('textarea')) {
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
            setter.call(editor, '');
            editor.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            const rangeObj = document.createRange?.(), sel = getSelection?.();
            if (rangeObj && sel) { rangeObj.selectNodeContents(editor); sel.removeAllRanges(); sel.addRange(rangeObj); }
            document.execCommand?.('delete');
          }
          const arg = match[1]?.trim().toLowerCase();
          if (!arg) toggle(true);
          else if (['off', 'reset', 'stock', 'default'].includes(arg)) select('off');
          else if (['random', 'shuffle'].includes(arg)) {
            const pool = themes.filter(t => t.id !== prefs.theme);
            select(pool[Math.floor(Math.random() * pool.length)].id);
          } else {
            const found = themes.find(t => t.id === arg || t.name.toLowerCase() === arg || t.name.toLowerCase().includes(arg));
            if (found) select(found.id); else toggle(true);
          }
        }
      }
    }, true);
  }

  function toggle(value, focus = true) {
    open = value;
    shadow.querySelector('.panel').hidden = !open;
    shadow.querySelector('.trigger').setAttribute('aria-expanded', String(open));
    syncLayout();
    if (open) {
      const active = shadow.querySelector(`[data-theme="${prefs.theme === 'off' ? 'clouds' : prefs.theme}"]`);
      const target = active && !active.hidden ? active : shadow.querySelector('.choice:not([hidden])') || shadow.querySelector('.search');
      target?.focus({ preventScroll: true });
      if (target?.classList?.contains('choice')) target.scrollIntoView({ block: 'nearest', inline: 'center' });
      previews(true);
    } else {
      stopPreviews();
      if (focus) shadow.querySelector('.trigger').focus();
    }
  }
  function select(id) { prefs.theme = id; apply(); save(); }
  function label(t = prefs.theme === 'off' ? null : current()) {
    shadow.querySelector('.current').textContent = t ? t.name : 'Original';
    shadow.querySelector('.kind').textContent = t ? (t.light ? 'Light' : 'Dark') : 'DeepSeek Harness';
  }

  function getTitlebarHeight() {
    const root = document.documentElement;
    if (root?.hasAttribute?.('data-windows-titlebar')) {
      try {
        const raw = getComputedStyle(root).getPropertyValue('--dsh-windows-titlebar-height').trim();
        const px = parseInt(raw, 10);
        if (Number.isFinite(px) && px > 0) return px;
      } catch {}
      return 40;
    }
    return 38;
  }

  function positionTrigger() {
    if (!shadow) return;
    const trigger = shadow.querySelector('.trigger');
    if (!trigger) return;
    const topH = getTitlebarHeight();
    trigger.style.top = Math.max(5, Math.round((topH - 26) / 2)) + 'px';
    trigger.style.right = isMac ? '20px' : '154px';
    const panel = shadow.querySelector('.panel');
    if (panel) panel.style.top = (topH + 6) + 'px';
  }

  function syncLayout(skipRender = false) {
    positionTrigger();
    if (!host || !frameEl || !frameEl.isConnected) return;
    const bounds = frameEl.getBoundingClientRect();
    const composerEl = frameEl.querySelector('[data-composer-card]') || frameEl.querySelector('[data-conversation-scroll]');
    const col = composerEl?.getBoundingClientRect();
    const topHeight = getTitlebarHeight();
    const next = col?.width
      ? { l: Math.round(col.left - bounds.left), r: Math.round(col.right - bounds.left), t: topHeight }
      : { l: -1, r: -1, t: topHeight };
    if (next.l !== calmBox?.l || next.r !== calmBox?.r || next.t !== calmBox?.t) {
      calmBox = next;
      if (!skipRender) render();
    }
  }

  function apply() {
    if (!shadow) return;
    const t = current(), off = prefs.theme === 'off';
    appearance(t, off);
    if (canvas) canvas.hidden = off;
    shadow.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === prefs.theme)));
    const pause = shadow.querySelector('.pause');
    pause.textContent = prefs.paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(prefs.paused));
    pause.disabled = off;
    const range = shadow.querySelector('input[type=range]');
    const glyphs = shadow.querySelector('.glyphs');
    const scale = shadow.querySelector('.scale');
    const recolor = shadow.querySelector('.recolor');
    const reactive = shadow.querySelector('.reactive');
    range.value = String(prefs.intensity); range.disabled = off;
    glyphs.value = prefs.glyphs; glyphs.disabled = off;
    scale.value = prefs.scale; scale.disabled = off;
    recolor.checked = prefs.recolor; recolor.disabled = off;
    reactive.checked = prefs.reactive; reactive.disabled = off;
    shadow.querySelector('.value').textContent = prefs.intensity + '%';
    label();
    shadow.querySelector('.status').textContent = off ? 'Original appearance restored' : `${t.name}, ${t.light ? 'light' : 'dark'} appearance`;
    render();
    syncLayout();
    schedule();
  }

  function findFrameTarget() {
    return document.querySelector('[data-shell-overlay]')?.parentElement
      || document.querySelector('#root > div')
      || document.body;
  }

  function mount() {
    const target = findFrameTarget();
    if (!target) return;
    host.style.visibility = 'visible';
    if (frameEl !== target || !canvas?.isConnected) {
      if (frameEl && frameEl !== target) frameEl.removeAttribute('data-dsh-aw-frame');
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeRaf);
      resizeRaf = 0;
      canvas?.remove();
      frameEl = target;
      frameEl.setAttribute('data-dsh-aw-frame', '');
      canvas = make('canvas', { id: 'dsh-ascii-scene', 'aria-hidden': 'true' });
      Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '-1', pointerEvents: 'none' });
      frameEl.prepend(canvas);
      ctx2d = canvas.getContext('2d', { alpha: false });
      resizeObserver = new ResizeObserver(() => {
        if (!resizeRaf) resizeRaf = requestAnimationFrame(() => {
          resizeRaf = 0;
          if (!alive) return;
          resize(); syncLayout(true); render();
        });
      });
      resizeObserver.observe(frameEl);
      resize();
      apply();
    } else {
      syncLayout();
    }
  }

  function resize() {
    if (!frameEl || !canvas || !ctx2d) return;
    const r = frameEl.getBoundingClientRect();
    const d = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 1.5);
    sceneWidth = r.width;
    sceneHeight = r.height;
    canvas.width = Math.round(r.width * d);
    canvas.height = Math.round(r.height * d);
    ctx2d.setTransform(d, 0, 0, d, 0, 0);
  }

  function render() {
    if (ctx2d && canvas && !canvas.hidden) {
      drawAsciiScene(ctx2d, sceneWidth, sceneHeight, current(), time, 0.35 + 0.65 * prefs.intensity / 100, calmBox, {
        energy,
        pulse,
        glyphs: prefs.glyphs,
        scale: prefs.scale
      });
    }
  }

  function stopPreviews() { cancelAnimationFrame(previewRaf); previewRaf = 0; }
  function drawPreview(c, t) {
    drawAsciiScene(c.getContext('2d'), c.width, c.height, t, time, 1, null, { glyphs: prefs.glyphs });
    c.dataset.previewKey = prefs.glyphs;
  }
  function previews(all = false) {
    if (!shadow || !open) return;
    if (!all) {
      if (prefs.theme === 'off') return;
      const t = current(), c = shadow.querySelector(`[data-theme="${t.id}"] canvas`);
      if (c && !c.parentNode.hidden) drawPreview(c, t);
      return;
    }
    stopPreviews();
    const queue = [];
    for (const t of themes) {
      const c = shadow.querySelector(`[data-theme="${t.id}"] canvas`);
      if (!c || c.parentNode.hidden || c.dataset.previewKey === prefs.glyphs) continue;
      if (t.id === prefs.theme) drawPreview(c, t); else queue.push([c, t]);
    }
    if (!queue.length) return;
    let idx = 0;
    const step = () => {
      previewRaf = 0;
      if (!alive || !open || document.hidden) return;
      for (let n = 0; n < 6 && idx < queue.length;) {
        const [c, t] = queue[idx++];
        if (c.parentNode.hidden || c.dataset.previewKey === prefs.glyphs) continue;
        drawPreview(c, t);
        n++;
      }
      if (idx < queue.length) previewRaf = requestAnimationFrame(step);
    };
    previewRaf = requestAnimationFrame(step);
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = performance.now();
    if (alive && !suspended && !document.hidden && !prefs.paused && prefs.theme !== 'off') {
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    if (!alive || suspended) return;
    if (now - last >= 33) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const target = prefs.reactive && agents > 0 ? 1 : 0;
      energy += (target - energy) * Math.min(1, dt * (target ? 1.2 : 0.6));
      if (energy < 0.002) energy = 0;
      pulse = Math.max(0, pulse - dt / 1.8);
      time += dt * (1 + 0.8 * energy);
      render();
      if (open && Math.floor(time * 5) !== lastPreview) {
        lastPreview = Math.floor(time * 5);
        previews();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function pauseActivity(keepAlive) {
    if (keepAlive) suspended = true; else alive = false;
    cancelAnimationFrame(raf); raf = 0;
    cancelAnimationFrame(resizeRaf); resizeRaf = 0;
    stopPreviews();
    clearTimeout(layoutTimer); layoutTimer = 0;
    observer?.disconnect();
    resizeObserver?.disconnect();
  }

  function resumeActivity() {
    suspended = false;
    observer?.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    if (frameEl?.isConnected) resizeObserver?.observe(frameEl); else mount();
    render(); syncLayout(); schedule();
  }

  function dispose() {
    pauseActivity(false);
    cleanups.forEach(f => { try { f(); } catch {} });
    cleanups.length = 0;
    restoreThemeRuntime();
    delete document.body.dataset.dshAwTheme;
    delete document.body.dataset.dshAwMode;
    frameEl?.removeAttribute('data-dsh-aw-frame');
    canvas?.remove();
    host?.remove();
    style?.remove();
    window.__dshAsciiInstalled = false;
    delete window.__dshAsciiDispose;
  }

  // Subscribe to optional Cordis services
  if (typeof ctx?.inject === 'function') {
    const disposeThemeInject = ctx.inject(['theme'], themeCtx => {
      themeService = themeCtx.theme;
      if (alive && shadow && prefs.theme !== 'off') apply();
      return () => {
        restoreThemeRuntime();
        themeService = null;
      };
    });
    if (typeof disposeThemeInject === 'function') cleanups.push(disposeThemeInject);

    const disposeSessionInject = ctx.inject(['uiSession'], sessionCtx => {
      return bindSessionStatus(sessionCtx.uiSession);
    });
    if (typeof disposeSessionInject === 'function') cleanups.push(disposeSessionInject);
  } else {
    if (ctx?.theme) themeService = ctx.theme;
    if (ctx?.uiSession) cleanups.push(bindSessionStatus(ctx.uiSession));
  }

  function start() {
    if (!alive) return;
    window.__dshAsciiDispose = dispose;
    listen(window, 'pagehide', e => { if (!e?.persisted) dispose(); else pauseActivity(true); });
    listen(window, 'pageshow', e => { if (e?.persisted && alive && suspended) resumeActivity(); });
    loadSavedPrefs();
    style = make('style', { id: 'dsh-ascii-style' });
    document.head.append(style);
    build();
    mount();
    observer = new MutationObserver(() => {
      if (!layoutTimer) layoutTimer = setTimeout(() => { layoutTimer = 0; if (alive) mount(); }, 120);
    });
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    listen(window, 'resize', syncLayout);
    listen(document, 'visibilitychange', () => {
      if (document.hidden) stopPreviews();
      else { render(); syncLayout(); if (open) previews(true); }
      schedule();
    });
    listen(reduced, 'change', () => {
      if (reduced.matches) { prefs.paused = true; apply(); save(); }
    });
  }

  if (document.readyState === 'loading') {
    const onReady = () => start();
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
    cleanups.push(() => document.removeEventListener('DOMContentLoaded', onReady));
  } else {
    start();
  }

  return dispose;
}
