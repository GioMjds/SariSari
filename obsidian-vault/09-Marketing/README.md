# 09-Marketing

Social-media planning, captions, and progress for SariSari. This folder is the
single source of truth for everything we say publicly about the app. Anything
that ends up on Facebook, LinkedIn, Instagram, or TikTok should land here first

- drafted, reviewed, and only then posted.

## Folder Layout

```folder
09-Marketing/
  README.md           # this file
  strategy/           # audience, voice, pillars, campaign plans
  channels/           # per-platform notes (FB, LinkedIn, IG, TikTok)
  calendar/           # posting calendar / cadence
  status/             # where each post is in the pipeline
  metrics/            # results after a post goes live
```

## Folder Purposes

- **strategy/** - long-form thinking. Who we are talking to, what we say, why
  we say it. Audience persona, brand voice, content pillars, campaign briefs.
- **channels/** - one note per platform with channel-specific conventions
  (length, hashtags, asset specs, posting windows, what works here). Draft posts
  can live as child notes under each channel or as standalone files inside
  `calendar/`.
- **calendar/** - the actual posting plan. Weekly or monthly views of what
  goes out when.
- **status/** - a lightweight Kanban-ish view of every post: idea, drafted,
  review, scheduled, posted. Pair this with `calendar/` - calendar is _when_,
  status is _where it is right now_.
- **metrics/** - post-mortem. After something goes live, drop the numbers
  here: reach, engagement, comments worth saving, lessons.

## Naming Conventions

- Channel notes: `channels/facebook.md`, `channels/linkedin.md`, etc.
- Strategy notes: `strategy/audience-persona.md`, `strategy/brand-voice.md`,
  `strategy/content-pillars.md`.
- Calendar entries: `calendar/2026-W32-weekly-plan.md` (ISO week) or
  `calendar/2026-09-monthly-plan.md`.
- Post drafts: `calendar/2026-08-12-launch-post-fb.md` (date + topic + channel).
- Status board: `status/posting-pipeline.md`.
- Metrics: `metrics/2026-08-12-launch-post-fb-results.md`.

Keep names kebab-case, dated when relevant, and short enough to scan in the
file list. Long captions stay inside the file, not in the filename.

## How a Post Flows Through This Folder

1. Idea captured in `status/posting-pipeline.md` under **Ideas**.
2. Drafted in `calendar/YYYY-MM-DD-topic-channel.md` with the full caption,
   asset list, and hashtags.
3. Review and tweak. Move the entry to **In Review** in the pipeline note.
4. Schedule or post. Move to **Scheduled** or **Posted**.
5. Once posted and the numbers are in, create a matching note under
   `metrics/` and link it back to the draft.

## Linking Rules

- Every draft should link back to a strategy note (pillar, audience, voice).
- Every metrics note should link back to its draft. The pipeline note links to
  both. That chain - `strategy -> draft -> metrics` - is what makes the vault
  useful for figuring out what to post next month.

## Templates

Templates live next to the notes that use them:

- [[strategy/strategy-template.md]] for campaign briefs and pillars
- [[calendar/post-template.md]] for individual post drafts
- [[metrics/metrics-template.md]] for post-mortems
- [[status/posting-pipeline-template.md]] for the status board

## Voice in One Line

Warm, friendly, indie-builder. Filipino-flavored when it lands, English when
the audience expects it. Optimistic, building-in-public, never preachy. See
[[strategy/brand-voice.md]] for the full guide.

## Last Updated

2026-08-10
