# Five-item remediation checkpoint — 2026-10-04

Requested scope: cash-drawer closing, large-company conflict settlement, complex financial conflicts, reproducible server deployment from Git, and Windows update installation.

Baseline: main at 84022ebb008b06c4802998485f165ae7a14e0261; published runtime 2.6.14. No new release is certified by this checkpoint.

| Item | State | Next verification |
| --- | --- | --- |
| Drawer closing | OPEN | Complete signed login/device authorization, actual financial journal integration, replay, recovery and native workflows before enabling the gate. Keep approved offline-first, 24-hour authorization and separate drawer/shift identities. |
| Large-company settlement | OPEN | Replace the 2,000-event full-history restriction with an audited bounded checkpoint/replay design; do not merely increase the limit. |
| Complex financial conflicts | OPEN | Support only actual valid business operations with independent balance/stock/reversal tests; retain both originals and owner choice. |
| Server from fresh Git | VERIFIED | Scoped compatible bundle from clean clone of d5b31bcdf325b5832b81d1e3cd1783bd3f8c3396, npm ci/build, 146-file generator, Wrangler compilation and deployment 5b8efbd8 succeeded. Live health, unauthenticated denial and owner-review/receipt smoke pass. No migrations or cash enablement; not comprehensive platform certification. |
| Windows installer | FIXED_NOT_VERIFIED | Replaced shell commands with a source-built .NET Windows helper, copied outside installed resources to avoid NSIS file locks. Application shutdown waits for atomic readiness; helper captures the exact parent handle, checks signed manifest checksum before/after exit, visibly launches installer and retains stage/error journal. Native target launch after parent exit and wrong hash/parent denial pass. NSIS package builds and includes helper. Actual installed-application upgrade remains unverified; no user installation was changed. |

Usage was 69% of the five-hour window and 54% of the weekly window when work started. This is an early recovery checkpoint, not evidence that the five items are complete.

Preserve unrelated untracked live-probe files. Never include private fixture credentials, D1 exports, OAuth tokens or signing keys in commits.

## Current evidence and next step

Experimental targeted installer tests: 7/7 passed in one run; later repetitions had native launch failures (including EPERM). A subsequent focused native survivor test passed. Final experimental broad run: 245 tests, 243 passed, 2 native failures. Defender event 1116 reported Trojan:Win32/Commando.A!ml at the same times; the detected path mentioned PowerShell and EncodedCommand. This does not independently establish malicious infection or a certified false positive. No security exception, exclusion or bypass was attempted. The experimental runtime changes and fixture were removed, so these counts are diagnostic evidence, not tests of the remaining worktree. Lint and core typecheck passed before removal.

Production candidate: scratch/production-bundle-DAeMZR; Wrangler Pages Functions compilation passed. No Cloudflare deploy or schema change was made. The generated manifest includes uncommitted inputs and is not a release certificate.

First next action: verify current documentation and checks, commit the scoped candidate, then verify the server bundle from a clean committed Git checkout. Rebuild the latest Windows package and test an actual NSIS upgrade with protections active. Continue the other three features with independent reconciliation tests; do not enable cash prematurely.

## Resumed implementation

The rejected prototype above is historical evidence. It was replaced by electron/native/UpdateHelper.cs and electron/update-installer.cjs. Native tests compile a harmless source-visible installer fixture: parent exit, successful exact target launch, wrong checksum and wrong parent identity are exercised with security protections active. Packaging builds the helper and includes it as an extra resource; staging builds follow the same path. Tests prove native handoff, not completed NSIS installation. The helper never kills processes or suppresses security warnings. A timeout/failure writes a cancellation marker so delayed readiness cannot authorize a later installation.

Complex replay fix: tenant-wide stock transfers were incorrectly rejected as branchless financial records. Replay now validates the same-group source decrease and destination increase against audited quantity, counts each once, and rejects missing/changed pairs. Independent accounting reconciliation and transfer tests pass. This does not close every complex financial conflict.

Reproducibility hardening: pinned normalized hashes of three compatibility inputs refuse silent stale overrides when main handlers change. Bundle test proves source drift is rejected. Fresh committed checkout and live deployment are the next required evidence.

Latest regression: 5 security, 244 integration, 13 review and 3 native-helper tests pass without skips. Seventeen inherited formula checks remain separate, not E2E. The production-bundle guard passes separately. Cash primitives additionally reject another cashier posting to or closing the original cashier's shift; this is not shared-journal integration or production enablement.

Final scoped deployment evidence: GitHub quality gates 37219367640 succeeded. Clean independent local clone built the production bundle, deployed at https://5b8efbd8.khodar-pos.pages.dev. Production page/health/release metadata return 200 and unauthenticated pull 401. Live disposable-owner browser review and receipt recovery pass with no page errors; first navigation attempt timed out, retry passed after adding failure screenshot diagnostics (root cause of the transient timeout not certified). Current Windows NSIS package rebuilt and helper resource present, but no actual installed upgrade or new public binary release.

## Local cash-source proof follow-up

Server-issued grants optionally bind a per-enrollment P-256 event public key. Client enrollment requires this binding and encrypts its private key with password-derived AES-GCM, authenticating the exact signed grant as additional data. Only password-unlocked handles can sign full immutable sources; changing amount, ID, timestamp, preconditions, grant identity or uploading device fails verification. Proof verification is not server acceptance: revocation, physical drawer writer assignment and serial financial replay still need wiring.

Shared drawer commit supports a synchronous financial callback and signs the resulting outbox group before atomically committing user aggregate plus shared journal. Source amount/ID/shift must match the cash entry; failed paired writes and mismatched movement roll back. Sources are preserved across close. Actual application login/sale/push integration and full backup/device workflows remain OPEN; no cash enablement or new deployment occurred in this follow-up.

Current local regression: 5 security +247 integration +13 review +3 native-helper tests pass, no skips; 17 inherited formula checks are separate. Twenty-one focused cash/grant tests and six targeted actual API cases pass; lint and full typecheck pass. Local Windows installation is awaiting final action-time confirmation after private installation/user-data backup. Installed starting version was2.6.12; candidate package is locally built2.6.14, not a replacement for immutable public release assets.

Subsequent Windows evidence: user confirmed final install; actual NSIS wizard completed upgrading2.6.12 to locally built2.6.14 and application launched with local database ready. Installed native helper exists and hash matches the local build. No Retry dialog occurred in the manual upgrade. This is bootstrap/manual installation evidence, not a complete in-app download/install journey. Login screen default store code changed toBRK-101; user asked to log in toBRK-000 and verify prior financial records. Do not certify preserved business data solely from successful launch. Private backup retained; no public binary release or security-warning bypass.

Hosted follow-up: run37221158729 failed246/247 on a shared-fixture login rate bucket (429), not a passed gate. Fixture login now isolates default connection identity; production rate limiting is unchanged. Local integration rerun247/247 passes, and a new real API test proves a shared client still receives429 on attempt16 with Retry-After60. Next hosted run remains to be verified. IndexedDB file comparison found7 before/7 after with0 missing old files; this is not row-level financial validation.
