const { spawn } = require('child_process');

// Force the onboarding environment variable to true
process.env.EXPO_PUBLIC_FORCE_ONBOARDING = 'true';

// Retrieve any extra arguments passed to the script (e.g. --ios, --android, --web)
const args = process.argv.slice(2);

console.log('\x1b[35m%s\x1b[0m', 'Starting Expo with forced onboarding (EXPO_PUBLIC_FORCE_ONBOARDING=true)...');

// Spawn the Expo process forwarding the arguments and environment
const child = spawn('npx', ['expo', 'start', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('close', (code) => {
  process.exit(code);
});
