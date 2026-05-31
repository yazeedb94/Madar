# 🚀 دليل تهيئة ونشر المشروع على Railway باستخدام PostgreSQL

لقد قمنا بتهيئة المشروع بالكامل ليدعم **PostgreSQL** بدلاً من SQLite، وحللنا مشكلة الـ TypeScript التي تسببت في فشل عملية البناء (Build) على الاستضافة.

إليك الخطوات المرتبة والسهلة لتهيئة قاعدة البيانات ونشر المشروع بنجاح على **Railway**:

---

## 1️⃣ إنشاء قاعدة بيانات PostgreSQL على Railway
1. افتح مشروعك في لوحة تحكم [Railway](https://railway.com/).
2. اضغط على زر **+ New** ثم اختر **Database** ثم اختر **Add PostgreSQL**.
3. سيقوم Railway بإنشاء قاعدة البيانات فوراً وتوليد رابط اتصال بها.

---

## 2️⃣ ربط تطبيق Next.js بقاعدة البيانات
بمجرد إنشاء قاعدة البيانات في نفس المشروع على Railway، سيقوم Railway تلقائياً بتوفير المتغير البيئي `DATABASE_URL` للتطبيق.
* **تأكد من:** إدخال أي متغيرات بيئية أخرى يحتاجها تطبيقك (إن وجدت) في تبويب **Variables** الخاص بخدمة التطبيق (Web Service).

---

## 3️⃣ تهيئة قاعدة البيانات وضخ الجداول (Schema Push)
بما أننا قمنا بتحويل محرك قاعدة البيانات إلى **PostgreSQL**، يجب إنشاء الجداول وتثبيتها على قاعدة البيانات الجديدة.
أسهل وأسرع طريقة للقيام بذلك دون مشاكل هي استخدام `prisma db push`:

1. انسخ رابط الاتصال بقاعدة البيانات الخاص بـ Railway (تجد الكود في تبويب **Variables** باسم `DATABASE_URL` في خدمة الـ PostgreSQL).
2. افتح ملفك المحلي `.env` في جهازك وقم بتحديث `DATABASE_URL` مؤقتاً برابط PostgreSQL الخاص بـ Railway:
   ```env
   DATABASE_URL="postgresql://YOUR_RAILWAY_POSTGRES_URL"
   ```
3. افتح سطر الأوامر (Terminal) في مجلد `subscription-app` وقم بتشغيل الأمر التالي لضخ الجداول مباشرة:
   ```bash
   npx prisma db push
   ```
   *سيقوم هذا الأمر بإنشاء جميع الجداول والعلاقات في قاعدة البيانات على Railway بلمح البصر وبشكل متوافق 100%.*

---

## 4️⃣ رفع التعديلات إلى GitHub
لقد أجرينا كافة التعديلات اللازمة داخل مجلد `subscription-app`. يمكنك الآن رفع التعديلات من داخل المجلد لتحديث مستودع الـ GitHub الخاص بك:

```bash
# تأكد من الانتقال إلى مجلد المشروع
cd subscription-app

# إضافة التعديلات
git add .

# تسجيل التعديل
git commit -m "config: setup for PostgreSQL on Railway and fix stats type checking error"

# دفع التعديلات إلى GitHub
git push origin main
```

---

## 🛠️ ملخص التعديلات التي قمنا بها لنجاح العملية:
1. **حل مشكلة الـ Build:** قمنا بتعريف صريح للأنواع (Explicit Typing) لبارامترات الفلترة والتجميع في ملف [route.ts](file:///c:/Users/MSI/Desktop/projects/%D9%85%D9%88%D8%A7%D9%82%D8%B9%D9%8A/%D8%A7%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%D8%A7%D8%AA/subscription-app/app/api/saas/stats/route.ts#L44-L47) لتجنب أخطاء TypeScript Strict Mode أثناء البناء.
2. **دعم PostgreSQL الديناميكي:** قمنا بتعديل ملف الاتصال [client.ts](file:///c:/Users/MSI/Desktop/projects/%D9%85%D9%88%D8%A7%D9%82%D8%B9%D9%8A/%D8%A7%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%D8%A7%D8%AA/subscription-app/prisma/client.ts) ليتعرف تلقائياً على نوع قاعدة البيانات. إذا كان الرابط يبدأ بـ `postgres` سيقوم بالاتصال الطبيعي بـ PostgreSQL، وإلا سيعود لـ SQLite (مما يضمن عمل المشروع محلياً وسحابياً دون أي مشاكل).
3. **تحديث المخطط:** قمنا بتحويل مزود قاعدة البيانات في [schema.prisma](file:///c:/Users/MSI/Desktop/projects/%D9%85%D9%88%D8%A7%D9%82%D8%B9%D9%8A/%D8%A7%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%D8%A7%D8%AA/subscription-app/prisma/schema.prisma) ليصبح `postgresql`.
4. **توليد تلقائي للعميل (Client Generation):** قمنا بتعديل أمر البناء `build` في [package.json](file:///c:/Users/MSI/Desktop/projects/%D9%85%D9%88%D8%A7%D9%82%D8%B9%D9%8A/%D8%A7%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%D8%A7%D8%AA/subscription-app/package.json) ليصبح `prisma generate && next build` لضمان إنشاء عميل Prisma بالأنواع الصحيحة قبل بدء البناء على الاستضافة.

المشروع الآن جاهز تماماً للنشر والانطلاق! 🚀
