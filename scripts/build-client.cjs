'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scenesPath = path.join(root, 'src', 'wallpaper-scenes.js');
const clientRuntimePath = path.join(root, 'src', 'dsh-ascii-wallpapers.js');
const outPath = path.join(root, 'lib', 'client.js');

const scenesSrc = fs.readFileSync(scenesPath, 'utf8');
const runtimeSrc = fs.readFileSync(clientRuntimePath, 'utf8');

const bundle = `/* Built by scripts/build-client.cjs — do not edit directly. */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: function(require) {
    'use strict';
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    ${scenesSrc}

    ${runtimeSrc}

    function apply(ctx) {
      if (!ctx || typeof ctx.effect !== 'function') {
        return exports.mountDshAsciiWallpapers(ctx, drawAsciiScene);
      }
      return ctx.effect(function() {
        return exports.mountDshAsciiWallpapers(ctx, drawAsciiScene);
      }, 'dsh-ascii-wallpapers: runtime');
    }

    exports.apply = apply;
    exports.mountDshAsciiWallpapers = mountDshAsciiWallpapers;
    return module.exports;
  }
});
`;

new vm.Script(bundle, { filename: 'lib/client.js' });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, bundle, 'utf8');
console.log(`Built ${path.relative(root, outPath)} (${Buffer.byteLength(bundle, 'utf8')} bytes) for ${pkg.name}@${pkg.version}`);
