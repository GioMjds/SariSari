# SariSari Promo Video Design

Date: 2026-11-14
Status: approved beat sheet, prompts ready for generation

## Goal

A 40-second vertical promo that makes a sari-sari store owner stop scrolling, recognize their own utang problem, and message the page to become a tester.

- Audience: Mang Bert / Aling Nene, 35-60, mid-range Android, Facebook-first (per `obsidian-vault/09-Marketing/strategy/audience-persona.md`).
- Voice: mainit, tapat, magaan; Taglish; never a SaaS pitch (per `obsidian-vault/09-Marketing/strategy/brand-voice.md`).
- Success: viewer watches past 3 seconds, then messages the page.

## Decisions

| Decision    | Choice                                                 |
| ----------- | ------------------------------------------------------ |
| Format      | 9:16, 1080x1920, 40 s (hard range 30-45 s)             |
| Channels    | Facebook Reels first, TikTok second                    |
| Story       | One tindera, one day, pain to relief                   |
| Hook        | Forgotten utang                                        |
| Live action | Higgsfield, AI-generated                               |
| App UI      | Real screenshots or recordings only, added in the edit |
| Words       | Taglish voiceover plus burned captions                 |
| End action  | Message the page to join testers                       |

## The honesty rule

No generated shot may show a readable app screen. AI generators invent interfaces, and an invented interface would break the "tapat" promise to the people who install the app. Every pixel of UI in the final video comes from the real app.

This is solved with insert cutaways, not screen tracking:

1. The AI shot shows the owner using the phone from behind the phone or at a steep angle, so the screen is not visible.
2. The edit cuts to a full-frame UI insert: the real screenshot inside a clean phone frame on a warm paper background.
3. The edit cuts back to the owner's reaction.

This needs no green screen and no motion tracking, and it works with still screenshots.

## Features shown, checked against the code

| Scene | Feature                     | Where it lives                                                                                                              |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 4     | Suki list and credit ledger | `app/(tabs)/customers/all.tsx`, `app/(edit-forms)/credit-details/[id].tsx`, `app/(edit-forms)/add-payment/[id].tsx`         |
| 5     | POS sale                    | `app/(tabs)/sales/pos.tsx`                                                                                                  |
| 5     | Low-stock alert             | `components/home/DashboardStockAlert.tsx` on `app/(tabs)/home/index.tsx`                                                    |
| 6     | Offline indicator           | `components/sales/pos/OfflineStatusChip.tsx`                                                                                |
| 7     | Daily cash close-out        | `components/home/CashSessionCard.tsx`; feature 03 is marked DONE in `obsidian-vault/02-Features/03-daily-cash-close-out.md` |

## Higgsfield setup

| Step             | Model                          | Settings                                                                  |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------- |
| Reference stills | Higgsfield Soul 2.0 (`soul_2`) | 9:16, quality 2k                                                          |
| Video clips      | Seedance 2.5 (`seedance_2_5`)  | mode `omni_reference`, 9:16, 1080p, `start_image` plus `image_references` |

Workflow per clip:

1. Generate with `draft: true` (480p) until the motion is right.
2. Finalize the chosen draft at 1080p with `draft_job_id`.
3. Keep `generate_audio` on for store ambience. If the clip produces speech or music, regenerate with it off and add ambience in the edit.

Seedance's minimum clip is 4 seconds. Generate each clip 1-2 seconds longer than its slot and trim in the edit.

## Shared prompt blocks

Paste these into every prompt where the scene calls for them. Keeping the wording identical is what holds the character and store consistent.

**[NENE]**

> Aling Nene, a Filipino woman in her early 50s, warm brown skin, soft round face, shoulder-length black hair with a few gray strands tied back in a low ponytail, wearing a faded coral duster house dress with a small floral print and a thin gold necklace, no makeup, kind tired eyes.

**[BRYAN]**

> Kuya Bryan, a Filipino man in his late 30s, lean build, short black hair, wearing a faded blue basketball jersey over a white t-shirt and rubber slippers.

