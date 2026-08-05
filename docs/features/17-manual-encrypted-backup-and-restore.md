# 17. Manual Encrypted Backup and Restore

> Phase: Later

## Problem

The store's entire business lives on one phone. If the phone is
lost, broken, stolen, or upgraded, everything is gone: catalog,
sales history, suki balances, all of it. The owner has heard
horror stories from other store owners who lost their books. They
want a way to back up, but they do not want to create a cloud
account, do not want their sales data uploaded to a server they
cannot see, and do not want auto-sync they did not ask for.

## User Story

As a store owner, I want to manually back up the entire local
database to a file I control, and restore from that file on a new
device, so my business survives a phone loss without giving up
control of my data.

## In Scope

- A "Backup" action in Settings that produces a single encrypted
  file containing the full SQLite database.
- The file is exported through the device's native share / Files
  flow (so the owner can save it to local storage, a USB drive, or
  any cloud destination they already trust).
- The encryption key is derived from a passphrase the owner sets
  at backup time (and re-enters at restore time). No key escrow,
  no server-side recovery.
- A "Restore" action that reads a backup file, validates the
  encryption, and replaces the current database. Restore is
  destructive; the owner must confirm.
- A "Restore to new device" onboarding path for a new device that
  has no existing data — it skips the destructive step and just
  imports.

## Out of Scope

- Automatic or scheduled backups. Manual only.
- Cloud sync, account-based recovery, or any server component.
- Incremental or differential backups. The first cut is a full
  snapshot each time. The file should be small enough that the
  overhead of full-snapshot is acceptable.
- Backup of `inventory_events`-style audit tables is in scope as
  part of "the full database," but the implementation should be
  clear that historical performance data is included.

## Data Implications

- The backup is the SQLite file. No new tables. A new module
  (e.g. `lib/backup.ts`) handles file packaging, encryption, and
  decryption.
- The encryption must use a vetted algorithm (AES-GCM with a
  passphrase-derived key via Argon2 or scrypt). Pin the choices;
  do not change them later without a migration path for existing
  backups.
- The SQLite file's WAL and SHM side-files must be checkpointed
  before backup, otherwise the export can be inconsistent. This
  is a code-path concern, not a schema one.
- Restore: the import must run on a quiet database (no open
  transactions, no in-flight queries). The implementation should
  document the "stop the app and replace" semantics clearly.
- No migration on the database. The backup is opaque.

## Dependencies

- None on the data layer. The feature is orthogonal to the rest
  of the schema.
- Should be designed alongside the dev reset path
  (`app/(tabs)/dev/reset.tsx`) so the two do not step on each
  other.

## Open Questions

- Where does the encryption happen — in JS or in a native module?
  JS is simpler but slower for a multi-MB database. Decide based
  on acceptable backup time on a low-end Android.
- What is the backup file format? A single encrypted file
  containing a SQLite snapshot, plus a small unencrypted header
  with version and schema version (so the restore can warn if the
  backup is from a newer app version).
- Is "Restore" idempotent? Replacing the active database is
  destructive; if the owner has made new sales since the backup
  was taken, those sales are lost on restore.

## Feasibility Notes

- This is a security-sensitive feature. The encryption choice
  should follow the same "use a vetted library, do not hand-roll"
  rule as feature 11.
- A passphrase-derived key is the right model: the owner
  controls who can read the backup. There is no recovery if the
  passphrase is lost; document this clearly.
- Performance: a year of sari-sari data is small (low MBs);
  encryption time is acceptable. Document the worst case at the
  time of design.
- Test the restore path end to end: backup on device A, restore
  on device B, verify catalog, sales, and suki balances are
  intact.
