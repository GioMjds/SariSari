# Sari Art Prompt Sheet

Sari is the jar mascot and the app logo. These prompts produce the missing onboarding poses in the same flat style as `assets/images/sari-emotions/sari-sales-state.png`.

## Style anchor (paste at the start of every prompt)

Flat vector cartoon mascot, a glass jar with a terracotta-orange lid, dark purple outline of even weight, simple oval smiling eyes and a small open smile, thin white arms and legs, soft grey-white jar body with two pale highlight strokes, a flat terracotta oval shadow under the feet, transparent background, no text, square 1024x1024, centered with margin. Match the reference image `sari-sales-state.png` exactly in line weight, palette, and proportions. Avoid gloss, gradients, 3D shading, thick brown outlines, and sticker borders.

## Poses

1. **sari-welcome-state.png** (profile step): Sari waving hello with one raised hand, friendly closed-eye smile, slight lean toward the viewer.
2. **sari-celebrate-state.png** (ready step): Sari jumping with both arms up, a few flat confetti pieces in terracotta, gold, and sage around the jar, big open smile.
3. **sari-pointing-state.png** (Home checklist card): Sari standing, one arm pointing to the right, other hand on hip, encouraging expression.
4. **sari-onboarding-state.png** (redo, optional): the current file is a glossy sticker style that does not match the other states. If regenerated in the flat style, use a wave with a small "Sari's Shop" sign. It is no longer used by onboarding, so this is only for brand consistency.

## How to install

1. Export each PNG with a transparent background at 1024x1024.
2. Overwrite the matching file in `assets/images/sari-emotions/`. Items 1-3 already exist as placeholder copies of `sari-default-state.png`, so the app picks up the new art with no code change.
3. Restart Metro with a cleared cache (`npx expo start --clear`) if the old image still shows.
