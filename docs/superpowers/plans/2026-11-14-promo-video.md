# SariSari Promo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a 40-second 9:16 promo video for SariSari that hooks sari-sari store owners on the forgotten-utang problem and asks them to message the page to become testers.

**Architecture:** AI-generated live-action clips (Higgsfield) carry the story; every app screen is a real screenshot shown as a full-frame insert cutaway. A separately produced Taglish voiceover and burned captions carry the words. All pieces are assembled in a video editor against a fixed timeline.

**Tech Stack:** Higgsfield Soul 2.0 (`soul_2`) for stills, Seedance 2.5 (`seedance_2_5`) for clips, the SariSari app on an Android device or emulator for screenshots, CapCut (or any timeline editor) for assembly.

**Spec:** `docs/superpowers/specs/2026-11-14-promo-video-design.md`. All prompts, shared blocks, the voiceover script, and the screenshot table live there. This plan refers to them by ID (R1-R5, Scene 1-8, U1-U7) and does not repeat them.

## Global Constraints

- Format: 9:16, 1080x1920, 40 s target, hard range 30-45 s.
- No generated shot may show a readable app screen. Every pixel of UI comes from the real app.
- Screenshots use fictional demo data only. No real customer names, contacts, or amounts.
- Shared prompt blocks ([NENE], [BRYAN], [STORE], [LOOK], [NEG]) are pasted unchanged into every prompt that names them.
- The suki character is Kuya Bryan everywhere: in prompts and in the demo data for U1 and U2.
- Voice: Taglish, warm, never a SaaS pitch. Say tindero, suki, may-ari; never "user".
- No shot runs longer than 3 seconds without a cut or an insert.
- Captions sit in the top third, two lines maximum.
- Higgsfield generation spends credits. The agent states the quoted cost and gets a yes before each generation batch.
- Working files live outside the repository. Only the final export enters the repository, and it is not committed automatically.

## Review Focus

1. Sound off: a viewer with muted audio must still follow the whole story from captions alone. Checked in Task 8.
2. Platform overlays: Facebook Reels and TikTok cover the bottom and right edges with buttons and the caption text. No caption, number, or call to action may sit there. Checked in Task 7 and Task 8.
3. Small old phones: the one number highlighted in each UI insert must be readable on a 6-inch screen at arm's length. Checked in Task 6.
4. Fake UI slipping through: a generated take that shows any screen content must be rejected, even if the acting is the best take. Checked in Task 3.
5. Stale or personal data: screenshots must match the build testers will receive and contain invented data only. Checked in Task 1 and Task 8.

## File Structure

