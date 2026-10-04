# Five-item remediation checkpoint — 2026-10-04

## Signed transport follow-up

Final local verification supersedes pending statements below: npm test exit0 with280 tests (5security,259integration,13review,3native), no failures/skips;17 inherited formula checks remain separate. Independent compatibility guard1, lint, typecheck, docs, Web build and Functions compilation pass. The staged transport is not App-level enablement or a five-item release certification. No live deployment.

Functions compilation succeeded for the generated147-file compatibility bundle; no deploy/schema mutation. The first full rerun258/259 failed at the older drawer-grant assertion because its independent Node time preceded the Workerd-issued onlineVerifiedAt. The assertion now uses its signed grant issue time; production time policy is unchanged. Final full rerun pending; lint/typecheck/production drift guard pass. Usage91% primary/71% weekly at check time; checkpoint before exhaustion.

Hosted run37225873239 failed the independent production-bundle drift guard, not financial tests. Reviewed d8165c0 changes add staged replay proof/original-actor behavior only; ordinary auth remains unchanged. The cash-disabled override is retained and the source pin updated with its explicit review rationale. The drift test failed before repair and passes after it. No production deploy or migration.

CloudflareSyncService now accepts an explicit staged drawerReplay configuration, disabled by default. Shared sources use authenticated cash/replay and paired local acknowledgement, never an unsigned fallback; unknown own sources remain visible. Current token/user/tenant/branch/config/repository/generation is checked across network and durable commit boundaries. A real service/AtomicStore fixture with fake HTTP proves stale account/branch responses retain original sources, then successful replay clears only exact own sources. Thirty focused checks and lint/full typecheck/security pass; Web build passes with its large-chunk warning. Full final suite and Functions compilation are pending at this checkpoint. App provisioning, real API-to-hook integration and remaining rollout prerequisites are still open.

## Latest local progress: assigned drawer writer and signed source replay

Final rerun supersedes pending statuses below: npm test exits0 with279 automated tests (5security,258integration,13review,3native), zero failures/skips. Seventeen inherited formula checks pass separately, not E2E. Lint/full typecheck/documentation checks pass; no credential pattern is found in canonical docs. This is a verified staged-code checkpoint, not five-item completion or a production release.

This supersedes historical waiting states below, not the production gates. At HEAD099986b73f5d419f2471d29fe2bf94feb1cb1038 on main, uncommitted staged migrations0027/0028 add one device writer per physical drawer and immutable original-source evidence in the same D1 batch. Company owners alone assign an already registered active device; no reassignment API exists until audited lost-device recovery. Signed grants carry server-derived drawerIds, principal type and credential version. The original source actor is restored through an opaque verified internal handle, never through untrusted caller identity overrides.

Local actual API/D1 coverage: original cashier A open/expense12/close88 then cashier B open; retry leaves one movement; altered signatures, foreign tenants, revoked devices and changed original credentials are denied; proof updates/deletes fail. Schema bootstrap parity passes. These are local fixtures, not live device certification.

Local acknowledgement primitive retains signed audit sources, verifies exact accepted IDs, preserves them on lost response or failed storage, does not split groups at100, and re-reads under the drawer lock before CAS to preserve concurrent additions. Not wired into production sync yet; default App.jsx has no grant-store provisioning. Full offline login beyond expired session, UI, backups, restore, and unsigned legacy cash endpoint bypass closure remain prerequisites. Cash stays disabled and migrations are not applied remotely. Large-history review and full in-app Windows update remain open.

Acknowledgement now pairs the current user's aggregate and the shared journal in one commitBatch. It clears only exact signed sources from that user's queue, retains another cashier's queue, and later clears already-accepted originals on that cashier's return without a network resend. Focused28 hook/journal/sync tests, lint, full typecheck and Web build pass; build retains a large-chunk warning. A subsequent full test run257/258 exposed a fixture clock-order failure in signed replay, diagnosed through an allowlisted time-validation reason. The fixture now places source time after both server grants; production time validation is unchanged. Final full rerun pending at this checkpoint. Usage read82% primary/69% weekly; no purchased/reset credits.

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
# متابعة محلية إضافية — 2026-10-04

