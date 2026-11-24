'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const installer = require('../manage-wallpapers.cjs');

async function runTests() {
  console.log('Running DeepSeek Harness ASCII Wallpapers plugin tests...');

  // Test 1: Build client bundle & verify package.json contract
  execSync('node scripts/build-client.cjs', { cwd: rootDir, stdio: 'pipe' });
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'dsh-ascii-wallpapers');
  assert.strictEqual(pkg.dsh?.client?.platform, 'web');
  assert.strictEqual(pkg.exports?.['./client'], './lib/client.js');

  const verifyRes = await installer.verifyPlugin(rootDir);
  assert.strictEqual(verifyRes.valid, true, 'verifyPlugin must succeed: ' + verifyRes.errors.join('; '));

  // Test 2: Host ESM entrypoint exports apply()
  const hostMod = await import(pathToFileURL(path.join(rootDir, 'lib', 'index.js')).href);
  assert.strictEqual(typeof hostMod.apply, 'function', 'lib/index.js must export apply()');

  // Test 3: Boot built lib/client.js inside a mock browser + Cordis ctx
  const clientCode = fs.readFileSync(path.join(rootDir, 'lib', 'client.js'), 'utf8');
  const runtime = createMockDshBrowser(clientCode);

  assert(runtime.loadedReg && runtime.loadedReg.id === 'dsh-ascii-wallpapers', 'Client bundle must register with __ModuleLoader__');
  const frame = runtime.frame;
  const host = runtime.document.getElementById('dsh-ascii-controls');
  const styleTag = runtime.document.getElementById('dsh-ascii-style');
  assert(host && host.shadowRoot, 'Shadow DOM controls host must mount');
  assert(styleTag, 'Style tag must mount in head');
  assert(frame.attributes['data-dsh-aw-frame'] !== undefined, 'AppFrame element must be marked with data-dsh-aw-frame');
  const canvas = frame.querySelector('#dsh-ascii-scene');
  assert(canvas && canvas.style.zIndex === '-1', 'Background canvas must prepend to frame with zIndex -1');

  // ThemeRuntime recolor verification
  assert(runtime.themeState.preference.startsWith('dsh-ascii-wallpaper:'), 'Full recolor must activate custom ThemeRuntime theme');
  assert.strictEqual(runtime.themeState.active.tokens['--dsw-specific-sidebar-fill'], '#b7e1f3', 'Theme tokens must set --dsw-specific-sidebar-fill');
  assert.strictEqual(runtime.themeState.active.tokens['--dsw-alias-label-primary'], '#203645', 'Theme tokens must set --dsw-alias-label-primary');

  // Picker UI + 50 batched previews
  const sr = host.shadowRoot;
  const choices = sr.querySelectorAll('.choice');
  assert.strictEqual(choices.length, 50, 'Picker must render all 50 themes');
  sr.querySelector('.trigger').dispatchEvent({ type: 'click' });
  for (let k = 0; k < 12; k++) runtime.flushRaf(150);
  const stamped = sr.querySelectorAll('.choice canvas').filter(c => c.dataset.previewKey === 'ascii').length;
  assert.strictEqual(stamped, 50, 'All 50 preview canvases must render across batched rAF frames');

  // Search filter + dark filter
  const darkFilter = sr.querySelector('[data-filter="dark"]');
  darkFilter.dispatchEvent({ type: 'click' });
  const visibleDark = choices.filter(c => !c.hidden).length;
  assert.strictEqual(visibleDark, 28, 'Dark filter must leave 28 dark themes visible');
  sr.querySelector('[data-filter="all"]').dispatchEvent({ type: 'click' });

  // Slash command /theme aurora
  const editor = runtime.makeEl('textarea');
  editor.value = '/theme aurora';
  runtime.document.body.append(editor);
  editor.dispatchEvent({ type: 'keydown', key: 'Enter', shiftKey: false });
  assert.strictEqual(runtime.document.body.dataset.dshAwTheme, 'aurora', '/theme aurora must switch theme');
  assert.strictEqual(runtime.themeState.active.colorScheme, 'dark', 'Aurora must switch ThemeRuntime colorScheme to dark');

  // Theme app checkbox off -> restores base preference while keeping canvas visible
  const recolorBox = sr.querySelector('.recolor');
  recolorBox.checked = false;
  recolorBox.dispatchEvent({ type: 'change' });
  assert.strictEqual(runtime.themeState.preference, 'system', 'Unchecking Theme app must restore saved ThemeRuntime preference');
  assert.strictEqual(canvas.hidden, false, 'Unchecking Theme app must keep wallpaper canvas visible');

  // Re-enable Theme app, then click Off -> hides canvas and restores ThemeRuntime
  recolorBox.checked = true;
  recolorBox.dispatchEvent({ type: 'change' });
  sr.querySelector('.reset').dispatchEvent({ type: 'click' });
  assert.strictEqual(canvas.hidden, true, 'Off button must hide wallpaper canvas');
  assert.strictEqual(runtime.themeState.preference, 'system', 'Off button must restore original ThemeRuntime preference');

  // Switch back on for agent reactivity test
  sr.querySelector('[data-theme="catnap"]').dispatchEvent({ type: 'click' });
  runtime.setSessionRunning('s1', true);
  runtime.flushRaf(200);
  runtime.setSessionRunning('s1', false);
  runtime.flushRaf(250);
  assert(runtime.drawCalls.some(c => c.id === 'catnap' && c.fx.pulse > 0), 'Session completion must trigger ripple pulse');

  // Clean Cordis effect dispose()
  runtime.disposeEffect();
  assert.strictEqual(runtime.document.getElementById('dsh-ascii-controls'), null, 'dispose must remove controls host');
  assert.strictEqual(runtime.document.getElementById('dsh-ascii-style'), null, 'dispose must remove injected style');
  assert.strictEqual(frame.querySelector('#dsh-ascii-scene'), null, 'dispose must remove canvas');
  assert.strictEqual(frame.attributes['data-dsh-aw-frame'], undefined, 'dispose must remove data-dsh-aw-frame');
  assert.strictEqual(runtime.themeState.preference, 'system', 'dispose must restore ThemeRuntime');

  // Test 4: manage-wallpapers.cjs CLI install / status / verify / uninstall on temp DSH_HOME
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-aw-test-'));
  try {
    const profileDir = path.join(tmpHome, 'profiles', 'desktop');
    fs.mkdirSync(profileDir, { recursive: true });
    const existingPatch = [
      '# User patch',
      '- id: agent-default-model',
      '  name: "@deepseek-ai/dsh-agent-default-model"',
      '  config:',
      '    model: deepseek-flash',
      ''
    ].join('\n');
    const patchFile = path.join(profileDir, 'cordis.patch.yml');
    fs.writeFileSync(patchFile, existingPatch, 'utf8');

    const statusOut = execSync(`node manage-wallpapers.cjs status "${tmpHome}"`, { cwd: rootDir, encoding: 'utf8' });
    assert(statusOut.includes('not installed'), 'status must report not installed before install');

    execSync(`node manage-wallpapers.cjs install "${tmpHome}"`, { cwd: rootDir, encoding: 'utf8' });
    const afterInstall = fs.readFileSync(patchFile, 'utf8');
    assert(afterInstall.includes('# ascii-wallpapers:start'), 'install must add start marker');
    assert(afterInstall.includes('id: agent-default-model'), 'install must preserve existing user patch entries');
    assert(fs.existsSync(patchFile + '.ascii-wallpapers.backup'), 'install must save backup');

    // Idempotent second install
    execSync(`node manage-wallpapers.cjs install "${tmpHome}"`, { cwd: rootDir, encoding: 'utf8' });
    const afterSecond = fs.readFileSync(patchFile, 'utf8');
    assert.strictEqual(afterSecond.match(/# ascii-wallpapers:start/g).length, 1, 'second install must not duplicate block');

    // Uninstall / restore removes only our block
    execSync(`node manage-wallpapers.cjs uninstall "${tmpHome}"`, { cwd: rootDir, encoding: 'utf8' });
    const afterUninstall = fs.readFileSync(patchFile, 'utf8');
    assert(!afterUninstall.includes('# ascii-wallpapers:start'), 'uninstall must remove plugin block');
    assert.strictEqual(afterUninstall, existingPatch, 'uninstall must restore original patch entries byte-for-byte');

    // Empty `[]` template handling
    fs.writeFileSync(patchFile, '# header comment\n[]\n', 'utf8');
    const insertedFromEmpty = installer.upsertPatchBlock(fs.readFileSync(patchFile, 'utf8'), 'C:\\plugins\\index.js');
    assert(!insertedFromEmpty.includes('[]'), 'installing onto empty [] template must replace []');
    const removedBackToEmpty = installer.removePatchBlock(insertedFromEmpty);
    assert(removedBackToEmpty.includes('[]'), 'removing last entry must restore valid [] YAML array');
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }

  console.log('All DeepSeek Harness ASCII Wallpapers tests passed!');
}

function createMockDshBrowser(clientCode) {
  const rafQueue = [];
  const docListeners = {};
  const winListeners = {};
  const drawCalls = [];
  const store = {};
  let nextId = 1;
  let mutCb = null;
  let resizeCb = null;
  let loadedReg = null;

  const matchesSimple = (el, sel) => {
    const s = sel.trim();
    if (!s) return false;
    const parts = s.split(/\s+/);
    const matchPart = (node, part) => {
      if (part === '>') return true;
      let p = part;
      if (p.includes(':not([hidden])')) {
        if (node.hidden || node.attributes.hidden !== undefined) return false;
        p = p.replace(':not([hidden])', '');
      }
      const attrM = p.match(/\[([^\]*=]+)(?:=(?:"([^"]*)"|([^\]]*)))?\]/);
      let base = p;
      if (attrM) {
        base = p.slice(0, attrM.index);
        const rawVal = attrM[1] === 'hidden' ? (node.hidden ? '' : undefined) : node.attributes[attrM[1]];
        if (rawVal === undefined) return false;
        const exp = attrM[2] ?? attrM[3];
        if (exp !== undefined && rawVal !== exp) return false;
      }
      if (base.startsWith('#')) return node.id === base.slice(1);
      if (base.startsWith('.')) return node.classList.contains(base.slice(1));
      if (base) return node.tagName.toLowerCase() === base.toLowerCase();
      return true;
    };
    if (parts.length === 1) return matchPart(el, parts[0]);
    if (parts.length === 2) {
      if (!matchPart(el, parts[1])) return false;
      let p = el.parentNode;
      while (p) { if (matchPart(p, parts[0])) return true; p = p.parentNode; }
      return false;
    }
    return false;
  };
  const matchesSelector = (el, sel) => sel.split(',').some(s => matchesSimple(el, s));

  function makeEl(tag) {
    const classes = new Set();
    const listeners = {};
    const el = {
      _listeners: listeners,
      tagName: tag.toUpperCase(),
      nodeType: 1,
      children: [],
      parentNode: null,
      attributes: {},
      dataset: {},
      textContent: '',
      value: /^(input|textarea|select|option)$/i.test(tag) ? '' : undefined,
      hidden: false,
      disabled: false,
      checked: false,
      width: 0,
      height: 0,
      title: '',
      id: '',
      _rect: { left: 0, top: 0, width: 1200, height: 800, right: 1200, bottom: 800 },
      style: {
        _props: {},
        setProperty(k, v) { this._props[k] = String(v); },
        getPropertyValue(k) { return this._props[k] || ''; },
        removeProperty(k) { delete this._props[k]; }
      },
      classList: {
        add: (...c) => c.forEach(x => classes.add(x)),
        remove: (...c) => c.forEach(x => classes.delete(x)),
        contains: c => classes.has(c)
      },
      get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; },
      get isConnected() { let p = this; while (p) { if (p === document.documentElement) return true; p = p.parentNode; } return false; },
      setAttribute(k, v) {
        el.attributes[k] = String(v);
        if (k === 'id') el.id = String(v);
        if (k === 'class') { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); }
        if (k === 'hidden') el.hidden = true;
        if (k === 'width' || k === 'height') el[k] = Number(v);
        if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())] = String(v);
      },
      removeAttribute(k) {
        delete el.attributes[k];
        if (k === 'hidden') el.hidden = false;
        if (k.startsWith('data-')) delete el.dataset[k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())];
      },
      getAttribute: k => el.attributes[k] ?? null,
      hasAttribute: k => el.attributes[k] !== undefined,
      toggleAttribute: (k, f) => { const has = el.attributes[k] !== undefined; if (f ?? !has) el.setAttribute(k, ''); else el.removeAttribute(k); },
      append(...nodes) { for (const n of nodes) { if (typeof n === 'string') el.textContent += n; else { n.parentNode = el; el.children.push(n); } } },
      prepend(...nodes) { for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; n.parentNode = el; el.children.unshift(n); } },
      remove() { if (el.parentNode) { el.parentNode.children = el.parentNode.children.filter(c => c !== el); el.parentNode = null; } },
      querySelectorAll(sel) {
        const out = [];
        const walk = n => { for (const c of n.children || []) { if (matchesSelector(c, sel)) out.push(c); walk(c); } };
        walk(el);
        return out;
      },
      querySelector: sel => el.querySelectorAll(sel)[0] || null,
      matches: sel => matchesSelector(el, sel),
      closest: sel => { let p = el; while (p && p.nodeType === 1) { if (matchesSelector(p, sel)) return p; p = p.parentNode; } return null; },
      contains: other => { let p = other; while (p) { if (p === el) return true; p = p.parentNode; } return false; },
      attachShadow() { const sr = makeEl('shadow-root'); el.shadowRoot = sr; return sr; },
      addEventListener(n, fn) { (listeners[n] ||= []).push(fn); },
      removeEventListener(n, fn) { listeners[n] = (listeners[n] || []).filter(f => f !== fn); },
      dispatchEvent(ev) {
        let stopped = false, immediateStopped = false;
        const pathArr = [];
        for (let p = el; p; p = p.parentNode) pathArr.push(p);
        pathArr.push(document);
        const eventObj = {
          target: el,
          preventDefault() {},
          stopPropagation() { stopped = true; },
          stopImmediatePropagation() { stopped = true; immediateStopped = true; },
          composedPath: () => pathArr,
          ...ev
        };
        const fireOn = (map, type) => {
          for (const f of [...(map[type] || [])]) {
            f(eventObj);
            if (immediateStopped) break;
          }
        };
        if (eventObj.type === 'keydown') {
          fireOn(docListeners, 'keydown');
          if (stopped) return;
        }
        for (const node of pathArr) {
          if (node === document) {
            if (eventObj.type !== 'keydown') fireOn(docListeners, eventObj.type);
          } else if (node._listeners) {
            fireOn(node._listeners, eventObj.type);
          }
          if (stopped) break;
        }
      },
      focus() {},
      scrollIntoView() {},
      getBoundingClientRect: () => ({ ...el._rect }),
      getContext: () => ({
        canvas: el,
        font: '',
        textAlign: '',
        textBaseline: '',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        globalAlpha: 1,
        getTransform: () => ({ a: 1 }),
        setTransform() {},
        scale() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        fillRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        fill() {},
        stroke() {},
        fillText() {},
        clearRect() {},
        drawImage() {},
        save() {},
        restore() {}
      })
    };
    return el;
  }

  const document = {
    readyState: 'complete',
    hidden: false,
    documentElement: makeEl('html'),
    head: makeEl('head'),
    body: makeEl('body'),
    createElement: makeEl,
    createRange: () => ({ selectNodeContents() {} }),
    execCommand: () => {},
    getElementById: id => document.documentElement.querySelector('#' + id),
    querySelectorAll: sel => document.documentElement.querySelectorAll(sel),
    querySelector: sel => document.querySelectorAll(sel)[0] || null,
    addEventListener(n, fn) { (docListeners[n] ||= []).push(fn); },
    removeEventListener(n, fn) { docListeners[n] = (docListeners[n] || []).filter(f => f !== fn); }
  };
  document.documentElement.setAttribute('data-windows-titlebar', '');
  document.documentElement.style.setProperty('--dsh-windows-titlebar-height', '40px');
  document.documentElement.append(document.head, document.body);

  const root = makeEl('div'); root.setAttribute('id', 'root');
  const frame = makeEl('div');
  const overlay = makeEl('div'); overlay.setAttribute('data-shell-overlay', '');
  const composer = makeEl('div'); composer.setAttribute('data-composer-card', '');
  composer._rect = { left: 260, top: 640, width: 700, height: 110, right: 960, bottom: 750 };
  frame.append(composer, overlay);
  root.append(frame);
  document.body.append(root);

  const windowObj = {
    innerWidth: 1200,
    devicePixelRatio: 1,
    addEventListener(n, fn) { (winListeners[n] ||= []).push(fn); },
    removeEventListener(n, fn) { winListeners[n] = (winListeners[n] || []).filter(f => f !== fn); },
    __ModuleLoader__: {
      load(reg) { loadedReg = reg; }
    }
  };
  windowObj.self = windowObj;
  windowObj.top = windowObj;

  // Mock Cordis ThemeRuntime + UiSession
  const registeredThemes = new Map([
    ['light', { id: 'light', colorScheme: 'light', tokens: {} }],
    ['dark', { id: 'dark', colorScheme: 'dark', tokens: {} }]
  ]);
  const themeState = { preference: 'system', active: { id: 'dark', colorScheme: 'dark', tokens: {} } };
  const themeService = {
    getTheme: () => themeState,
    register(def) {
      registeredThemes.set(def.id, def);
      return () => {
        registeredThemes.delete(def.id);
        if (themeState.preference === def.id) {
          themeState.preference = 'system';
          themeState.active = { id: 'dark', colorScheme: 'dark', tokens: {} };
        }
      };
    },
    setTheme(id) {
      themeState.preference = id;
      themeState.active = registeredThemes.get(id) || { id: 'dark', colorScheme: 'dark', tokens: {} };
    }
  };

  const sessionMap = new Map();
  const sessionSubs = new Set();
  const uiSession = {
    sessionStatus: {
      getSnapshot: () => sessionMap,
      subscribe(fn) { sessionSubs.add(fn); return () => sessionSubs.delete(fn); }
    }
  };

  const effectCleanups = [];
  const ctx = {
    theme: themeService,
    uiSession,
    effect(fn) {
      const cleanup = fn();
      if (typeof cleanup === 'function') effectCleanups.push(cleanup);
      return () => { if (typeof cleanup === 'function') cleanup(); };
    },
    inject(deps, fn) {
      const cleanup = fn(ctx);
      return typeof cleanup === 'function' ? cleanup : () => {};
    }
  };

  // Instrument drawAsciiScene by wrapping draw call after loading
  let simNow = 100;
  const sandbox = {
    window: windowObj,
    document,
    navigator: { platform: 'Win32', userAgent: 'Chrome' },
    devicePixelRatio: 1,
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: el => ({ getPropertyValue: k => el.style.getPropertyValue(k) || '' }),
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
    HTMLTextAreaElement: (() => { const C = class {}; Object.defineProperty(C.prototype, 'value', { configurable: true, set(v) { Object.defineProperty(this, 'value', { value: String(v), writable: true, configurable: true, enumerable: true }); } }); return C; })(),
    Event: class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } },
    MutationObserver: class { constructor(cb) { mutCb = cb; } observe() {} disconnect() {} },
    ResizeObserver: class { constructor(cb) { resizeCb = cb; } observe() {} disconnect() {} },
    requestAnimationFrame: cb => { const id = nextId++; rafQueue.push({ id, cb }); return id; },
    cancelAnimationFrame: id => { const i = rafQueue.findIndex(x => x.id === id); if (i >= 0) rafQueue.splice(i, 1); },
    setTimeout: () => nextId++,
    clearTimeout: () => {},
    performance: { now: () => simNow },
    console,
    Symbol,
    Object,
    Array,
    Map,
    Set,
    WeakMap,
    Int8Array,
    Int32Array,
    Uint8Array,
    Float32Array,
    Float64Array,
    Math,
    Number,
    String,
    Boolean,
    JSON,
    Date,
    Error,
    RegExp,
    Promise
  };

  vm.runInNewContext(clientCode, sandbox, { filename: 'lib/client.js' });
  const exportsObj = loadedReg.factory(spec => { throw new Error('Unexpected require: ' + spec); });

  // Spy on drawAsciiScene via mount wrapper
  const origMount = exportsObj.mountDshAsciiWallpapers;
  exportsObj.mountDshAsciiWallpapers = (c, drawFn) => origMount(c, (ctx2d, w, h, t, s, str, calm, fx) => {
    drawCalls.push({ w, h, id: t.id, fx: { ...fx } });
    return drawFn(ctx2d, w, h, t, s, str, calm, fx);
  });
  const applyCleanup = exportsObj.apply(ctx);

  return {
    document,
    frame,
    loadedReg,
    themeState,
    drawCalls,
    makeEl,
    flushRaf(stepMs = 40) {
      simNow += stepMs;
      const cur = rafQueue.splice(0);
      cur.forEach(x => x.cb(simNow));
      return cur.length;
    },
    setSessionRunning(id, running) {
      sessionMap.set(id, { running });
      for (const fn of sessionSubs) fn();
    },
    disposeEffect() {
      if (typeof applyCleanup === 'function') applyCleanup();
      effectCleanups.splice(0).forEach(fn => fn());
    }
  };
}

runTests().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
