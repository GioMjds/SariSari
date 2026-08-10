# Development Setup Guide

Comprehensive setup guide for the SariSari development environment.

## System Requirements

### Operating System

- **macOS** 13+ (Ventura) — required for iOS development
- **Windows** 10/11 with WSL2 — for Android/Web development
- **Linux** Ubuntu 22.04+ / Fedora 38+ — for Android/Web development

### Required Software

| Tool           | Version             | Purpose                      |
| -------------- | ------------------- | ---------------------------- |
| Node.js        | 20.x LTS (20.18.0+) | JavaScript runtime           |
| npm            | 10.x+               | Package manager              |
| Git            | 2.40+               | Version control              |
| Expo CLI       | Latest (`npx expo`) | Development toolchain        |
| Xcode          | 15.4+ (macOS)       | iOS Simulator, device builds |
| Android Studio | Ladybug 2024.2+     | Android Emulator, SDK        |
| Watchman       | 2024.x+             | File watching (macOS/Linux)  |

## Installation Steps

### 1. Install Node.js

**Via nvm (recommended):**

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

**Via official installer:** Download from [nodejs.org](https://nodejs.org/en/download/)

**Verify:**

```bash
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### 2. Install Expo CLI

```bash
# Note: Modern Expo uses npx, no global install needed
# But if you prefer global:
npm install -g expo-cli@latest
```

### 3. Platform-Specific Setup

#### macOS (iOS + Android)

```bash
# Xcode from App Store
xcode-select --install

# Homebrew for additional tools
brew install watchman git

# Android Studio
brew install --cask android-studio

# Accept licenses after install
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --licenses
```

#### Windows (WSL2 + Android)

```bash
# In PowerShell (Admin):
wsl --install
# Restart, then in WSL:
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl file git

# Node.js via nvm in WSL
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20

# Android Studio in Windows (not WSL) - download from developer.android.com
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y build-essential curl file git watchman

# Android Studio
# Download from developer.android.com or use snap:
sudo snap install android-studio --classic

# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 4. Clone and Configure Project

```bash
git clone <repository-url>
cd sarisari

# Install dependencies (includes better-sqlite3 rebuild)
npm install
```

### 5. Verify Installation

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Start dev server
npm start
```

## Environment Variables

Create `.env.local` in project root (not committed):

```bash
# Optional: Custom SQLite path (defaults to app-specific directory)
# EXPO_SQLITE_DB_LOCATION=/custom/path/sarisari.db

# Optional: Enable dev tools
# EXPO_DEVTOOLS_PATH=~/expo-devtools

# Optional: Debug flags
# DEBUG=expo:*
```

## IDE Configuration

### VS Code (Recommended)

**Extensions:**

- `expo-tools` — Expo integration
- `vscode.typescript-vue-plugin` — TypeScript support
- `bradlc.vscode-tailwindcss` — Tailwind IntelliSense
- `esbenp.prettier-vscode` — Formatting
- `ms-vscode.vscode-typescript-next` — Latest TS server

**Settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["className\\s*=\\s*\"([^\"]*)\"", "([^\\s]+)"],
    ["className\\s*=\\s*\\{([^}]*)\\}", "([^\\s]+)"]
  ]
}
```

### WebStorm / IntelliJ

- Enable TypeScript service: Settings → Languages → TypeScript
- Add Tailwind CSS plugin
- Configure Prettier: Settings → Languages → JavaScript → Prettier
- Set up Expo run configuration via `npx expo start`

## Device Testing Setup

### iOS Device (macOS only)

1. Connect iPhone via USB
2. Trust computer on device
3. In Xcode: Window → Devices and Simulators → Select device → Check "Show as run destination"
4. Run: `npm run:ios` — select device from list

### Android Device

1. Enable Developer Options (tap Build Number 7x)
2. Enable USB Debugging
3. Connect via USB, allow debugging on device
4. Run: `npm run:android` — selects connected device

### Expo Go (Quick Testing)

1. Install Expo Go from App Store / Play Store
2. Run `npm start`
3. Scan QR code with Expo Go app

## Database Setup

### SQLite (expo-sqlite)

- Auto-configured via `configs/sqlite.ts`
- Single handle shared across app
- PRAGMA settings: `journal_mode=WAL`, `busy_timeout=5000`

### Development Database Reset

1. Start app: `npm start`
2. Navigate to `/dev/reset` tab (developer only)
3. Tap "Reset & Seed Database"
4. Uses `scripts/sample-mock-datas.ts` for seed data

### Inspect Database

```bash
# On simulator/emulator, db is in app sandbox
# Use Flipper or react-native-debugger to inspect
# Or export via app's debug menu (if implemented)
```

## Troubleshooting

### Common Issues

**"Cannot find module 'expo'"**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

**Metro bundler issues**

```bash
# Reset metro cache
npx expo start --clear

# Or manually
rm -rf .expo
npx expo start --clear
```

**iOS Simulator won't start**

```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Reopen Xcode, accept license if needed
sudo xcodebuild -license accept
```

**Android build fails**

```bash
# Clean Gradle
cd android && ./gradlew clean && cd ..

# Check SDK path
echo $ANDROID_HOME
# Should point to ~/Library/Android/sdk (macOS) or ~/Android/Sdk (Linux)
```

**TypeScript errors after Node upgrade**

```bash
# Rebuild TypeScript cache
rm -rf node_modules/.cache
npm run typecheck
```

**better-sqlite3 rebuild fails**

```bash
# Force rebuild
npm rebuild better-sqlite3

# If still failing, ensure native build tools:
# macOS: xcode-select --install
# Windows: npm install -g windows-build-tools (run as admin)
# Linux: sudo apt install build-essential python3
```

### Performance Tips

- Use `npm start -- --max-workers=2` on lower-spec machines
- Disable Hermes debugging if not needed: `--no-dev --minify`
- Use `EXPO_NO_DOTENV=1` to skip .env loading in CI

## Useful Aliases

Add to your shell config (`.zshrc`, `.bashrc`, etc.):

```bash
alias ss="npm start"
alias ssi="npm run:ios"
alias ssa="npm run:android"
alias ssw="npm web"
alias sl="npm run lint"
alias st="npm run typecheck"
alias stest="npm test"
alias sverify="npm run verify"
alias sdoctor="npm run doctor"
alias sreset="npm start:onboarding"
```

## CI/CD Environment

For GitHub Actions / CI:

```yaml
# .github/workflows/ci.yml references
# - Node 20
# - pnpm (for caching) or npm
# - Expo CLI via npx
# - Android emulator (for instrumented tests)
# - Xcode (for iOS builds on macOS runners)
```

---

_Last updated: 2026-08-10_
