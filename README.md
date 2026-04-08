# Interactive Wall Calendar Challenge

A polished frontend-only interactive calendar built with Next.js and React, inspired by a physical wall calendar layout.

## What I Built

- Wall calendar aesthetic with a hero panel and calendar grid composition.
- Day range selection with clear visual states for:
  - Start date
  - End date
  - Dates in between
- Integrated notes section that supports:
  - Month-level notes (default)
  - Selected-range notes
- Responsive behavior:
  - Desktop: split panel layout (hero + calendar)
  - Mobile: stacked layout while keeping date selection and notes usable
- Client-side persistence via `localStorage` (no backend required).

## Tech Choices

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS utility classes
- **State Management**: React hooks (`useState`, `useMemo`, `useEffect`)

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key UX Details

- Clicking one day sets the start date.
- Clicking another day sets the end date (range auto-orders if clicked backwards).
- Clicking again after a complete range starts a new range.
- Notes are context-aware:
  - No complete range selected -> month memo
  - Complete range selected -> range memo

## Submission Links

- **Repository**: _Add your public GitHub/GitLab URL here_
- **Video Demo (Required)**: _Add Loom/YouTube/screen recording link here_
- **Live Demo (Optional)**: _Add Vercel/Netlify URL here_