ربط أحدث محلي: login الفعلي يصدر ويحفظ تصريحًا مشفرًا فقط إذا زُوّد cashGrantStore صراحة؛ فشل الإصدار لا يفشل الدخول العادي ويعيد offlineGrantStatus=unavailable، وعرضه للمستخدم لم ينفذ بعد. unlockCashDrawer يتحقق كلمة المرور والهوية والفرع والجهاز ومدة24h ويُلغي السياق عند الفشل والخروج أو تبدل الهوية أثناء الانتظار. اختبار lifecycle صار يستخدم unlock الفعلي بدل حقن مقبض، ويثبت رفض الجهاز الآخر وكلمة المرور الخاطئة والتصريح المنتهي. 27 اختبارًا مركزًا وlint/typecheck نجحت؛ لا E2E أجهزة لهذه المتابعة. جلسة التطبيق ما زالت شرطًا، فلا تزعم login offline كامل بعد انتهاء session. App.jsx لم يفعّل هذا الخيار، وserver writer/replay/UI/backup ما زالت مفتوحة. CI37223609647 ناجح للمصدر099986b السابق، لا تعديل هذه المتابعة.

الأحدث: رُبط الفتح والإقفال الفعليان بالحفظ المشترك والتوقيع opt-in، بمطابقة الحساب/الجهاز/الفرع/معرف الوردية. الاختبار الحقيقي للhook يبدأ بلا وردية ويثبت rollback الفتح والإقفال، ثم مصروف12 وبيع27 وإقفال رصيد115 بلا فرق وتسليم الدرج لحساب ثانٍ مع مصادر الأصل وعزل السجلات. مقارنة مرجع الدالة تمنع اختلاف أسماء bundler من تجاوز الربط. كذلك رُفض تصريح محاسب آخر عند cash/close، بعد اختبار فشل قبل الإصلاح. 10 اختبارات مركزة وlint/full typecheck نجحت. لا ربط login/UI/server writer/replay/backup بعد، ولا نشر/تفعيل؛ دليل repository الذاكرة ليس تحققًا native أو power-loss.

التحقق: npm test كامل ناجح (exit0)، وlint/full typecheck وفحص التوثيق ناجحة. لا اختبار native مالي جديد ولا نشر لهذه المتابعة؛ فحوص الصيغ17 ليست E2E.

أضيف ربط opt-in للحفظ الفعلي عبر cashDrawerContext في useAppStore. يُراجع commitDrawerFinancialAction أحداث saveInvoice/addExpense ومعرّفاتها وقيم النقد ووردية الحساب والجهاز، ويوقّع مصادر المجموعة قبل commitBatch المشترك دون إلحاق الحركة مرتين. اختبار hook فشل قبل الربط ثم نجح مع rollback المصروف والبيع والمخزون عند paired failure، وتوقيع المصادر وعدم تحريك الدرج بمصروف بنكي، ورفض الجهاز المختلف والتصريح غير الموثوق والحذف المالي غير المدعوم. اختبار repository الذاكرة لا يثبت power-loss أو مسار native. لا caller إنتاجي لهذا الخيار؛ login/UI/open-close/server assignment/replay/backup ما زالت تحتاج ربطًا واختبارات، والميزة معطلة.

أكد المستخدم ظهور البيانات السابقة بعد التثبيت اليدوي؛ لا يُغلق ذلك اختبار التحديث من داخل البرنامج أو يثبت الأرصدة مستقلًا. Hosted quality gates37221574777 نجحت للمصدرd836010.

كشف اختبار useAppStore الحقيقي أن اختيار أول وردية في الفرع يمنع مصروف صاحب وردية ثانية عندما تسبقها وردية محاسب آخر، ويختار عشوائيًا عند وجود ورديتين لصاحب الحساب. أُصلحت مطابقة الشركة/الفرع/المحاسب ورفض الحالة الملتبسة دون حفظ مصروف. السيناريوهان فشلا قبل الإصلاح؛ 15 اختبارًا مركزًا نجحت بعده. هذا إصلاح محلي غير منشور، لا اكتمال لإقفال الدرج أو ربط الحفظ الموقّع بالمسار الفعلي. يلزم استمرار تفويض الجهاز والحفظ المشترك وإعادة التشغيل والنسخ والاستعادة؛ البوابة معطلة.
