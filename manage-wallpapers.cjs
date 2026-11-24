/* Usage: node manage-wallpapers.cjs install|verify|status|restore|uninstall [dsh-home-or-profile-dir] */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { pathToFileURL } = require('url');

const ROOT_DIR = __dirname;
const START_MARKER = '# ascii-wallpapers:start';
const END_MARKER = '# ascii-wallpapers:end';
const PLUGIN_ID = 'ascii-wallpapers';

const isFile = p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; } };
const isDir = p => { try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); } catch { return false; } };

function resolveDshHome(customArg) {
  const raw = customArg || process.argv[3] || process.env.DSH_HOME;
  if (raw) return path.resolve(raw);
  return path.join(os.homedir(), '.dsh');
}

function resolvePatchPath(dshHome = resolveDshHome()) {
  if (isFile(dshHome) && path.basename(dshHome) === 'cordis.patch.yml') return dshHome;
  const profilePkg = path.join(dshHome, 'package.json');
  if (isFile(profilePkg)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(profilePkg, 'utf8'));
      if (parsed?.dsh?.profile) return path.join(dshHome, 'cordis.patch.yml');
    } catch {}
  }
  const desktopDir = path.join(dshHome, 'profiles', 'desktop');
  if (isDir(desktopDir) || !isFile(path.join(dshHome, 'cordis.patch.yml'))) {
    return path.join(desktopDir, 'cordis.patch.yml');
  }
  return path.join(dshHome, 'cordis.patch.yml');
}

function detectDesktopApp() {
  const candidates = process.platform === 'win32'
    ? [
        ...(process.env.LOCALAPPDATA ? [path.join(process.env.LOCALAPPDATA, 'Programs', 'DeepSeek Harness')] : []),
        ...(process.env.ProgramFiles ? [path.join(process.env.ProgramFiles, 'DeepSeek Harness')] : [])
      ]
    : process.platform === 'darwin'
    ? ['/Applications/DeepSeek Harness.app/Contents', path.join(os.homedir(), 'Applications', 'DeepSeek Harness.app', 'Contents')]
    : ['/opt/DeepSeek Harness', '/usr/lib/deepseek-harness', path.join(os.homedir(), '.local', 'share', 'deepseek-harness')];

  for (const appDir of candidates) {
    const asar = path.join(appDir, 'resources', 'app.asar');
    if (isFile(asar)) {
      let version = 'unknown';
      try {
        const bytes = fs.readFileSync(asar);
        if (bytes.length >= 16 && bytes.readUInt32LE(0) === 4) {
          const dataStart = 8 + bytes.readUInt32LE(4);
          const headerLen = bytes.readUInt32LE(12);
          const header = JSON.parse(bytes.subarray(16, 16 + headerLen).toString('utf8'));
          const pkgItem = header?.files?.['package.json'];
          if (pkgItem && !pkgItem.unpacked) {
            const pkg = JSON.parse(bytes.subarray(dataStart + Number(pkgItem.offset), dataStart + Number(pkgItem.offset) + pkgItem.size).toString('utf8'));
            if (pkg?.version) version = pkg.version;
          }
        }
      } catch {}
      if (version === 'unknown') {
        const verFile = path.join(appDir, 'version');
        if (isFile(verFile)) {
          try { version = fs.readFileSync(verFile, 'utf8').trim() || version; } catch {}
        }
      }
      return { installed: true, appDir, asarPath: asar, version };
    }
  }
  return { installed: false, appDir: null, asarPath: null, version: null };
}