Working folder, outside the repository: `D:\giomj\Projects\sarisari-promo\`

| Path        | Holds                               |
| ----------- | ----------------------------------- |
| `screens\`  | U1-U7 screenshots and recordings    |
| `refs\`     | Approved reference stills R1-R5     |
| `drafts\`   | 480p draft clips                    |
| `clips\`    | Final 1080p clips                   |
| `audio\`    | Voiceover lines, music, ambience    |
| `graphics\` | UI inserts and the end card         |
| `edit\`     | Editor project file                 |
| `log.md`    | Job IDs, chosen takes, credit spend |

Repository output: `docs/videos/sarisari-promo-40s.mp4`

---

### Task 1: Workspace, demo data, and screenshots

**Owner:** the app owner (manual).

**Produces:** `screens\U1.png` through `screens\U6.png` (or `.mp4` for recordings), `screens\U7-wordmark.png`, `screens\U7-sari-success.png`.

- [ ] **Step 1: Create the working folder**

Create `D:\giomj\Projects\sarisari-promo\` with the eight entries from the File Structure table.

- [ ] **Step 2: Enter fictional demo data in the app**

Use a fresh install or a spare device so no real store data is present. Enter:

- Six suki: Kuya Bryan, Aling Baby, Ate Marites, Mang Caloy, Nanay Linda, Kuya Dodong.
- Kuya Bryan: two utang entries (for example 85 and 120 pesos) on different days, then one bayad of 100 pesos, leaving 105 pesos owed.
- The other five suki: one utang entry each, different amounts.
- Eight products across sachets, canned goods, drinks, and snacks, with generic names. Set one product's stock below its low-stock threshold.
- Three cash sales for today.

- [ ] **Step 3: Prepare the device**

Set the app language to Filipino where supported. Turn on Do Not Disturb, clear notifications, charge to full. Use Android's System UI demo mode if available for a clean status bar.

- [ ] **Step 4: Capture U1-U6**

Follow the "Screenshots needed" table in the spec. For U5, turn on airplane mode first and confirm both the airplane icon and the offline status chip are visible. For U6, complete the day's cash close-out first, then capture the cash session card.

- [ ] **Step 5: Export U7**

Export the SariSari wordmark and the Sari mascot success state with transparent backgrounds at 1080 px wide or larger.

- [ ] **Step 6: Verify**

Each file passes all of these:

- Portrait, full screen, native resolution.
- No real names, phone numbers, or amounts from a real store.
- Status bar clean.
- The item listed under "What must be visible" in the spec is on screen and not cut off.
- U1 and U2 both show Kuya Bryan, and the U2 balance equals utang minus bayad.

If U6 does not show the day's sales and cash on hand as the spec assumes, note what it does show in `log.md`; scene 7's insert will use that instead.

---

### Task 2: Reference stills

**Owner:** agent with Higgsfield access, or manual in the Higgsfield app.

**Consumes:** spec section "Reference stills" and "Shared prompt blocks".
**Produces:** `refs\R1.png` through `refs\R5.png`, with job IDs in `log.md`.

- [ ] **Step 1: Expand the prompts**

For each of R1-R5, replace every bracketed block name with its full text from the spec. Save the five expanded prompts in `log.md`.

- [ ] **Step 2: Confirm cost**

State the credit cost for five Soul 2.0 images at 9:16, quality 2k, and wait for a yes.

- [ ] **Step 3: Generate R1-R5**

Model `soul_2`, aspect ratio 9:16, quality 2k, no reference image.

- [ ] **Step 4: Review against the checklist**

- R1: matches [NENE] in age, hair, dress, and necklace; face is natural; expression neutral.
- R2: matches [BRYAN]; jersey has no readable text or number.
- R3 and R4: no people, no legible signage, no brand logos; same counter, grille, and shelves in both.
- R5: handwriting is illegible scribble, not readable words.

- [ ] **Step 5: Redo failures**

Regenerate any still that fails. For R1 or R2 redos, pass the closest previous take as the reference image. Stop after three redos of one still and ask the owner which take to accept.

- [ ] **Step 6: Owner approval**

Show all five stills to the owner. Do not start Task 3 until all five are approved. Save the approved files and record their media IDs in `log.md`.

---

### Task 3: Draft clips

**Owner:** agent with Higgsfield access, or manual.

**Consumes:** approved R1-R5; spec scenes 1-7.
**Produces:** eight approved 480p drafts in `drafts\` named `S1`, `S2`, `S3`, `S4a`, `S4b`, `S5`, `S6`, `S7`, with draft job IDs in `log.md`.

- [ ] **Step 1: Expand the prompts**

For each clip, replace block names with full text. In scene 1, the man at the window is [BRYAN]. Save the expanded prompts in `log.md`.

- [ ] **Step 2: Confirm cost**

State the credit cost for eight drafts and wait for a yes.

- [ ] **Step 3: Generate drafts**

Model `seedance_2_5`, mode `omni_reference`, aspect ratio 9:16, `draft: true`, `generate_audio: true`. Durations and `image_references` per clip:

| Clip | Duration | image_references |
| ---- | -------- | ---------------- |
| S1   | 5 s      | R1, R2, R3, R5   |
| S2   | 6 s      | R1, R3, R5       |
| S3   | 4 s      | R1, R3, R5       |
| S4a  | 4 s      | R1, R2, R3       |
| S4b  | 4 s      | R1, R2, R3       |
| S5   | 5 s      | R1, R3           |
| S6   | 5 s      | R1, R3           |
| S7   | 6 s      | R1, R4           |

- [ ] **Step 4: Review each draft**

Reject a draft if any of these is true:

- Any phone screen content is visible, however briefly.
- Aling Nene's face, hair, or dress differs from R1.
- Hands, fingers, or coins are distorted.
- Legible or near-legible text appears on signs, packaging, or the notebook.
- The clip lacks a clean usable stretch as long as its slot in the Task 7 timeline.
- The audio contains speech or music.

- [ ] **Step 5: Redo failures**

Regenerate rejected clips. If the only fault is audio, regenerate with `generate_audio: false`. If hands fail twice in S2 or S5, widen the framing by changing "Close-up" to "Medium shot" in the prompt. Stop after three redos of one clip and ask the owner.

- [ ] **Step 6: Owner approval**

Show all eight drafts in story order. Do not start Task 4 until all eight are approved.

---

### Task 4: Final clips

**Owner:** same as Task 3.

**Consumes:** approved draft job IDs.
**Produces:** `clips\S1.mp4` through `clips\S7.mp4` (eight files) at 1080p.

- [ ] **Step 1: Confirm cost**

State the credit cost to finalize eight drafts at 1080p and wait for a yes.

- [ ] **Step 2: Finalize**

For each approved draft, run `seedance_2_5` with `draft_job_id` set to that draft's job ID and resolution 1080p.

- [ ] **Step 3: Verify**

Each file is 1080x1920, plays fully, and matches its draft. Re-run the Task 3 rejection checklist at full resolution, since small text and screen content can become visible at 1080p. A clip that now fails goes back to Task 3 Step 5.

- [ ] **Step 4: Download**

Save all eight files to `clips\`.

---

### Task 5: Voiceover

**Owner:** the app owner.

**Consumes:** spec section "Voiceover script".
**Produces:** `audio\vo-2.wav` through `audio\vo-8.wav`, one file per scripted line, named by scene number.

- [ ] **Step 1: Choose the voice**

Preferred: a real Tagalog speaker, a woman in her 40s or 50s, recorded on a phone in a quiet room with a blanket over hard surfaces. Fallback: a generated voice, accepted only if a native speaker confirms the pronunciation of every line.

- [ ] **Step 2: Record**

Record each of the seven lines three times, conversational and unhurried, as if explaining to a neighbor.

- [ ] **Step 3: Check length**

Each chosen take must fit its slot:

| Line | Scene | Maximum length |
| ---- | ----- | -------------- |
| 1    | 2     | 4.0 s          |
| 2    | 3     | 2.0 s          |
| 3    | 4     | 4.0 s          |
| 4    | 5     | 5.0 s          |
| 5    | 6     | 4.5 s          |
| 6    | 7     | 4.0 s          |
| 7    | 8     | 3.5 s          |

- [ ] **Step 4: Verify**

No background noise, no clipping, and each line sounds like a person talking to a neighbor rather than reading an advertisement. Re-record any line that fails.

---

### Task 6: UI inserts and end card

**Owner:** the app owner, in the editor or any image tool.

**Consumes:** `screens\U1`-`U7`.
**Produces:** `graphics\insert-U1.png` through `graphics\insert-U6.png` (or `.mp4` for recordings), and `graphics\end-card.png`, all 1080x1920.

- [ ] **Step 1: Build the insert template**

A 1080x1920 canvas filled with the app's paper-tone background. A plain black phone frame centered, about 80 percent of canvas height, with no brand marks.

- [ ] **Step 2: Place each screenshot**

Put U1-U6 inside the frame. Add one soft circle highlight per insert on the value the viewer should read:

| Insert | Highlight                    |
| ------ | ---------------------------- |
| U1     | Kuya Bryan's row and balance |
| U2     | The balance still owed       |
| U3     | The cart total               |
| U4     | The low-stock item           |
| U5     | The offline status chip      |
| U6     | The day's sales figure       |

- [ ] **Step 3: Build the end card**

Paper-tone background. Sari in its success state centered. Wordmark below. Then the line "Gusto mong mauna? I-message kami." and the Facebook page name beneath it. Keep everything inside the middle 70 percent of the canvas height.

- [ ] **Step 4: Verify legibility**

Open each insert on a phone at normal brightness and hold it at arm's length. The highlighted value must be readable in under one second. If it is not, crop the screenshot tighter so the value is larger, and re-check.

---

### Task 7: Assembly

**Owner:** the app owner, in CapCut or another timeline editor.

**Consumes:** `clips\`, `graphics\`, `audio\`.
**Produces:** `edit\` project file with a complete 40-second timeline.

- [ ] **Step 1: Set up the project**

1080x1920, 30 frames per second.

- [ ] **Step 2: Lay the picture track**

| Time      | Source                          |
| --------- | ------------------------------- |
| 0.0-3.0   | S1                              |
| 3.0-8.0   | S2                              |
| 8.0-11.0  | S3, wordmark fades in from 10.5 |
| 11.0-13.0 | S4a                             |
| 13.0-14.5 | insert U1                       |
| 14.5-17.0 | insert U2                       |
| 17.0-19.0 | S4b                             |
| 19.0-21.5 | S5                              |
| 21.5-23.0 | insert U3                       |
| 23.0-25.0 | insert U4                       |
| 25.0-28.0 | S6                              |
| 28.0-30.0 | insert U5                       |
| 30.0-32.0 | S7, first part                  |
| 32.0-34.0 | insert U6                       |
| 34.0-36.0 | S7, last part                   |
| 36.0-40.0 | end card                        |

Trim each AI clip to its strongest stretch. Give every insert a slow 3 percent scale-in.

- [ ] **Step 3: Lay the voiceover**

Start each line about 0.3 seconds after its scene begins. Scene 1 has no voiceover.

- [ ] **Step 4: Add captions**

Burn in the caption text from the spec for each scene. Large, bold, high contrast, two lines maximum, positioned between 12 and 35 percent from the top of the frame. The scene 1 caption is on screen from the very first frame.

- [ ] **Step 5: Add sound**

Music: light acoustic, licensed for commercial use on Facebook and TikTok, entering at 8.0, dipping under the rain from 25.0 to 30.0, resolving at 36.0. Ambience: street sound under scenes 1-5, rain under scene 6, quiet night under scene 7. Keep music well below the voiceover.

- [ ] **Step 6: Verify the timeline**

- Total length between 30 and 45 seconds.
- No shot longer than 3 seconds without a cut or an insert.
- No caption, highlighted value, or call to action in the bottom 20 percent or the right 15 percent of the frame.
- The end card holds still for at least one full second.

---

### Task 8: Quality check and export

**Owner:** the app owner.

**Produces:** `docs/videos/sarisari-promo-40s.mp4`.

- [ ] **Step 1: Watch muted**

Play the whole edit with sound off. The story must be clear from captions alone: the dispute, the mess, the app, the settled utang, the fast sale, the rain, the calm close, the invitation. Fix any scene that is unclear.

- [ ] **Step 2: Watch on a phone**

Export a test file and watch it on a mid-range Android phone inside the Facebook Reels preview. Confirm nothing important is hidden behind the platform's buttons or caption area.

- [ ] **Step 3: Honesty check**

Step through every AI clip frame by frame. No frame may show invented screen content. Every app screen in the video is one of U1-U6.

- [ ] **Step 4: Freshness and data check**

Compare U1-U6 against the build testers will receive. If any screen has changed, recapture it per Task 1 and rebuild that insert per Task 6. Confirm again that no real customer data appears.

- [ ] **Step 5: Show one store owner**

Show the video to at least one real sari-sari store owner without explanation. Ask what the app does and what they would do next. If they cannot answer both, revise the unclear scene before posting.

- [ ] **Step 6: Confirm the call to action works**

The Facebook page named on the end card exists, accepts messages, and has someone ready to reply to tester requests.

- [ ] **Step 7: Export**

1080x1920, H.264, 30 frames per second, AAC audio. Save to `docs/videos/sarisari-promo-40s.mp4`. Do not commit; the owner decides whether a binary of this size belongs in the repository.
