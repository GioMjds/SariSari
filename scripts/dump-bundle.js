// Dump the Metro-produced JS bundle to disk so we can inspect offending modules.
// Used only for diagnosing the Hermes "private properties not supported" error.
const path = require('path');
const fs = require('fs');

(async () => {
  // Load Metro via the Expo wrapper so we get the same defaults
  const { getDefaultConfig } = require('expo/metro-config');
  const Metro = require('metro');
  const { loadConfig } = require('metro-config');

  const projectRoot = path.resolve(__dirname, '..');
  const config = await getDefaultConfig(projectRoot);

  // Don't minify — easier to read
  config.transformer.minifierConfig = config.transformer.minifierConfig || {};
  config.transformer.minifierConfig.mangle = { toplevel: false };

  // Make Metro accept node_modules paths (some entry files live there)
  config.watchFolders = config.watchFolders || [];
  if (!config.watchFolders.includes(projectRoot)) {
    config.watchFolders.push(projectRoot);
  }
  config.resolver.nodeModulesPaths = config.resolver.nodeModulesPaths || [];
  if (!config.resolver.nodeModulesPaths.includes(path.join(projectRoot, 'node_modules'))) {
    config.resolver.nodeModulesPaths.push(path.join(projectRoot, 'node_modules'));
  }

  const out = path.join(projectRoot, 'temp-bundle.js');

  console.log('Building bundle...');

  // Build for the actual entry used by expo-router
  const bundle = await Metro.runBuild(config, {
    entry: 'node_modules/expo-router/entry.js',
    platform: 'android',
    dev: false,
    minify: false,
    out: out,
  });

  fs.writeFileSync(out, bundle.code || '');
  console.log(`Wrote ${out} (${(bundle.code || '').length} bytes)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});