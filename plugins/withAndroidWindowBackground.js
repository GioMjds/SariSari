const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withAndroidWindowBackground(config) {
  return withAndroidStyles(config, (mod) => {
    const styles = mod.modResults.resources.style;

    // Find AppTheme or the main theme
    const appTheme = styles.find(
      (s) => s.$.name === 'AppTheme' || s.$.name === 'Theme.App',
    );

    if (appTheme) {
      if (!appTheme.item) appTheme.item = [];

      // Remove existing windowBackground if present
      appTheme.item = appTheme.item.filter(
        (i) => i.$.name !== 'android:windowBackground',
      );

      // Set it to your paper color
      appTheme.item.push({
        $: { name: 'android:windowBackground' },
        _: '#EFE6D2',
      });
    }

    return mod;
  });
};
