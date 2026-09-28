# Regression test matrix — 2026-09-22
| Command / suite | Observed result | Limits |
|---|---|---|
| npm run test:integration | PASS: 32 tests, 0 failures | Local runtime only |
| API suite | PASS: 18 tests | Real local workerd + D1, production handlers/middleware |
| Storage/queue suite | PASS: 9 tests | Browser Storage harness, not native storage test |
| React store sync | PASS: 1 workflow | Actual store mounted; storage/events harness, offline |
| Updater security helpers | PASS: 4 tests | Real generated Ed25519 keys; not Windows install |
| npm run test:security | PASS | Source-pattern guards only |
| npm run test:accounting | PASS: 17 inherited checks | Formula tests, not full application E2E |
| npm run lint | PASS | Scoped ESLint rules; not a security proof |
| npm run build | PASS | Bundle-size warning remains |
| typecheck | NOT RUN / missing gate | Must be added meaningfully |
| Android/Electron/browser E2E | NOT RUN | No certification |

CI runs install, lint, tests and build; hosted CI execution has not been observed. New tests are included through npm run test:integration.
