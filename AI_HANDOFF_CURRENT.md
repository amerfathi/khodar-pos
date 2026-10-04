# براكه — نقطة التسليم الحالية

## أحدث مهمة — توحيد التوثيق، 2026-10-04

المرجع الشامل الحالي هوREADME.md وdocs/INDEX.md و7أدلة فيdocs/current:ARCHITECTURE،USER_GUIDE،ACCOUNTING،SYNC_AND_RECOVERY،SECURITY،OPERATIONS،CHANGE_HISTORY. أضيفت ملاحظاتdocs/releases/2.6.14.md، وأُشير إلى60وثيقة قديمة كسجل تاريخي دون تغيير أدلتها. تقرير2.6.14 المنشور وسجل الموانع يحتفظان بالفرق بين التحقق المحدد والتغطية غير المنجزة.

هذه المهمة توثيق فقط: لا تغيير في المحرك المالي أوالمزامنة أوالهوية أوالمخطط، ولا إعادة بناء أو استبدال ثنائيات2.6.14. أضيفscripts/verify-docs.cjs للفحص المحلي: الروابط والفهرس وتنبيهات التاريخية وأنماط الاعتماد والإصدار وتنسيقbackup4. نجح الفحص، واختبار رابط مفقود متعمد رُفض ثم أزيل. فحصdocsليس اختبارًا ماليًا جديدًا.

وثّقنا فجوة تشغيلية صراحة:stageالإنتاجscratch/sync-hotfix-20261003ignored وغير مستعاد باستنساخGitوحده؛ لا توجد وصفة آلية عامة معتمدة لإعادة تركيبه. لا تنشرmainhandlersأو0017–0022 لتعويض ذلك. معالجة reproducible deploymentمهمة تقنية منفصلة، وليست تغييرًا تم في هذه المهمة.

## المرجع الأحدث — نُشر2.6.14 بالفعل، 2026-10-04

هذا القسم يتقدم على جميع عبارات «قيد العمل/غير منشور/اختيار فقط/ترقيمOPEN» التاريخية أدناه. الإصدار2.6.14 منشور: https://github.com/amerfathi/khodar-pos/releases/tag/v2.6.14، والويب https://khodar-pos.pages.dev عبر deployment https://d6d5e52a.khodar-pos.pages.dev. خدمات latest للويب وWindows وAndroid تعرض2.6.14؛ روابطها200 وmanifestWindows صحيح بالمفتاح المثبّت. تقرير الدليل والحدود:docs/release-2.6.14-verification.md، والسجل المحدّثRELEASE_BLOCKERS.md.

نُفّذت تسوية المالك بسجل مصادر محفوظ وreceipt ذري غير قابل للاستبدال، واسترداد الجهاز منcheckpointمصَفّى بالصلاحيات مع أرشفة الأصل قبلclearqueue؛ لا حذف عند الفشل. تحقّق legacyproduct بتاريخ موثوقفرعي دون تغييرDBsource، وأرقام جديدةUUID كاملة مع مرجع ظاهرlossless موحد للطباعة/البحث.259اختبارًا آليًا نجحت و17فحصصيغة موروث ليستE2E؛ APIindexed45،lint/typecheck/build ناجحة. مصفوفة الإنتاج النهائية8سيناريوهاتWebوحزمةWindowsالمستخرجة نجحت؛ Androiddebug/Weboffline/reconnect نجح مستقلًا. signedAPK2.6.14/26140 بنفس شهادة الإنتاج ثُبّت وفُتح علىAVDمنفصل. لا تزعم رحلة مالية كاملة للـsignedAPK أو ترقيةWindowsالمثبت أو طابعة فعلية.

بناء الحزم الناجح37192819553 منsource f850a7679e7bdc1b57ebfb6ebc39268be1b0c778. الرفع المحلي الكبير تأخر فأُوقف وحده؛ uploaderGitHubلم يُعد بناء الحزمة، ونجح37193814889 بعد التحقق من منشأ البناء/الإصدار/المفتاح/hash. اختبار إصدار خاطئ37193798716 فشل ومنعupload. بصمات الأصول العامة3طابقتCI قبل إعلانrelease ونشرmetadata. لا تغيير فينسخةWindowsالمثبتة أو شهادةAndroid أو الاشتراكات المدفوعة.

قاعدةالإنتاج:exportخاصignored سبق إضافة0023–0026 فقط؛ لم تُطبّق0017–0022 أو تغيّر المصادر المالية المقبولة. النشرمنscratch/sync-hotfix-20261003 المتوافق، لا mainfunctionsكاملة. cashshiftsتبقىمعطلة. التسوية≤2000مصدر وتفشل مغلقًا عندhistory/relationsغير مدعومة؛ صلاحيات تحجب علاقة لازمة قد تمنعcheckpoint ولا تُوسَّع تلقائيًا. لاAuthentiCode ولا شهادةسعة1000مستخدم.

## الأحدث — تنفيذ التسوية وتجهيز نشر2.6.14، 2026-10-04

يتقدم هذا القسم على وصف «تسجيل اختيار فقط/تسوية غير منفذة» أدناه. نُفّذ قرار المالك المركزي فعليًا مع snapshot حديث، إعادة تشغيل مالية كاملة، سجل receipt غير قابل للاستبدال، وguard SQL في نفس D1batch مع المصادر البديلة وإقفال المراجعة. طلب الاختيار القديم دونexecute يبقى intent فقط للتوافق. الجهاز يستلم checkpoint مصفّى بصلاحياته بعد حساب أرصدته من التاريخ الكامل على الخادم، ويحفظ الأصل والأرشيف والحالة والطابور والمؤشر ذريًا؛ فشل الحفظ يحتفظ بالأصل كاملًا. جميع أحداث الطابور يجب أن تكون مغطاة بقرارات معتمدة؛ البقية تُرفع للمراجعة ولا تُسقط.

أُصلح استرداد مصدر الصنف القديم بدليل تاريخي لفروعه، مع endpoint معتمد، وترطيب محلي ذري وتحقق مصادر أي بيع لاحق دون تعديل سجلDB القديم. رقم الفاتورة الظاهر يشمل UUID كاملة بترميزlossless موحد في البحث/الطباعة؛ توليد المعرف الجديد UUID لكل الهويات، بما فيها القديمة. لفّ النص في الإيصال وA4 يحفظ المرجع كاملًا.

التحقق حتى هذه اللقطة:257 اختبارًا آليًا نجح قبل إضافة اختبارhook واستردادlegacyAPI الأخيرين، إضافة17فحصًا حسابيًا موروثًا وليستE2E. Lint/typecheck/build نجحت. شاشة المالك على معاينةqa-2614 نُفذت فعليًا:posted:true، استردادprice12، لاpageerrors، أُعيد سعرQA إلى10. اختباراتWeb/Windows المالية الحية الأولية نجحت7سيناريوهات، ومعاينةWeb+Androiddebug نجحتoffline/reconnect معaccepted1/pending0 وكميات متطابقة بعدreload. اختبارجهازيWindows فشلprepare مرة ثم نجح إعادة منفردة؛ لا تُخفِ فشل المحاولة. الحزمة الموقعة وتجربةAPKالإنتاجي ليست معتمدة بعد. الدورة النهائية والبناء والنشر قيد العمل؛ لا تُعلن نشر2.6.14 قبل دليل.

قاعدة الإنتاج:أُخذ exportمحلي خاصignored قبل إضافة0023–0025 فقط، وسُجلت أسماؤها فيd1_migrations. لم تتغير المصادر المالية، ولم تُطبّق0017–0022. بُني ونُشرpreviewعلىstageالمتوافقscratch/sync-hotfix-20261003، لا mainfunctionsكاملة. PreviewAUTH_SECRET عشوائي مستقل لا يغيّر جلسات الإنتاج. لا قيم اعتماد بهذا الملف.

