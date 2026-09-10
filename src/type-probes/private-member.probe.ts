// NEGATIVE PROBE — must NOT compile.
//
// The five members below are `private` in the core, reaching the `.d.ts` only
// as bare `private name;` declarations — no signature, inaccessible outside the
// class. TypeScript erases `private` at runtime, so the proxy forwards them; the
// EXPORTED TYPE must still refuse them, or this binding would be presenting
// core implementation detail as its own API.
//
// Expected: error TS2339 on every line. Asserted by `src/type-surface.test.ts`.
// Excluded from `tsconfig.json` so `npm run typecheck` stays green.
import { LangsysApp } from '../index.js';

LangsysApp.applyAuthorization;
LangsysApp.getUserLanguagePreferences;
LangsysApp.parseAcceptLanguageHeader;
LangsysApp.findBestLocaleMatch;
LangsysApp.resolveLocale;
