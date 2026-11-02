# FocusPro — تمرکز هوشمند

اپلیکیشن فارسی پومودورو برای Android با گزارش‌گیری محلی، نمودار روند مطالعه، تحلیل عادت‌ها، خروجی CSV و پشتیبان JSON.

## ساخت APK
GitHub Actions → Build FocusPro Android APK → Run workflow. فایل APK در بخش Artifacts همان اجرا قرار می‌گیرد.

## اجرای محلی
`npm install` سپس `npm run dev` برای نسخه وب.
برای اندروید: `npm run build`، سپس `npx cap add android` و `npx cap sync android` و در پوشه android دستور `./gradlew assembleDebug`.

## حریم خصوصی
گزارش‌ها با localStorage روی دستگاه نگهداری می‌شوند. اعلان پایان تایمر با Local Notifications اندروید زمان‌بندی می‌شود. هیچ حساب کاربری یا سرویس ابری اجباری وجود ندارد.