**[STORE]**

> A small neighborhood sari-sari store in a Philippine barangay, seen from inside the counter. Wooden counter worn smooth, a steel grille window opening to the street, strings of hanging sachets in assorted colors, glass jars of candy on the counter, shelves of canned goods and bottled drinks behind. Packaging is generic with no readable brand names or logos.

**[LOOK]**

> Photorealistic, natural documentary commercial style, shot on a 35mm lens, shallow depth of field, warm natural color grade, soft film grain, authentic lived-in detail, vertical 9:16 framing.

**[NEG]**

> No readable text, no legible signage, no brand logos, no subtitles, no watermark, no visible phone screen content, no extra fingers, no distorted hands, no morphing faces, no camera shake, no cartoon style, no speech, no music.

## Reference stills

Generate these first with Soul 2.0. Approve them before any video work.

| ID  | Prompt                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Waist-up portrait of [NENE], standing behind the counter of [STORE], soft morning light from the grille window, looking slightly off camera with a gentle neutral expression. [LOOK] [NEG]                        |
| R2  | Portrait of [BRYAN] standing outside the grille window of a sari-sari store, late afternoon sun, leaning one forearm on the counter ledge. [LOOK] [NEG]                                                           |
| R3  | Empty wide shot of [STORE], no people, mid-afternoon warm sunlight through the grille casting striped shadows across the counter. [LOOK] [NEG]                                                                    |
| R4  | Empty wide shot of [STORE] at night, lit by a single warm bulb overhead, dark street beyond the grille, calm and quiet. [LOOK] [NEG]                                                                              |
| R5  | Close product-style shot of a worn spiral notebook lying open on a wooden counter, pages dense with handwritten pencil scribbles and crossed-out lines too messy to read, a cheap ballpen beside it. [LOOK] [NEG] |

Soul 2.0 accepts one reference image. For R3 and R4, pass no reference. For any redo of R1 or R2, pass the approved version back in.

## Scenes

Each scene lists the Higgsfield prompt, the references to attach, and what the edit adds. Durations are the final trimmed length.

### Scene 1: The dispute (0-3 s)

- Purpose: stop the scroll with a moment every owner has lived.
- References: `start_image` none; `image_references` R1, R2, R3, R5.
- Generate: 5 s.

> Medium shot from inside the counter of [STORE], mid-afternoon. [JUN] stands outside the grille window, leaning in, pointing firmly at a worn spiral notebook lying open on the counter, eyebrows raised, insisting. [NENE] stands inside, one hand flat on the notebook, frowning down at the page in confusion, then looking up at him uncertain. Slow push-in toward her face. Striped sunlight through the grille. [LOOK] [NEG]

- Voiceover: none. Let the tension sit.
- Caption (large, top third): "Bayad na raw siya. Sigurado ka ba?"
- Sound: street ambience, a tricycle passing.

### Scene 2: The mess (3-8 s)

- Purpose: escalate from one argument to a daily burden.
- References: `image_references` R1, R3, R5.
- Generate: 6 s.

> Close-up on the hands of [NENE] flipping quickly through a worn spiral notebook on a wooden counter, pages filled with messy pencil scribbles and crossed-out lines too chaotic to read. She stops, runs a finger down a page, shakes her head. Rack focus from the notebook up to her worried face. In the soft background, two neighbors wait at the grille window. Locked camera, gentle handheld breathing only. [STORE] [LOOK] [NEG]

- Voiceover: "Listahang magulo. Utang na nakakalimutan."
- Caption: same as voiceover.
- Sound: pages flipping, a child calling "Pabili po" faintly.

### Scene 3: The turn (8-11 s)

- Purpose: the pivot from problem to answer.
- References: `image_references` R1, R3, R5.
- Generate: 4 s.

> Medium close-up of [NENE] behind the counter of [STORE]. She closes the worn notebook and slides it aside, then picks up a simple black Android smartphone from the counter and holds it up in front of her chest, the back of the phone facing the camera so the screen is not visible. Her expression relaxes into a small knowing smile. Slow push-in. Warm afternoon light. [LOOK] [NEG]

