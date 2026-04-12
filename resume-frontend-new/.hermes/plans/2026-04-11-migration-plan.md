# HiHired Frontend Migration: CRA → Vite + Mantine

## Goal
Replace production CRA frontend with Vite + Mantine, connecting to real backend APIs.

## Approach
Copy 7 core logic files from production, adapt for Vite (env vars), wrap with Mantine UI.

## Steps

### Phase 1: Core Infrastructure (4 files)
1. Copy `api.js` → `src/api.js` (change `process.env.REACT_APP_*` → `import.meta.env.VITE_*`)
2. Copy `AuthContext.js` → `src/context/AuthContext.js`
3. Copy `ResumeContext.js` → `src/context/ResumeContext.js`
4. Copy `constants/templates.js` → `src/constants/templates.js`

### Phase 2: Supporting Files (3 files)
5. Copy `utils/jobDescriptions.js` → `src/utils/jobDescriptions.js`
6. Copy `constants/builder.js` → `src/constants/builder.js`
7. Copy `hooks/useResumeHistory.js` → `src/hooks/useResumeHistory.js`

### Phase 3: Setup
8. Install `@react-oauth/google`
9. Create `.env` with `VITE_API_URL=http://localhost:8081` and `VITE_GOOGLE_CLIENT_ID=...`
10. Update `main.jsx`: wrap with `GoogleOAuthProvider > AuthProvider > ResumeProvider`

### Phase 4: Update BuilderPage
11. Replace local useState with `useResume()` and `useAuth()` hooks
12. Connect all form fields to `data` / `updateData` from ResumeContext
13. Replace simulated AI calls with real API calls from api.js
14. Add real Google OAuth login in auth modal
15. Make Generate Resume button call real API

### Phase 5: Test
16. Test login flow (Google + email/password)
17. Test form data persistence
18. Test AI enhancement buttons
19. Test PDF generation
20. Test job matches

## Files Changed
- src/api.js (copied + adapted)
- src/context/AuthContext.js (copied)
- src/context/ResumeContext.js (copied)
- src/constants/templates.js (copied)
- src/utils/jobDescriptions.js (copied)
- src/constants/builder.js (copied)
- src/hooks/useResumeHistory.js (copied)
- src/main.jsx (updated providers)
- src/pages/BuilderPage.jsx (updated to use real hooks/API)
- .env (created)
- package.json (add @react-oauth/google)

## Risks
- Google OAuth may need domain config for localhost:5173
- CORS needs to allow Vite dev port
- Some CRA-specific patterns may need adaptation
