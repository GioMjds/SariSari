# Security Policy

We take the security and privacy of **SariSari** users seriously. This document outline how security is managed in this project and how to report any vulnerabilities.

---

## Supported Versions

Only the latest release version is actively supported with security updates.

| Version | Supported |
| ------- | --------- |
| >= 1.0.x| Yes       |
| < 1.0.0 | No        |

---

## Security Architecture & Assumptions

SariSari is built as a **hard offline-first** application. Understanding the following security posture helps in contributing securely:

1. **Local Data Storage**: All customer ledger rows, sales entries, inventory balances, and cash sessions are stored locally in an SQLite database using `expo-sqlite`.
2. **No Centralized Database**: There is no remote central backend database holding customer data. Compromising our servers will not yield user business data since there is no sync back to our infrastructure.
3. **Backup Transfers**: Manual or scheduled database backups (e.g. transfers/saves to user-controlled cloud drives such as Google Drive) rely on device OAuth keys and native file sharing APIs. They are executed directly from the client to the provider.

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately. Do not open a public GitHub issue for security vulnerabilities.

### Reporting Process
1. Send an email to **giomjds@gmail.com** detailing the vulnerability.
2. Include steps to reproduce, potential impact, and details about the device/environment you tested it on.
3. We will acknowledge receipt of your report within 48 hours and work with you to analyze and patch the vulnerability.

### Disclosure Policy
We follow a responsible disclosure policy. We ask that you do not publish details of a vulnerability until we have patched it and released an updated version.
