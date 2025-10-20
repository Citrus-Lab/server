@echo off
echo 🔧 FIXING EMAIL TEMPLATE CACHING ISSUE...
echo.

echo 1. Backing up old email service...
copy "src\services\email.service.js" "src\services\email.service.backup.js" >nul 2>&1

echo 2. Replacing with new fixed email service...
copy "src\services\email.service.new.js" "src\services\email.service.js" >nul 2>&1

echo 3. Clearing Node.js cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" >nul 2>&1
)

echo 4. Testing new email template...
node src/utils/test-email-template.js

echo.
echo ✅ EMAIL TEMPLATE FIXED!
echo.
echo 📋 NEXT STEPS FOR YOU:
echo 1. Stop your server (Ctrl+C if running)
echo 2. Restart your server: npm start or node server.js
echo 3. Test sending an invitation email
echo.
echo 🎯 The new template has:
echo    - Your actual CitrusLab logo (no lemon emoji)
echo    - Clean SVG icons (no Font Awesome dependencies)
echo    - Professional citrus yellow theme
echo    - No caching issues
echo.
pause