حدود:replay≤2000مصدر، والأنواع/العلاقات غير القابلة للتسوية تفشل مغلقًا دون حذف. صلاحيات غير اعتيادية تحجب علاقة مطلوبة قد تمنع تثبيتcheckpoint حتى توفير توسعة مصفّاة مثبتة؛ لا توسع صلاحيات موظف لحل ذلك. CASH_SHIFTS_ENABLED ما زال مغلقًا في الإنتاج. لا Authenticodeولا ضمان سعة1000مستخدم أو خلو مطلق من الأخطاء. راجعdocs/conflict-owner-review-2026-10-04.md.

لقطةGit قبلcommitالمرشح:CurrentGitHEAD=`54ab99fc0b1077d1de266c6f4cd1aad1b24f6e12`، currentbranch=`main`، مساويةorigin/main. gitstatus=تعديلاتالمرشح غيرcommitted فيsrc/services/store/components،functions/sync،d1/schema+migrations0023–25،versionfiles،tests،هذاالملف والتقريرين. الملفات التاريخيةuntrackedبما فيهاlive-auth/provision diagnostics محفوظة دون ضمها. آخرمهمة:إكمال الإصلاح والاختبار والنشر بتفويض المستخدم دونتوقفات مرحلية. أولخطوة:استكمل نتائجالدورةالنهائية، احفظ المرشح وشغّلworkflowالبناءالموقّعpublish=false، اختبرالمخرجات، ثم نشرWebوالإصدار وmetadataوالتحقق الحي وتحديثهذهاللقطة.

## Latest LOCAL step — staged reviewed ledger projection, 2026-10-04

New src/services/reviewLedgerReplay.js and tests/review-ledger-replay.test.mjs. Pure staging, no storage/API/ledger writes. Reuses actual applyInvoiceInventory/adjustBalance/applyPurchaseInventory for products/customers/suppliers/invoices/purchases/expenses/payments/branches. Unsupported sources (settings, returns, waste, workers, partners, shifts, restore/transfers etc) fail closed. Invoice financial update unsupported; notes only. stageReviewedResolution binds complete queued originals to receipts, archives originals, verifies local-choice accepted replacements match type/entity/action/branch/payload, rejects incomplete commit groups or any unreviewed pending suffix. Receipts are NOT authenticated here; future API verification and current-head/revision guards remain mandatory. Tests watched fail before implementation;10 focused test:conflict-review pass, lint/typecheck pass before final additional adversarial assertions. Added test file to package.json script. No atomic installation or server application wired; do not mistake staged projection for completed settlement. Next: authenticated immutable resolution receipts, complete replay coverage and transactional archive/state/outbox installation with rollback tests, then actual hook/browser/native/live verification. Prior published2.6.13 untouched; HEAD54ab99fc0b1077d1de266c6f4cd1aad1b24f6e12/main, dirty. No commit/push/deploy.

## Current task — authorized completion and publication, 2026-10-04

Verification completed: npm test exited0 (security + integration + registered conflict-review + inherited accounting checks), lint/typecheck exited0, Web build exited0 with existing large-chunk warning. Intentional injected-failure console logs are from failure-path tests, not a clean-runtime certification. No live/native or resolved-ledger tests for this feature because resolution is still unimplemented. Do not label these results production certification. No publish performed.

User authorized finishing and publication, but not unsafe ledger overwrites. Added LOCAL automatic evidence POST for exact causal409 only after independent-sales recovery fails; idempotency/permission failures are not uploaded as owner choices. Complete batch preserved, no outbox removal/state mutation/cursor advance; session/generation checked around response. Receipt posted:false produces review_pending, never synced_batch. tests/sync-durable.test.mjs regression failed before change, all12 focused pass after; expanded cases ensure idempotency409 not submitted and evidence503 keeps original ledger without false receipt. Modified src/services/cloudflareSync.js and tests/sync-durable.test.mjs plus prior candidate. Full npm test running; record actual completion below.

Publication still UNSAFE: no canonical financial resolution/client rebuild exists, recorded owner intent not applied. Do not publish partial feature as solved, do not clear queue or merely rebase heads after owner choice. Also stale review snapshots need append-only refreshed evidence before new decision can be taken after heads change. Need transactional resolution receipt + replay/source archive + dependent pending batch reconciliation and actual web/native/live test before new version. Current HEAD54ab99fc0b1077d1de266c6f4cd1aad1b24f6e12/main, dirty status includes all earlier candidate files. No production migrations, release version change, commit or push in this step. No secrets here.

## Local owner conflict review foundation — 2026-10-04

Final verification for owner screen step: 43 actual workerd/D1 API tests pass, 5 static UI/legacy-proof tests pass via new npm test:conflict-review included in npm test. Lint/typecheck/build pass; Vite warns of existing large chunk. Schema bootstrap updated to match migrations0023/0024. Review fixture isolated to REVIEW tenant to avoid altering other accounting test baselines. Changed server heads reject new decision409; immutable same-choice retry remains evidence only. Current Git status dirty: prior candidate plus d1/schema.sql, package.json, src/components/SettingsView.jsx, tests/api-integration.test.mjs, tests/runtime-worker.js, this handoff; new owner-review files listed below. First next step remains client upload and canonical ledger resolution, then interactive browser/native/live verification, not publication of incomplete recovery.

Additional LOCAL step: SettingsView mounts ConflictReviewPanel for nonstaff company_owner/super_admin only. New component src/components/ConflictReviewPanel.jsx, characterization tests/conflict-review-ui.test.mjs, migration0024_sync_review_decisions.sql and PATCH intent handler (posted:false), atomic current-head guard, no posting. Real API regression expanded: staff/foreign denied, same-choice retry, opposite-choice409, no accepted event insertion; failed404 before PATCH then passed. UI visibly awaiting reconciliation, not conflict solved. Client conflict submission and canonical financial resolution remain missing. Lint/typecheck/build passed (existing large-chunk warning). No deploy/migration/commit. New tests not yet registered in npm integration script; run explicitly until added.

User approved central owner review; no last-write-wins. New uncommitted files: d1/migrations/0023_sync_conflict_reviews.sql, functions/api/sync/conflicts.js, docs/conflict-owner-review-2026-10-04.md. Modified: tests/runtime-worker.js, tests/api-integration.test.mjs and this handoff, in addition to existing dirty candidate files. Real workerd/D1 capture/list test failed before implementation and passed after; lint/typecheck passed. No client upload/decision UI or canonical recovery yet. No production migration/publish. Current HEAD54ab99fc0b1077d1de266c6f4cd1aad1b24f6e12, branch main. Next: adversarial capture tests then conditional owner resolution and safe ledger rebuild. Evidence upload is not acknowledgement; never clear outbox. Details and assumptions in design document. No credentials included.

## Latest local candidate — inbound dependencies, 2026-10-04

User authorized repairing the Edge cashier failure in BRK-000. Shared client receiver now retains whole missing-dependency groups atomically while allowing independent reference creates, with bounded retry and explicit incomplete-ledger warning/financial/report/backup guards. Full recovery export preserves the aggregate. Production sources and grants remain unchanged. See docs/inbound-dependency-recovery-2026-10-04.md. Candidate is LOCAL, not published; package remains2.6.13, do not overwrite immutable published2.6.13 artifacts. Source baseline HEAD54ab99fc0b1077d1de266c6f4cd1aad1b24f6e12, main. Modified uncommitted: src/App.jsx, src/services/atomicStore.js, src/services/businessEffects.js, src/services/invoiceInventory.js, src/store/useAppStore.js, tests/atomic-store.test.mjs, tests/store-business.test.mjs, tests/store-sync.test.mjs, this handoff. New candidate files: src/services/missingDependency.js and docs/inbound-dependency-recovery-2026-10-04.md. Historical untracked live diagnostics remain untouched. First next step: final full suite after last bounded retry/report gate, then candidate browser/package verification and a new versioned publication only when ready. Permanently unscoped legacy product still needs owner-reviewed migration; do not automatically widen branch access or claim cashier finance restored.