- Edit: on the last half-second, the SariSari wordmark fades in over the lower third.
- Voiceover: "Kaya may SariSari."
- Caption: "Kaya may SariSari."
- Sound: music enters here, light and warm.

### Scene 4: The ledger (11-19 s)

- Purpose: the payoff for the hook. The same dispute, settled in two taps.
- References: `image_references` R1, R2, R3.
- Generate: two clips, 4 s each.

Clip 4a:

> Medium shot from inside the counter of [STORE]. [NENE] holds a black Android smartphone in one hand at chest height, tapping it calmly with her thumb, the back of the phone toward the camera so the screen is not visible. [BRYAN] waits outside the grille window, watching her. Locked camera. Afternoon light. [LOOK] [NEG]

Clip 4b:

> Medium two-shot at the grille window of [STORE]. [NENE] turns the black Android smartphone toward [BRYAN] across the counter, seen from the side so the screen is not visible to the camera. He leans in, reads it, then laughs and scratches the back of his head, conceding. She laughs with him, warm and without mockery. Locked camera. [LOOK] [NEG]

- Edit order: 4a (2 s), UI insert U1 (1.5 s), UI insert U2 (2.5 s), 4b (2 s).
- Voiceover: "Bawat utang, bawat bayad, nakalista."
- Caption: same as voiceover.

### Scene 5: The sale (19-25 s)

- Purpose: show the app is fast at the counter, and that it watches stock.
- References: `image_references` R1, R3.
- Generate: 5 s.

> Medium shot from the street side of the grille window of [STORE]. A young boy in a school uniform holds out coins. [NENE] takes a sachet from a hanging string and a canned good from the shelf, places them on the counter, taps a black Android smartphone lying flat beside the candy jars twice, and hands the items over with a smile. The phone screen faces away from the camera. Brisk natural movement. Locked camera. [LOOK] [NEG]

- Edit order: AI clip (2.5 s), UI insert U3 (1.5 s), UI insert U4 (2 s).
- Voiceover: "Mabilis ang benta. Alam mo agad kung ano ang paubos."
- Caption: same as voiceover.

### Scene 6: The rain (25-30 s)

- Purpose: prove the offline promise visually.
- References: `image_references` R1, R3.
- Generate: 5 s.

> Medium shot inside [STORE] during a heavy afternoon downpour, rain streaming past the grille window, the street outside gray and blurred, light dim and cool. [NENE] stands calmly behind the counter using a black Android smartphone held at chest height, the back of the phone toward the camera, unbothered, while a customer under an umbrella waits at the window. Slow push-in. [LOOK] [NEG]

- Edit order: AI clip (3 s), UI insert U5 (2 s).
- Voiceover: "Walang internet? Walang problema. Walang login."
- Caption: same as voiceover.
- Sound: rain on a tin roof, music dips under it.

### Scene 7: The close (30-36 s)

- Purpose: the emotional reward. A calm end to the day.
- References: `image_references` R1, R4.
- Generate: 6 s.

> Medium close-up inside [STORE] at night, lit by a single warm overhead bulb, the street beyond the grille dark. [NENE] closes a small wooden cash drawer, glances at a black Android smartphone resting on the counter with its screen facing away from the camera, then exhales and smiles quietly to herself, shoulders dropping in relief. She reaches up toward the light switch. Very slow push-in. [LOOK] [NEG]

- Edit order: AI clip (2 s), UI insert U6 (2 s), AI clip continues (2 s).
- Voiceover: "Ang kaha mo, malinaw. Araw-araw."
- Caption: same as voiceover.

### Scene 8: The invitation (36-40 s)

- Purpose: one clear action.
- Source: graphic only, no AI footage.
- Layout: warm paper background, Sari garapon mascot in its success state centered, SariSari wordmark below, call to action beneath.
- Voiceover: "Gusto mong mauna? I-message kami."
- Caption: "Gusto mong mauna? I-message kami." with the Facebook page name under it.
- Motion: Sari settles with a small bounce, then holds for a full second so the frame can be screenshotted.

