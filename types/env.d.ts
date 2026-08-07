// Environment variable type declarations for EXPO_PUBLIC_* variables.
// Add new public env vars here so TypeScript recognises them in process.env.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_FORCE_ONBOARDING?: string;
    }
  }
}

export {};