## الأحدث — تسوية فواتير مستقلة متعددة الأجهزة، 2026-10-03

نُفذ إصلاح سببية محدود لفواتير create مستقلة؛ التفاصيل والأدلة في docs/sales-reconciliation-2026-10-03.md. مسار rebase محمي يراجع تاريخ D1 وهوية السجلات ويعيد فقط فروع المستخدم. الحفظ المحلي ذري: استقبال مرة واحدة + cursor + outbox/preconditions؛ payload/IDs/group لا تتغير. التعارضات غير القابلة للجمع تظل محفوظة وموقوفة. أضيفت حماية سباق pull/checkout. المصادقة المجانية المنشورة مستمرة.

نجحت رحلات فعلية offline/reconnect على Web/Electron وAndroid debug2.6.13 مع الويب، محليًا وعلى السيرفر الحي، بما فيها نفس الحساب على جهازين وحسابان مختلفان؛ كل مصدر مرة واحدة وpending0. API المحدود منشور a8b3ebde؛ واجهة الإنتاج كانت2.6.11 في هذه اللقطة، والحزم النهائية قيد التجهيز. 232 integration قبل الحماية الأخيرة، و84 focused نهائية، و42 API، وlint/typecheck نجحت. ترقيم الفاتورة الظاهر ما زال يتكرر؛ لا تعلن اكتمال كافة التعارضات أو المنصات/المثبتات.

أول خطوة بعد هذه اللقطة: حفظ commit، إكمال فحوص GitHub وبناء/نشر2.6.13، ثم توثيق URLs وHEAD والحالة النهائية. لا تنشر candidate API/time_zone migrations على الإنتاج؛ حزمة API المحافظة في scratch/sync-hotfix-20261003 مبنية منc10f4e5 + auth hotfix + rebase فقط. لا بيانات اعتماد فعلية في هذا الملف.

## الأحدث — إصلاح الدخول المجاني منشور 2026-10-03

المستخدم رفض أي اشتراك إضافي. وُجد ونُفذ بديل مجاني داخل Cloudflare: bcrypt12 داخل SQLite Durable Object خاص، متاح على Free بوقت CPU30s. Pages يمرر المهمة عبر PASSWORD_CRYPTO؛ لا كلمات مرور مخزنة فيDO، لا endpoint عام ولا صلاحية DB للخدمة ولا تغيير كلمات مرور المستخدمين. جميع مسارات hash/verify تمررenv، وفقدbinding يفشل مغلقًا. يتقدم هذا على الاقتراح التاريخي بأن الخطة المدفوعة أوVPS هما الخياران الوحيدان.

