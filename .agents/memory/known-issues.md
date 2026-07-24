# Memory: Known Issues & Pending Tasks

## Active Work Items & Gaps

### 1. Serverless API Endpoint (`api/contact.ts`)

- **Status**: Pending Implementation.
- **Description**: The `api/` directory is not yet created. Currently, `src/pages/Contact.tsx` simulates form submission with `setTimeout`. Real Nodemailer handler in `api/contact.ts` needs to be implemented.

### 2. Custom Hooks Extraction (`src/hooks/useContactForm.ts`, `src/hooks/useFeatureRequestsForm.ts`)

- **Status**: Pending Refactor.
- **Description**: Both hook files are currently 0 bytes. `src/pages/Contact.tsx` handles form state directly in local component state. Form logic should be refactored into `src/hooks/useContactForm.ts`.

### 3. Page Stubs & Unused Routes (`src/pages/Blog.tsx`, `src/pages/FeatureRequests.tsx`, `src/pages/_not-found.tsx`)

- **Status**: Stubbed.
- **Description**:
  - `src/pages/Blog.tsx` is an empty component shell.
  - `src/pages/FeatureRequests.tsx` returns minimal text.
  - `src/pages/_not-found.tsx` is an unused duplicate of `src/pages/NotFound.tsx`.

### 4. Zustand Store Initialization (`src/stores/`)

- **Status**: Empty Directory.
- **Description**: The `src/stores/` directory exists but contains no active store files. Global UI states (e.g. mobile drawer menu or alert banners) can be centralized into a Zustand store when needed.