## Screenshots needed

Capture these from the app with fictional demo data. Every name, amount, and product must be invented; no real customer information may appear.

Capture rules:

- Portrait, full screen, the phone's native resolution.
- App language set to Filipino if the screen supports it.
- Clean status bar: full battery, no notification icons, time set to match the scene.
- Use the same demo suki across U1 and U2: "Kuya Jun".
- A screen recording of 3-5 seconds is better than a still for U2 and U3, but a still is enough.

| ID  | Scene | Screen             | Route                                      | What must be visible                                                                                     |
| --- | ----- | ------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| U1  | 4     | Suki list          | `app/(tabs)/customers/all.tsx`             | 5-6 suki with balances; "Kuya Jun" near the top with an unpaid balance                                   |
| U2  | 4     | Credit details     | `app/(edit-forms)/credit-details/[id].tsx` | Kuya Jun's ledger: at least two utang entries, one bayad entry, and the live balance still owed          |
| U3  | 5     | POS                | `app/(tabs)/sales/pos.tsx`                 | A cart with 2-3 items and the total; ideally a recording of two taps adding items                        |
| U4  | 5     | Home, stock alert  | `app/(tabs)/home/index.tsx`                | The low-stock alert card with at least one item below its threshold                                      |
| U5  | 6     | POS, offline       | `app/(tabs)/sales/pos.tsx`                 | Phone in airplane mode: airplane icon in the status bar, the offline status chip, and a cart in progress |
| U6  | 7     | Home, cash session | `app/(tabs)/home/index.tsx`                | The cash session card showing the day's sales and cash on hand after close-out                           |
| U7  | 8     | Brand              | assets                                     | SariSari wordmark and the Sari mascot success state, transparent background                              |

Optional, if time allows: a recording of adding a payment in `app/(edit-forms)/add-payment/[id].tsx` with the balance dropping afterward. It can replace U2's still for a stronger scene 4.

## Voiceover script

One warm female voice, conversational, mid-40s to 50s, unhurried. About 45 words across 40 seconds, leaving room to breathe.

1. (Scene 2) "Listahang magulo. Utang na nakakalimutan."
2. (Scene 3) "Kaya may SariSari."
3. (Scene 4) "Bawat utang, bawat bayad, nakalista."
4. (Scene 5) "Mabilis ang benta. Alam mo agad kung ano ang paubos."
5. (Scene 6) "Walang internet? Walang problema. Walang login."
6. (Scene 7) "Ang kaha mo, malinaw. Araw-araw."
7. (Scene 8) "Gusto mong mauna? I-message kami."

## Edit notes

- Captions: large, bold, high contrast, placed in the top third so the Reels and TikTok interface does not cover them. Two lines maximum.
- UI inserts: real screenshot inside a plain phone frame, on the app's paper-tone background, with a slow 3 percent scale-in. Add a soft circle highlight on the one number the viewer should read.
- Music: light acoustic, enters at scene 3, dips under the rain in scene 6, resolves at scene 8.
- Pacing: no shot longer than 3 seconds without a cut or an insert.
- First frame: scene 1 must work as a thumbnail with the caption already on screen.

## Risks

| Risk                                          | Handling                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| Character drifts between clips                | Attach R1 to every clip and paste [NENE] unchanged                      |
| Generator draws a fake screen anyway          | Reject the take; the phone must face away or be at a steep angle        |
| Hands or coins render badly in scenes 2 and 5 | Regenerate in draft mode; fall back to a wider framing                  |
| Generated audio contains gibberish speech     | Regenerate with `generate_audio` off and add ambience in the edit       |
| Gibberish signage in the background           | [NEG] block plus shallow depth of field; reject takes with legible text |
| Screens change before launch                  | Recapture U1-U6 on the release build before the final export            |

## Out of scope

- Generating any footage or stills. This document is the plan and the prompts only.
- Paid ad variants, 15-second cutdowns, and horizontal versions.
- English-only version.