async function verifyPlugin(pluginDir = ROOT_DIR) {
  const errors = [];
  const warnings = [];
  const pkgPath = path.join(pluginDir, 'package.json');
  let pkg = null;

  if (!isFile(pkgPath)) {
    errors.push(`Missing package.json at ${pkgPath}`);
    return { valid: false, pkg: null, errors, warnings };
  }

  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (e) {
    errors.push(`Invalid JSON in package.json: ${e.message}`);
    return { valid: false, pkg: null, errors, warnings };
  }

  if (typeof pkg.name !== 'string' || !pkg.name) errors.push('package.json must declare a non-empty name');
  const dshClient = pkg?.dsh?.client;
  if (!dshClient || typeof dshClient !== 'object' || dshClient.platform !== 'web') {
    errors.push('package.json dsh.client.platform must be "web"');
  }
  if (dshClient?.inject !== undefined && (!Array.isArray(dshClient.inject) || dshClient.inject.some(x => typeof x !== 'string'))) {
    errors.push('package.json dsh.client.inject must be a string array');
  }

  const mainRel = typeof pkg.main === 'string' ? pkg.main : 'lib/index.js';
  const mainPath = path.join(pluginDir, mainRel);
  if (!isFile(mainPath)) {
    errors.push(`Missing host entry file ${mainRel}`);
  } else {
    try {
      const mod = await import(pathToFileURL(mainPath).href);
      if (typeof mod.apply !== 'function') errors.push(`${mainRel} must export an apply() function`);
    } catch (e) {
      errors.push(`Failed to import ${mainRel}: ${e.message}`);
    }
  }

  const clientExport = typeof pkg?.exports?.['./client'] === 'string'
    ? pkg.exports['./client']
    : pkg?.exports?.['./client']?.default;
  if (typeof clientExport !== 'string') {
    errors.push('package.json exports["./client"] must be a string or { default: string }');
  } else {
    const clientPath = path.join(pluginDir, clientExport);
    if (!isFile(clientPath)) {
      errors.push(`Missing client bundle ${clientExport} (run "node scripts/build-client.cjs" first)`);
    } else {
      const source = fs.readFileSync(clientPath, 'utf8');
      try {
        new vm.Script(source, { filename: clientExport });
      } catch (e) {
        errors.push(`Client bundle syntax check failed: ${e.message}`);
      }
      let registered = null;
      const sandbox = {
        window: {
          __ModuleLoader__: {
            load(reg) { registered = reg; }
          }
        },
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
        Error
      };
      try {
        vm.runInNewContext(source, sandbox, { filename: clientExport });
        if (!registered || registered.id !== pkg.name || typeof registered.factory !== 'function') {
          errors.push(`Client bundle did not register id "${pkg.name}" via window.__ModuleLoader__.load()`);
        } else {
          const exportsObj = registered.factory(spec => {
            throw new Error(`Unexpected external require("${spec}") during bundle check`);
          });
          if (typeof exportsObj?.apply !== 'function') {
            errors.push('Client bundle factory did not export an apply(ctx) function');
          }
        }
      } catch (e) {
        errors.push(`Client bundle registration check failed: ${e.message}`);
      }
    }
  }

  return { valid: errors.length === 0, pkg, errors, warnings };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPatchBlock(entryPath) {
  const entryLine = '- ' + JSON.stringify({ insert: [{ id: PLUGIN_ID, name: entryPath }] });
  return `${START_MARKER}\n${entryLine}\n${END_MARKER}`;
}

function hasPatchBlock(content) {
  const re = new RegExp(`${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`);
  return re.test(content || '');
}

function upsertPatchBlock(existingContent, entryPath) {
  const block = buildPatchBlock(entryPath);
  const blockRe = new RegExp(`${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\r?\\n?`, 'g');
  const cleaned = (existingContent || '').replace(blockRe, '');

  const lines = cleaned.split(/\r?\n/);
  const nonEmptyNonComment = lines.filter(l => {
    const t = l.trim();
    return t !== '' && !t.startsWith('#');
  });

  // Fresh Cordis profile patches contain `[]` as an empty YAML array; replace it with the list item.
  if (nonEmptyNonComment.length === 1 && nonEmptyNonComment[0].trim() === '[]') {
    const outLines = [];
    let replaced = false;
    for (const l of lines) {
      if (!replaced && l.trim() === '[]') {
        outLines.push(block);
        replaced = true;
      } else {
        outLines.push(l);
      }
    }
    return outLines.join('\n').replace(/\n*$/, '\n');
  }

  const trimmedRight = cleaned.replace(/\s+$/, '');
  if (!trimmedRight) return block + '\n';
  return trimmedRight + '\n' + block + '\n';
}

function removePatchBlock(existingContent) {
  const blockRe = new RegExp(`(?:\\r?\\n)?${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\r?\\n?`, 'g');
  const cleaned = (existingContent || '').replace(blockRe, '\n');
  const lines = cleaned.split(/\r?\n/);
  const nonEmptyNonComment = lines.filter(l => {
    const t = l.trim();
    return t !== '' && !t.startsWith('#');
  });
  const trimmed = cleaned.replace(/^\n+/, '').replace(/\n+$/, '');
  if (nonEmptyNonComment.length === 0) {
    return trimmed ? trimmed + '\n[]\n' : '[]\n';
  }
  return trimmed + '\n';
}

function writeAtomic(target, data) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  try {
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, target);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch {}
    throw e;
  }
}