نُشر Worker braka-password-crypto version479415e2-95c8-49e0-bda7-c7b7fb5e1b52، وPages hotfix b7928fe4 (https://b7928fe4.khodar-pos.pages.dev). بقيت واجهة2.6.11 بأصولها المطابقة، والمثبتات كما هي. حزمة الطوارئ فيscratch/auth-hotfix-20261003 مبنية منc10f4e5 بإصلاح المصادقة فقط؛ لا تنشر مرشح2.6.13 أو ترحيلاته تلقائيًا. لم تتغير خطةFree أو تُضف رسوم.

اختبارات:41API محلي عبرworkerd+DO نجحت، واختبارا password-crypto نجحا، guards/lint/typecheck نجحت. حيًا: دخول ملاك/موظفين لشركتين200، تغيير كلمة مرورfixture200، الجلسة/الكلمة القديمة401، الجديدة200، وإعادة كلمةfixture الأصلية والتحقق200. Androiddebug WebView API200 (ليس اختبارAPK منشور كامل). Web/Windows شركتان مختلفتانonline وoffline/reconnect: كل فاتورة مرة واحدة وpending0. سجلCPU النهائيoutcome=ok لكل الطلبات؛ login6–21ms معظمها6–10، password change9/14ms، آخرprobe7ms/200؛ النجاح فوق10 قد يستفيد منburst، فلا تزعم ضمان انعدام1102 مستقبلًا أو سعة1000مستخدم. حصصFree يومية محدودة.

المزامنة المالية **لم تُصلح بعد**: اختبار حي لكاشيرين في الفرع نفسهoffline أعاد200 لفاتورة و409 للثانية وبقيتpending1 بعدreload؛ ترقيمinvoiceNumber ما زال يتكرر1. الأدلة محفوظةignored. الخطوة التالية: إصلاح تسوية مصادر مالية مستقلة مع الحفاظ علىpreconditions وidempotency، ثم ترقيم آمنoffline واختبارنفس/مختلف الحسابات والمنصات. لا تزيل409 أو تعدلpayload المقبول أوتُسقطoutbox.

Current Git HEAD:4dfc6d45864b6f761c8afe9f32a778dd976c20bd، branch main، مدفوعorigin/main. commitيشمل إصلاح المصادقة والخدمة والاختبارات وتقريرdocs/auth-cpu-hotfix-2026-10-03.md. غيرcommitted:هذا الملف،RELEASE_BLOCKERS.md،tests/platform-matrix-server.mjs؛ ملفات جديدة pending:docs/multi-company-live-ui-audit-2026-10-03.md وtests/platform-multi-company.mjs وtests/live-{test-provision,auth-resource-probe,account-plan-probe,android-auth-probe,auth-validation}.mjs. لا أسرار فعلية بهذا التسليم؛الاعتمادات التجريبية فيscratch ignored فقط.

## تحقق جديد من سبب503 — 2026-10-03

السجل الحي المفلتر لطلب QA إلى /api/tenants/lookup أعاد outcome=exceededCpu، cpuTime=18ms، wallTime=196ms، status503. محفوظ في scratch/artifacts/live-multi-company/auth-resource-probe.json دون أسرار. تحسّن قارئ tail لالتقاط JSON المتعدد وانتظار بدء العملية؛ tailReady=false لا ينفي السجل اللاحق الذي التُقط فعليًا. لوحة Cloudflare > Compute > Workers plans أكدت Free / Current plan و10ms CPU per request؛ الخطة أصبحت معلومة، وهذا يصحح عبارة plan unknown في القسم السابق. Paid معروض5USD/month + usage. لم نضغط Upgrade أو نشترِ شيئًا. bcrypt12 في النسخة المنشورة مطابق للشيفرة الحالية، وهو مشتبه الحساب المكلف؛ trace يثبت تجاوز CPU للطلب ولا يعطي stack profile للدالة. لا تخفّض تكلفة التشفير. الحل التشغيلي المباشر يحتاج خطة CPU مناسبة وموافقة التكلفة؛ البديل نقل التحقق إلى خادم يملكه المستخدم بعد تحديده وتأمين الاتصال. لا يوجد إصلاح منشور ولا اعتماد للمصفوفة الحية بعد.

## أولوية حالية — محاولة الاختبار على الإنتاج 2026-10-03

المستخدم أجاز الاختبار الحي لجميع المنصات. أنشئت fixtures معزولة LIVEQA-AD6B6784-CA/CB: شركتان، أربعة فروع وثمانية حسابات تنتهي بعد يومين. بيانات الاعتماد محفوظة فقط في artifact محلي ignored، وليست هنا. تسجيل مالكي fixtures ورفع صنفين لكل شركة عبر API الحي نجحا أولًا. محاولة رحلات Web/Windows لم تكتمل: POST /api/tenants/lookup أعاد HTTP503/HTML مع Cloudflare1102 (Worker exceeded resource limits)، مؤكّد من طلب مباشر ومن واجهة الويب. لا تدّع اكتمال السيناريوهات المالية الحية أو وجود حل للتعارضات.

اشتباه CPU bcrypt12: تحقق محلي نحو282ms CPU، لكنه ليس قياسًا على Cloudflare. tail لم يعط سجل CPU قابلًا للاعتماد. workers/account-settings وPages config يعيدان usage_model=standard؛ subscriptions403، لذلك الخطة المدفوعة/المجانية غير مؤكدة. ممنوع تخفيض تكلفة التشفير أو bypass أو شراء خطة دون اعتماد. أول خطوة: قياس CPU/outcome وحدود الحساب الفعلية في Cloudflare، ثم تحديد إصلاح آمن لمسار الدخول قبل إكمال مصفوفة الشركات.

الإنتاج Web2.6.11، GitHub release2.6.12، المرشح2.6.13 غير منشور. محاكي emulator-5554 يعمل لكنه يحوي debug2.6.9؛ تثبيت APK المنشور2.6.12 بـ-r رُفض لاختلاف توقيع النسخة التجريبية. لم يُحذف التطبيق ولم يُستبدل. backup tar1024 bytes غير صالح (permission denied)، فلا تعتمد عليه للاستعادة. Android WebView direct live-auth diagnostic أعاد Failed to fetch، وليس إثباتًا لسيناريو مالي أو خطأ1102 على Android. لا تعمم ذلك كاختبار إصدار Android المنشور. قاعدة الإنتاج لا تتضمن time_zone/migrations0017-0022؛ لا تنشر candidate API قبل مراجعة التوافق.

HEAD621eef45e5e9706f23da020e70a7ad631ca42fa9، branch main. لا commit/push/deploy لهذه المهمة. ملفات معدلة غير committed: AI_HANDOFF_CURRENT.md، RELEASE_BLOCKERS.md، tests/platform-matrix-server.mjs. ملفات جديدة غير committed: docs/multi-company-live-ui-audit-2026-10-03.md، tests/platform-multi-company.mjs، tests/live-test-provision.mjs، tests/live-auth-resource-probe.mjs، tests/live-account-plan-probe.mjs، tests/live-android-auth-probe.mjs. السكربتات لا تحتوي كلمات مرور أو رموز مضمنة؛ تقرأ fixture config محليًا ولا تطبعها. الأقسام التاريخية أدناه لا تتقدم على هذا القسم.

## أحدث مهمة — اختبار فعلي للشركات والكاشيرين (2026-10-03)

طلب المستخدم اختبار السيناريوهات فعليًا؛ أُضيف harness اختياري لشركتين/فرعين/cashiers، وشُغّلت واجهات Chrome وElectron مع قطع اتصال النوافذ وعودته وعمليتي Electron منفصلتين. النتائج تفصيليًا في docs/multi-company-live-ui-audit-2026-10-03.md. شركتان منفصلتان تزامنتا، والبيع المتتابع نجح؛ المتزامن بنفس الشركة/الحساب وحتى فرعين مستقلين ترك واحدة200 والأخرى409/pending1. pending بقي بعد reload في الحالة المختبرة. ترقيم الفواتير الظاهر تكرر1 مع IDs داخلية مختلفة. هذا **مانع اعتماد** جديد مؤكَّد؛ لا تصفه كمزامنة مكتملة لأن البيانات محفوظة محليًا فقط. السبب: domain heads عامة للشركة، لا تسوية أعمال تلقائية، وnextInvoiceNumber محلي لكل سجل مستخدم/جهاز. لم يُغيَّر منطق التطبيق أو بيانات الإنتاج ولم يُنشر. Android غير متصل ولم يُجرَّب.

Current code HEAD قبل هذه المهمة:621eef45e5e9706f23da020e70a7ad631ca42fa9، branch main. تعديلات غير committed: tests/platform-matrix-server.mjs، tests/platform-multi-company.mjs (جديد)، هذا الملف وتقرير الاختبار وregister إن حُدّث. artifacts محلية ignored. أول خطوة: اقرأ التقرير والأدلة، ثم اطلب اعتماد مسار إصلاح السببية/نطاق الفروع/ترقيم الفواتير، ولا تتجاوز409؛ شغّل Android قبل أي اعتماد منصات. أعد بناء dist للإنتاج دون localhost قبل التسليم.

## لقطة Git الأخيرة (وقت الفحص)

- Current Git HEAD (شيفرة المرشح): `28a35574d3cc4d1575b65dfdfa3618a3556971f7`.
- Current branch: `main`؛ الشيفرة مدفوعة إلى origin/main.
- `git status --porcelain=v1` بعد commit الشيفرة: فارغ. هذا التحديث التوثيقي وحده أُضيف بعد اللقطة؛ لا تعديلات شيفرة غير محفوظة.
- آخر مهمة: مراجعة مالية/أمنية ومزامنة، إصلاح clock/device/replay/version، اختبارات الويب وElectron وبناء Android، تجهيز مرشح 2.6.13 دون نشر الإنتاج.
- GitHub build: https://github.com/amerfathi/khodar-pos/actions/runs/37101108904 — publish=false وpublish_metadata=false؛ تشغيل البناء لا يعني نجاحه أو نشر إصدار.
- أول خطوة: افحص نتائج GitHub ثم شغّل المحاكي من Android Studio واختبر Android محليًا. راجع كذلك fallback إذا غاب indexedDB في جلسة حقيقية؛ لا تسمح بماليّات معتمدة على localStorage وحده. لا تُسقط فشل اختبار localStorage القديم.
- آخر workflow لإصدار2.6.12 فشل فقط في نشر metadata لأن رمز نشر Cloudflare غير موجود في GitHub؛ OAuth المحلي متاح. لا تدّع أن آلية نشر metadata الآلية تعمل.
- لا توجد كلمات مرور إنتاجية أو رموز أو مفاتيح خاصة مسجلة في هذا الملف. معرفات الخدمات وpin العام ليست أسرارًا.

## تحديث أولوية — فحص وتجهيز 2.6.13 بتاريخ 2026-10-03

تنبيه أخير: test:browser-crash (fixture القديم المعتمد على localStorage وحده) فشل بعد قتل Chrome فوريًا؛ لم يُخفَ أو يُغيَّر الاختبار. test:browser-idb-engine نجح بعد قتل العملية مع state/outbox/cursor؛ actual-app-durable نجح أيضًا. لذلك ممنوع الادعاء أن localStorage مصدر دائم، ويجب التحقق من عدم رجوع أي منصة إليه. لم يكتمل فحص Android ولا نشر الإنتاج. يُحفظ مرشح GitHub فقط لإكمال الفحوص.

هذا القسم يتقدم على الحالات التاريخية أدناه. جهزت 2.6.13 مع إصلاح عزل توقيت الشركات، رفض المنطقة الزمنية غير الصالحة، إزالة تغيير الساعة قبل commit، توحيد وقت الفاتورة مع توقيت الشركة، وتحديث توقيت tenant في batch المزامنة بعد التحقق من جلسة مالك الشركة. أُصلح سباق تسجيل الجهاز باستخدام INSERT DO NOTHING ثم التحقق من الفائز. إصدار Gradle الموروث 2.6.11 كان لا يطابق 2.6.12؛ الآن جميع الإصدارات 2.6.13/26130 مع اختبار يمنع تكرار الاختلاف.

المسار غير المكتمل للورديات محمي بالخادم: CASH_SHIFTS_ENABLED لا بد أن يكون true صراحة؛ الوضع الافتراضي مغلق. لا تفعّله في الإنتاج قبل تفويض handover وربط المصادر وinbound/restore. استُبقي عقد restore conflict keys القديم حتى لا تتعطل النسخ السابقة.

نتائج أحدث: 228 integration/focused نجحت، guards و17 formula/source منفصلة نجحت؛ ثلاثة اختبارات version/gate نجحت؛ lint/typecheck/Web build نجحت. Web↔Electron expenses 12+13 رصيد -25؛ شراء آجل 10 كجم ×4، دين المورد40 ونقد0، وتقرير مطابق بالويب وElectron. Chrome actual-hook crash/lost-ACK/reopen نجح. Android assembleDebug نجح، لكن لا جهاز adb والمحاكي لم يبدأ بسبب رفض التنفيذ؛ فحص Android الفعلي باقٍ. production npm audit صفر؛ build/dev: 14 high و1 moderate باقية، لا تُعلن المشروع خاليًا من الثغرات.

تفاصيل النطاق والفجوات: docs/releases/2.6.13.md. لا نشر إنتاجي ولا تغيير بيانات المستخدمين في هذا الفحص. يُمكن حفظ مرشح مع الميزة معطّلة وتجهيز حزم GitHub دون نشرها. أول خطوة تالية: تشغيل Braka_UI_Test، تثبيت APK المحلي المعزول، adb reverse للمنفذ8788 وتحقق تدفقات الاختبار دون الحساب الحقيقي؛ ثم إعادة بناء الإنتاج دون VITE_API_BASE_URL المحلي والتحقق من الحزم الموقعة قبل أي نشر. Git HEAD السابق والـstatus أدناه تاريخيان حتى توثيق commit الجديد.

تاريخ إعادة المطابقة: 2026-10-03 (Asia/Riyadh). المصدر: ملفات المستودع الحالية والفحوص المحلية؛ لا تُعامل ذاكرة المحادثة كدليل على حالة الشيفرة.

## حالة Git والنشر

- الفرع: `main`.
- HEAD: `5bf4412ad88776c1584f4f9b3c5d2074904f42a2`.
- لا توجد commits بعد HEAD السابق؛ بعد هذه المطابقة والإصلاحات: 19 modified و36 untracked، دون ملفات staged.
- أحدث commits: `5bf4412` handoff للمثبت؛ `82ddec9` توثيق 2.6.11؛ `c10f4e5` تجهيز 2.6.11؛ `6a1f638` حفظ تعديلات الإعدادات؛ `1993500` استرداد سياق الفرع؛ `db55b92` واجهة 2.6.10؛ `a212310` فحص الأنواع؛ `191e073` مزامنة 2.6.9.
- `package.json` و`docs/releases/2.6.12.md` يصفان 2.6.12. لم يُفحص النشر الحي في هذه المطابقة؛ ميزة الوردية لا تحتوي UI مفعلة ولا تدفق دخول فعلي موصول. لا يُدفع أو ينشر هذا العمل قبل إغلاق عوائقه.
- لا يوجد سجل يثبت مؤلف كل تغيير غير محفوظ؛ الإضافات مقارنةً بالتسليم السابق تُنسب إلى العمل اللاحق، ولا يمكن فصل مؤلفها من Git وحده.

## نتائج إعادة المطابقة قبل الإصلاح

- `npm run typecheck`: نجح.
- تشغيل API + shift hooks + enrollment + unlock + timezone: 56 اختبارًا، 55 ناجح وواحد فاشل. الفشل: `server reconciles replayed cash movements when closing a shift`، API يعيد 400 بدل 200 عند الفاتورة. السبب: fixture يحمل `accountingDate: 2026-10-02` رغم أن `openedAt` مأخوذ من وقت التشغيل بتاريخ 2026-10-03.
- الادعاء الموروث «224 ناجح، lint/build/Chrome ناجحة» محفوظ كدليل تاريخي في النسخة السابقة، وليس قياسًا حديثًا؛ لا يوجد artifact جديد يثبت تلك الفحوص على هذه الحالة.
- schema bootstrap ومجموع migrations نجحا ضمن اختبار API الحالي.
- تسجيل المفتاح الخاص في Cloudflare مذكور في OA-07؛ لم تُعرض أو تُقرأ قيمه ولم يُتحقق من حساب الخدمة بهذا الفحص. pin عام موجود لكنه untracked، خلاف عبارة «committed» السابقة. اختبار API يستخدم مفتاحًا تجريبيًا مستقلًا وليس pin الإنتاج.

## العائق الحالي والخطوة التالية الدقيقة

آخر عمل موروث: إضافة openShift/closeShift الفعليين إلى store (موجودان بالفعل؛ لا تُعد كتابتهما)، attribution لبعض cash hooks، replay لنفس actor، وتوقيت الشركة.

العائق الحالي: لا يثبت الكود handover بين محاسبين مختلفين. API يشترط actor=current session، وsource queue تخص المستخدم؛ actual cash hooks لا تستخدم `commitDrawerShiftDurable` أو `commitBatch` للسجل المشترك. inbound وbackup لا يتعاملان مع ledger الجديد. قبل UI يلزم إصلاح حدود replay وحفظ النقد ثم تفويض تسلسل المحاسبين.

آخر مهمة مكتملة في 2026-10-03: إعادة بناء التسليم، إصلاح حدود ملكية الدرج في replay، إصلاح تسلسل open→sale→close→next-open في commit group واحدة، وتصحيح fixture التاريخ. شاهَد اختبارا الخلل الفشل على الكود الموروث قبل الإصلاح ثم النجاح بعده. لم يُنفذ commit/push/deploy، ولم تُبدل بيانات المستخدمين.

أول خطوة للنموذج التالي: أضف اختبار D1 لمحاسب A يغلق ورديته ثم محاسب B يرفع السلسلة المعلقة من الجهاز المسجل؛ أثبت أن البروتوكول الحالي يرفض actor السابق، ثم أنجز تفويض replay يتحقق من التصاريح الموقعة والهوية والصلاحيات الحالية وملكية الجهاز وترتيب مصادر الفواتير. لا تُزل مقارنة actor لتجاوز الفشل. افحص كذلك عدم تغيير هوية وردية قائمة وproof/device lease قبل أي UI. بعدها اربط actual financial source بالسجل المشترك في commitBatch واختبر inbound/restore.

## نتائج الفحص بعد الإصلاح — 2026-10-03

- `npm test` نجح: security guards، 226 اختبار focused/integration، صفر failed/skipped، و17 فحص formula/source موروث منفصل. تتضمن integration الاختبار المستقل للسجلات الفعلية والأرصدة والمخزون والديون.
- `npm run typecheck` و`npm run lint` و`npm run build`: نجحت؛ تحذير حجم حزمة الويب الموجود باقٍ. `git diff --check`: لا أخطاء whitespace.
- اختبار foreign drawer: كان API يقبل 200، أصبح يرفض 400 دون إنشاء وردية أو sync event.
- اختبار ordered group: كان يرفض مصدر الفاتورة 400؛ الآن يفتح برصيد 100، يقبل نقد 27، يقفل بالمعدود والمتوقع 127، ثم يفتح الوردية التالية 127. توقع ناقص 100 يرفض الدفعة 409 دون أي مصدر/وردية/حركة، وإعادة إرسال الدفعة السليمة تترك أربعة أحداث وحركة نقد واحدة.
- لم تُجرَّب Chrome/Windows/Android أو production issuance في هذه المطابقة. لا يُغلق CASH-REPLAY أو أي blocker للميزة الكاملة بهذه النتائج.

## تصنيف جميع الملفات غير المحفوظة

COMPLETE يعني اكتمال الجزء المحدد في عمود الدليل، ولا يعني إغلاق الميزة كاملة. لا توجد تغييرات UNRELATED مثبتة؛ توقيت الشركة توسع موروث محفوظ لأنه يمس اليوم المحاسبي.

| الملف | التصنيف | السلوك/الدليل أو الفجوة |
|---|---|---|
| `OWNER_ACTIONS_REQUIRED.md` | PARTIAL | توثيق OA-07؛ اكتمال وضع المفتاح في Cloudflare مذكور بالملف ولم يُتحقق من الخدمة في هذا الفحص. |
| `d1/schema.sql` | PARTIAL | جداول الورديات والأجهزة وتوقيت الشركة؛ تطابق bootstrap/migrations نجح. |
| `functions/_lib/syncPolicy.js` | PARTIAL | السماح بنوع cash_shift؛ لا يثبت تفويض إعادة حركات محاسب آخر. |
| `functions/api/sync/push.js` | RISKY / UNVERIFIED | ملكية الدرج وتسلسل دفعة لنفس المستخدم صُححا؛ تفويض actor سابق وإثبات الجهاز وimmutability للوردية ما زالت عوائق. |
| `functions/api/tenants/lookup.js` | PARTIAL | إرجاع توقيت الشركة؛ ضبط الشركة محليًا لا يحدّث tenants.time_zone حاليًا. |
| `package.json` | COMPLETE | إدراج الاختبارات الجديدة في التشغيل؛ اكتمال قائمة التشغيل فقط. |
| `src/components/MobileHomeHub.jsx` | PARTIAL | تاريخ اليوم بتوقيت الشركة. |
| `src/components/SettingsView.jsx` | PARTIAL | اختيار التوقيت؛ التحقق والحفظ على الخادم بحاجة مراجعة. |
| `src/components/StoreAuditView.jsx` | PARTIAL | اليوم والأمس؛ الأسبوع والشهر لا يزالان يعتمدَان تاريخ الجهاز. |
| `src/data/initialData.js` | PARTIAL | توقيت افتراضي للشركة. |
| `src/services/atomicStore.js` | PARTIAL | إضافة ledger للورديات إلى حراسة الحالة والأحداث. |
| `src/services/durableAggregate.js` | COMPLETE | primitive commitBatch موروث مع rollback/reopen tests؛ ليس ربط checkout. |
| `src/services/syncConflictPolicy.js` | PARTIAL | مفاتيح وردية ودرج مع مجال tenant-wide؛ لم يُثبت تسلسل المحاسبين. |
| `src/store/useAppStore.js` | RISKY / UNVERIFIED | open/close موجودان بالفعل؛ attribution يختار أول وردية بالفرع ويفترض جهازها، يتجاهل خطأ اشتقاق النقد؛ سجل الدرج المشترك وإعادة inbound/النسخ الاحتياطي غير موصولين. |
| `src/utils/formatters.js` | PARTIAL | توقيت مخزن global localStorage؛ أثر تغيير الشركة وفشل حفظ الإعداد يحتاج اختبارًا. |
| `tests/api-integration.test.mjs` | PARTIAL | fixture التاريخ صُحح؛ regression ملكية الدرج وتسلسل الدفعة/رفض التسوية/إعادة ACK نجحت؛ لا يوجد سيناريو محاسبين مختلفين. |
| `tests/browser-atomic.test.mjs` | COMPLETE | اختبار primitive paired commit موروث؛ لم يُعد تشغيل Chrome في هذا الفحص. |
| `tests/runtime-worker.js` | COMPLETE | توصيل routes بالبيئة المعزولة. |
| `AI_HANDOFF_CURRENT.md` | COMPLETE | أعيد بناء الحالة من ملفات المستودع في 2026-10-03. |
| `RELEASE_BLOCKERS.md` | COMPLETE | إضافة سجل CASH الحالي دون إلغاء حالات P الموروثة؛ الميزة الجديدة قيد العمل. |
| `d1/migrations/0017_cash_drawer_shift_foundation.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `d1/migrations/0018_cash_shift_movements.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `d1/migrations/0019_cash_shift_reversals.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `d1/migrations/0020_cash_shift_device_proof.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `d1/migrations/0021_cash_devices.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `d1/migrations/0022_tenant_time_zone.sql` | PARTIAL | schema parity نجح؛ نشر migrations غير موثّق لهذا العمل. |
| `docs/accounting-day-drawer-shift-design.md` | PARTIAL | التصميم المعتمد محفوظ؛ فقرات تاريخية تتعارض مع التقدم الحالي؛ هذا التسليم هو checkpoint الحالي. |
| `functions/_lib/cashDeviceProof.js` | COMPLETE | primitives واختبارات scope/signature؛ المفتاح المثبت عام فقط؛ اكتمال المكوّن لا يعني تدفق الدخول. |
| `functions/_lib/offlineGrantSignature.js` | COMPLETE | primitives واختبارات scope/signature؛ المفتاح المثبت عام فقط؛ اكتمال المكوّن لا يعني تدفق الدخول. |
| `functions/api/cash/devices.js` | RISKY / UNVERIFIED | registration يفحص ثم ينفذ upsert؛ سباق بين proofs قد يستبدل الهوية؛ لا توجد drawer-device lease. |
| `functions/api/cash/drawers.js` | PARTIAL | API أساسيات ومصادر النقد؛ لم يُوصل بالواجهة أو بالتفويض المشترك. |
| `functions/api/cash/grants.js` | PARTIAL | التوقيع مشتق من جلسة فعالة؛ لم يثبت إصدار production أو credential-version/revocation replay. |
| `functions/api/cash/shifts.js` | PARTIAL | API أساسيات ومصادر النقد؛ لم يُوصل بالواجهة أو بالتفويض المشترك. |
| `functions/api/cash/shifts/close.js` | PARTIAL | API أساسيات ومصادر النقد؛ لم يُوصل بالواجهة أو بالتفويض المشترك. |
| `src/config/offlineGrantPublicKey.js` | COMPLETE | primitives واختبارات scope/signature؛ المفتاح المثبت عام فقط؛ اكتمال المكوّن لا يعني تدفق الدخول. |
| `src/services/cashDrawerJournal.js` | PARTIAL | حفظ isolated shifts؛ لا فواتير فعلية أو source outbox مشتركة. |
| `src/services/cashMovement.js` | PARTIAL | مبالغ minor units ويوم الوردية؛ actual-hook coverage للعديد من المسارات ناقص. |
| `src/services/cashShiftEngine.js` | PARTIAL | مبالغ minor units ويوم الوردية؛ actual-hook coverage للعديد من المسارات ناقص. |
| `src/services/cashShiftLedger.js` | PARTIAL | حفظ isolated shifts؛ لا فواتير فعلية أو source outbox مشتركة. |
| `src/services/offlineDeviceIdentity.js` | RISKY / UNVERIFIED | read ثم write دون CAS/lock؛ إنشاء الهوية المتزامن غير مختبر. |
| `src/services/offlineGrantEnrollment.js` | PARTIAL | enrollment/unlock اختبارات نجحت؛ ليست موصولة بالدخول الفعلي؛ multi-branch owner وIndexedDB الحقيقي يحتاجان فحصًا. |
| `src/services/offlineGrantStore.js` | PARTIAL | enrollment/unlock اختبارات نجحت؛ ليست موصولة بالدخول الفعلي؛ multi-branch owner وIndexedDB الحقيقي يحتاجان فحصًا. |
| `src/services/offlineShiftGrantPolicy.js` | COMPLETE | primitives واختبارات scope/signature؛ المفتاح المثبت عام فقط؛ اكتمال المكوّن لا يعني تدفق الدخول. |
| `src/services/offlineUnlock.js` | PARTIAL | enrollment/unlock اختبارات نجحت؛ ليست موصولة بالدخول الفعلي؛ multi-branch owner وIndexedDB الحقيقي يحتاجان فحصًا. |
| `src/services/verifiedOfflineGrant.js` | COMPLETE | primitives واختبارات scope/signature؛ المفتاح المثبت عام فقط؛ اكتمال المكوّن لا يعني تدفق الدخول. |
| `tests/cash-drawer-journal.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/cash-movement.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/cash-shift-durable.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/cash-shift-engine.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/cash-shift-hooks.test.mjs` | PARTIAL | اختبار مصروف واحد داخل aggregate؛ لا paired drawer journal أو rollback source. |
| `tests/date-timezone.test.mjs` | PARTIAL | نجح اختباران؛ لا timezone isolation/rollback/DST أو persistence server. |
| `tests/offline-grant-enrollment.test.mjs` | COMPLETE | 14 اختبارًا محليًا نجحت؛ backend memory والتوقيع ephemeral؛ ليست native/production. |
| `tests/offline-grant-signature.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/offline-shift-grant-policy.test.mjs` | COMPLETE | اختبارات primitives موروثة ومقروءة؛ لا تثبت checkout/device matrix. |
| `tests/offline-unlock.test.mjs` | COMPLETE | 14 اختبارًا محليًا نجحت؛ backend memory والتوقيع ephemeral؛ ليست native/production. |

## العوائق وحالة المالك

`RELEASE_BLOCKERS.md` الجدول الأساسي: P1–P11 وP13–P17 وP19 حالات VERIFIED موروثة بنطاقاتها، P12 هو BLOCKED_EXTERNAL بسبب Authenticode؛ لا تُلغ تلك الأدلة التاريخية بسبب ميزة جديدة. لمس atomic/sync/hooks/restore/branch/auth يتطلب regression متأثر قبل اعتماد العمل الحالي.

عوائق ميزة الورديات: التصريح وتخزينه IN_PROGRESS، الدخول الحقيقي OPEN، paired financial source+journal IN_PROGRESS، replay المتعدد والتفويض وترتيب الدفعة IN_PROGRESS، backup/lost-device OPEN، Web/Windows/Android feature matrix OPEN. لا يوجد VERIFIED للميزة الكاملة.

`OWNER_ACTIONS_REQUIRED.md`: OA-01/OA-02/OA-05/OA-06 مذكورة مكتملة؛ OA-04 NOT_APPLICABLE؛ OA-03 يتطلب شهادة Authenticode موثوقة وبيانات نشر CI محدودة (المالك اختار سابقًا توزيع Windows غير موقّع)؛ OA-07 مذكور مكتمل لوضع مفتاح التصاريح لكنه يحتاج تحقق issuance عند نشر الميزة. لا تطلب أي قيم اعتماد من المالك.

## ثوابت يجب الحفاظ عليها وأمور لا تُرجعها

احتفظ بكل العمل غير المحفوظ، schema/migrations 0017–0022، primitives التوقيع والحفظ، وميزة التوقيت؛ لا reset/checkout/clean/revert أو broad reformat. لا يُستبدل البروتوكول الحالي بـLWW. احتفظ بذرّية الحالة/outbox/cursor، commit groups، causal heads، ACK retry/idempotency، tenant/branch scope، restore barriers، عكس العمليات، balances/inventory ومبالغ minor units. لا تُغير قاعدة حسابية قبل عزل خلل وإعادة تسوية مستقلة.

هذه الوثيقة لا تحتوي كلمات مرور أو API keys أو tokens أو مفاتيح خاصة أو keystores أو قيم أسرار؛ أسماء إعدادات الخدمة والمفتاح العام فقط يمكن ذكرها.

## لقطة git status

```text
 M OWNER_ACTIONS_REQUIRED.md
 M RELEASE_BLOCKERS.md
 M d1/schema.sql
 M functions/_lib/syncPolicy.js
 M functions/api/sync/push.js
 M functions/api/tenants/lookup.js
 M package.json
 M src/components/MobileHomeHub.jsx
 M src/components/SettingsView.jsx
 M src/components/StoreAuditView.jsx
 M src/data/initialData.js
 M src/services/atomicStore.js
 M src/services/durableAggregate.js
 M src/services/syncConflictPolicy.js
 M src/store/useAppStore.js
 M src/utils/formatters.js
 M tests/api-integration.test.mjs
 M tests/browser-atomic.test.mjs
 M tests/runtime-worker.js
?? AI_HANDOFF_CURRENT.md
?? d1/migrations/0017_cash_drawer_shift_foundation.sql
?? d1/migrations/0018_cash_shift_movements.sql
?? d1/migrations/0019_cash_shift_reversals.sql
?? d1/migrations/0020_cash_shift_device_proof.sql
?? d1/migrations/0021_cash_devices.sql
?? d1/migrations/0022_tenant_time_zone.sql
?? docs/accounting-day-drawer-shift-design.md
?? functions/_lib/cashDeviceProof.js
?? functions/_lib/offlineGrantSignature.js
?? functions/api/cash/devices.js
?? functions/api/cash/drawers.js
?? functions/api/cash/grants.js
?? functions/api/cash/shifts.js
?? functions/api/cash/shifts/close.js
?? src/config/offlineGrantPublicKey.js
?? src/services/cashDrawerJournal.js
?? src/services/cashMovement.js
?? src/services/cashShiftEngine.js
?? src/services/cashShiftLedger.js
?? src/services/offlineDeviceIdentity.js
?? src/services/offlineGrantEnrollment.js
?? src/services/offlineGrantStore.js
?? src/services/offlineShiftGrantPolicy.js
?? src/services/offlineUnlock.js
?? src/services/verifiedOfflineGrant.js
?? tests/cash-drawer-journal.test.mjs
?? tests/cash-movement.test.mjs
?? tests/cash-shift-durable.test.mjs
?? tests/cash-shift-engine.test.mjs
?? tests/cash-shift-hooks.test.mjs
?? tests/date-timezone.test.mjs
?? tests/offline-grant-enrollment.test.mjs
?? tests/offline-grant-signature.test.mjs
?? tests/offline-shift-grant-policy.test.mjs
?? tests/offline-unlock.test.mjs
```
## Current authoritative publication — 2026-10-04

2.6.13 is published: Web deployment https://421b2337.khodar-pos.pages.dev and https://khodar-pos.pages.dev; immutable binaries https://github.com/amerfathi/khodar-pos/releases/tag/v2.6.13. Public Android/Windows latest-release endpoints advertise2.6.13. Quality workflow37153236218 passes233 integration tests plus the security gates; production workflow37153318752 succeeded.

Independent offline invoice creates now use authenticated audited rebase and atomic local reconciliation, without discarding the queue or weakening the original server CAS. Live QA tests pass for different cashiers, same account on two devices, different branches, and Android-debug/Web. The extracted published Windows binary and production Web also pass same-account offline/reconnect, each source accepted once,pending0; after renderer reload both match the server-derived stock. No installed owner app was replaced. An earlier generic automation timeout was not reproduced; reload now waits for DOM readiness plus explicit durable cursor/stock assertions rather than network-idle.

Windows updater manifest signature/file hash verified; installer still has no Authenticode. Android APK signature verified and certificate matches2.6.12; native UI journey used debug2.6.13, not the final signed APK. No physical printer or complete installation/device matrix certification. Printed invoice numbering can still duplicate across offline devices despite distinct immutable IDs: OPEN. Mixed edits/reversals/restores/shift movements and >1000 intervening events still retain explicit conflicts; do not claim complete business reconciliation.

Production functions remain compatibility-packaged fromc10f4e5 plus the deployed free authentication fix and new rebase route. Main's timezone/cash-shift migrations were NOT implicitly deployed; cash shifts remain disabled. Do not blindly deploy all main functions against the old production schema. No paid subscription was purchased.

Git snapshot before this evidence-only commit: HEAD bb27b7403dec2565ad7a4a1b12c7edab0a8c9b78; branch main. Modified: AI_HANDOFF_CURRENT.md, RELEASE_BLOCKERS.md, tests/platform-multi-company.mjs; additional intended evidence edits docs/sales-reconciliation-2026-10-03.md and docs/releases/2.6.13.md. Untracked historical diagnostics: docs/multi-company-live-ui-audit-2026-10-03.md, tests/live-account-plan-probe.mjs, tests/live-android-auth-probe.mjs, tests/live-auth-resource-probe.mjs, tests/live-auth-validation.mjs, tests/live-test-provision.mjs. These unrelated diagnostic files are left uncommitted. Last task: published and verified scoped independent-sale synchronization repair. First next step: design/test offline-safe printed invoice series before broadening mixed-operation reconciliation; inspect current git status first. No credentials belong in this handoff; private QA configuration stays ignored.

## لقطة Git الختامية ومهمة النموذج التالي — 2026-10-04

- Current Git HEAD عند فحص ما قبلcommitالتوثيق:57ec5543aa64cf4dccd79b4ec1fe6a9075ea27ac. مصدر حزم2.6.14:f850a7679e7bdc1b57ebfb6ebc39268be1b0c778. يمكن أن يتقدمHEADبـcommitالتقرير نفسه؛ افحصgitrev-parseHEADولا تعتبر هذا hashذاتيًا للوثيقة.
- Current branch:main؛ آخرpushللكود/مسارالرفع نجح.
- git status في هذه اللقطة:Modified AI_HANDOFF_CURRENT.md،RELEASE_BLOCKERS.md،tests/platform-multi-company.mjs؛ Untracked docs/release-2.6.14-verification.md مع الملفات التاريخية المذكورة أدناه. هذه الأربعة مقصودة لـcommitالتوثيق/تشخيص الاختبار بعد النشر، لا تغيّر ثنائيات الإصدار.
- الملفات التاريخيةuntrackedالمحفوظة دونcommit:docs/multi-company-live-ui-audit-2026-10-03.md؛tests/live-account-plan-probe.mjs؛tests/live-android-auth-probe.mjs؛tests/live-auth-resource-probe.mjs؛tests/live-auth-validation.mjs؛tests/live-test-provision.mjs. لا تضفها آليًا بـgitadd-A.
- آخر مهمة:إكمال إصلاح تسوية تعارضات المالك واسترداد المصادر القديمة وترقيم الفواتير، ثم اختبارات مالية حية ونشر2.6.14 والتحقق من معلومات التحديثات والأصول العامة.
- أول خطوة للنموذج التالي:اقرأ القسم الأحدث وهذا التقرير وافحصHEAD/branch/status؛ لا تعِد النشر ولا تشغّل ترحيلات0017–0022. أي توسعة لاحقة لتاريخ>2000أو cashshiftsأو رحلةsignedAPKالمالية تحتاج اختبارات مستقلة قبل إعلانها مكتملة.
- فحص أنماط الاعتماد الفعلية بالوثيقة لم يجدPassword/Secret/Token/PrivateKeyأوbcryptliteral؛ أسماء الحقول ومفاتيح التوقيع العامة/hashالأدلة ليست أسرارًا. الاعتمادات لا تُنقل منscratchإلىgitأوالمحادثة.

## لقطة تسليم التوثيق قبل commit — 2026-10-04

Current Git HEAD:bcf0f5baf5641d5a0a4a29b5bcce9cea21ee3c09؛ Current branch:main. هذا snapshotقبلcommitالتوثيق نفسه، وليس hashذاتياً للملف. اقرأHEADالفعلي بعدالنشر. مصدرحزم2.6.14لم يتغير.

آخر مهمة:توثيق كامل المشروع الحالي وقراراته وحدوده، والتحقق منالروابط/الفهرس/الأسرار ثمpushالتوثيق إلىGitHub. أولخطوةللنموذجالتالي:اقرأREADMEوdocs/INDEXوأحدثسجلالموانع ثمgitstatus؛ لا تُعد نشرالحزم بسببcommitتوثيق. إن طُلبنشر تقني لاحق، افحصDEPLOY-REPRODUCIBLEوتوافق المخطط أولًا.

حالةGitوأسماءالملفات المعدلة/غيرالمرفوعة في هذهاللقطة:

```text
M ACCOUNTING_AUDIT_PLAN.md
 M ACCOUNTING_FINAL_REPORT.md
 M ACCOUNTING_FINDINGS.md
 M ACCOUNTING_FIXES.md
 M ACCOUNTING_RECONCILIATION.md
 M ACCOUNTING_TEST_RESULTS.md
 M AI_HANDOFF_CURRENT.md
 M AUTHORIZATION_MATRIX.md
 M CROSS_PLATFORM_AUDIT.md
 M DATABASE_SCHEMA_AUDIT.md
 M DATA_INTEGRITY_AUDIT.md
 M FINAL_RELEASE_AUDIT.md
 M OWNER_ACTIONS_REQUIRED.md
 M QA_ACCOUNTING_RECONCILIATION.md
 M QA_CROSS_PLATFORM_MATRIX.md
 M QA_DEFECT_REGISTER.md
 M QA_EVIDENCE_INDEX.md
 M QA_FINAL_CERTIFICATION.md
 M QA_MASTER_PLAN.md
 M QA_PERFORMANCE_AUDIT.md
 M QA_REGRESSION_SUITE.md
 M QA_RELEASE_READINESS.md
 M QA_SECURITY_AUDIT.md
 M QA_SYNC_AUDIT.md
 M QA_SYSTEM_INVENTORY.md
 M QA_TEST_EXECUTION.md
 M QA_TEST_REGISTRY.md
 M REGRESSION_TEST_MATRIX.md
 M RELEASE_BLOCKERS.md
 M REMEDIATION_PLAN.md
 M SECRETS_AUDIT.md
 M SECURITY_REMEDIATION.md
 M SYNC_REMEDIATION.md
 M TENANT_ISOLATION_AUDIT.md
 M audit/ACCOUNTING_AUDIT.md
 M audit/AUDIT_BASELINE.md
 M audit/BUG_REGISTER.md
 M audit/FINAL_AUDIT_REPORT.md
 M audit/FINAL_PRODUCTION_GATE.md
 M audit/FINAL_VERIFICATION_REPORT.md
 M audit/FIX_REGISTER.md
 M audit/MOBILE_DUPLICATE_ROUTE_REPORT.md
 M audit/MOBILE_UX_FINAL_REPORT.md
 M audit/MOBILE_UX_INVENTORY.md
 M audit/RBAC_MATRIX_FINAL.md
 M audit/SECURITY_AUDIT.md
 M audit/SYSTEM_INVENTORY.md
 M audit/TEST_MATRIX.md
 M audit/TEST_PLAN.md
 M docs/MULTI_PLATFORM_ARCHITECTURE.md
 M docs/accounting-day-drawer-shift-design.md
 M docs/auth-cpu-hotfix-2026-10-03.md
 M docs/conflict-owner-review-2026-10-04.md
 M docs/inbound-dependency-recovery-2026-10-04.md
 M docs/landing-refresh-2026-10-01.md
 M docs/releases/2.6.10.md
 M docs/releases/2.6.11.md
 M docs/releases/2.6.12.md
 M docs/releases/2.6.13.md
 M docs/releases/2.6.9.md
 M docs/sales-reconciliation-2026-10-03.md
 M docs/sync-activity-design.md
?? README.md
?? docs/INDEX.md
?? docs/current/ACCOUNTING.md
?? docs/current/ARCHITECTURE.md
?? docs/current/CHANGE_HISTORY.md
?? docs/current/OPERATIONS.md
?? docs/current/SECURITY.md
?? docs/current/SYNC_AND_RECOVERY.md
?? docs/current/USER_GUIDE.md
?? docs/multi-company-live-ui-audit-2026-10-03.md
?? docs/releases/2.6.14.md
?? scripts/verify-docs.cjs
?? tests/live-account-plan-probe.mjs
?? tests/live-android-auth-probe.mjs
?? tests/live-auth-resource-probe.mjs
?? tests/live-auth-validation.mjs
?? tests/live-test-provision.mjs
```

ملفاتdocs/multi-company-live-ui-audit-2026-10-03.md وtests/live-*التاريخية السابقة خارجالمهمة ولن تُضم للـcommit. باقيالوثائق الجديدة/المؤشرة وفاحصdocsمقصودة للنشر. فحصالاعتمادات لا يسجلالقيم؛configوexportsومفاتيحخاصة تبقى خارجGit.
