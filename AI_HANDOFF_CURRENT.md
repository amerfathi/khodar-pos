# براكه — نقطة التسليم الحالية

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
