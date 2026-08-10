// Local type-only shim that redirects `expo-file-system/legacy` to the
// upstream `build/legacy/*.d.ts` declarations. The Expo SDK ships
// `main: src/index.ts` for this package, so a `from 'expo-file-system/legacy'`
// resolves to the `.ts` source — not the `.d.ts`. skipLibCheck does not
// apply to `.ts` files, and the source contains an upstream typing bug
// (`DownloadResumable.savable` assigns `string | undefined` to a
// `?: string` field) that fails under our strict tsconfig. Redirecting
// type resolution here means tsc reads only the `.d.ts` surface, which
// skipLibCheck already accepts.
//
// Runtime resolution is unaffected: Metro still resolves to the `.ts`
// source because tsconfig `paths` only applies to type-checking, not
// bundling.
export * from 'expo-file-system/build/legacy/index';