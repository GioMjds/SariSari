# Statement of Intent: Ledger Safety & Suki Sharing

- **Outcome**: A critique and gap analysis evaluating SariSari's readiness for real-world owners, focusing specifically on ledger safety (offline database backup/restore) and suki trust (credit statement sharing).
- **User**: Filipino sari-sari store owners who need to safeguard their business records from device loss/theft and communicate clear debt statements to their sukis.
- **Why now**: The core mechanics (inventory, sales, utang) are built, but the app is too risky to run in the wild without data redundancy or a way to share balances.
- **Success**: A concrete assessment of existing gaps/limitations and an actionable plan for implementing local file-based backups and OS-native sharing of utang history.
- **Constraint**: 100% offline-first execution (no remote database, no proprietary API keys, no internet connection required for backing up or sharing).
- **Out of scope**: Direct cloud sync integration (e.g., automated background Google Drive/Dropbox sync) or automated SMS gateway integrations. Backups will be exported as local files, and sharing will rely on the OS-native Share sheet (Viber, Messenger, SMS, etc.).