async function main(argv = process.argv) {
  let action = argv[2];
  if (action === 'uninstall') action = 'restore';
  if (!['install', 'restore', 'verify', 'status'].includes(action)) {
    throw new Error('Use install, verify, status, restore, or uninstall');
  }

  const dshHome = resolveDshHome(argv[3]);
  const patchPath = resolvePatchPath(dshHome);
  const backupPath = patchPath + '.ascii-wallpapers.backup';
  const entryPath = path.join(ROOT_DIR, 'lib', 'index.js');
  const appInfo = detectDesktopApp();
  const report = await verifyPlugin(ROOT_DIR);

  const patchExists = isFile(patchPath);
  const patchContent = patchExists ? fs.readFileSync(patchPath, 'utf8') : '';
  const installed = hasPatchBlock(patchContent);

  if (action === 'status') {
    console.log(`Plugin ${report.pkg?.name || 'dsh-ascii-wallpapers'}@${report.pkg?.version || 'unknown'}: ${report.valid ? 'valid build' : 'invalid build'}.`);
    console.log(`DeepSeek Harness desktop: ${appInfo.installed ? `found v${appInfo.version} at ${appInfo.appDir}` : 'not detected in default locations'}.`);
    console.log(`Patch file (${patchPath}): ${installed ? 'installed' : 'not installed'}${patchExists ? '' : ' (file does not exist yet)'}.`);
    if (report.errors.length) {
      console.log('Build issues:\n - ' + report.errors.join('\n - '));
    }
    return;
  }

  if (action === 'verify') {
    if (!report.valid) {
      throw new Error('Plugin verification failed:\n - ' + report.errors.join('\n - '));
    }
    console.log(`Plugin ${report.pkg.name}@${report.pkg.version} verified against DeepSeek Harness dsh-client-modules contract.`);
    console.log(`Target patch file: ${patchPath} (${installed ? 'currently installed' : 'not installed'}).`);
    if (appInfo.installed) {
      console.log(`Detected DeepSeek Harness v${appInfo.version} at ${appInfo.appDir}.`);
    }
    console.log('No files changed.');
    return;
  }

  if (action === 'restore') {
    if (!patchExists || !installed) {
      console.log('ASCII Wallpapers plugin is not installed in ' + patchPath + '. Nothing to remove.');
      return;
    }
    const next = removePatchBlock(patchContent);
    writeAtomic(patchPath, next);
    console.log('Removed ASCII Wallpapers plugin entry from ' + patchPath + '. Restart DeepSeek Harness to unload.');
    return;
  }

  if (!report.valid) {
    throw new Error('Cannot install invalid plugin build:\n - ' + report.errors.join('\n - '));
  }

  if (patchExists && !isFile(backupPath)) {
    writeAtomic(backupPath, patchContent);
  }
  const updated = upsertPatchBlock(patchContent, entryPath);
  writeAtomic(patchPath, updated);
  console.log(`Installed ${report.pkg.name}@${report.pkg.version} into ${patchPath}.`);
  console.log('Open or restart DeepSeek Harness and click Themes (or press Ctrl+Alt+W / type /theme).');
}

if (require.main === module) {
  main().catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  });
}

module.exports = {
  resolveDshHome,
  resolvePatchPath,
  detectDesktopApp,
  verifyPlugin,
  buildPatchBlock,
  hasPatchBlock,
  upsertPatchBlock,
  removePatchBlock,
  main
};
