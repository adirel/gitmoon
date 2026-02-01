@echo off
echo Building GitMoon Release Installer...
echo.
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo.
echo Creating installer...
call npx electron-builder build --win --x64 --publish never
if errorlevel 1 (
    echo Packaging failed!
    pause
    exit /b 1
)
echo.
echo ✓ Build complete! Check the release folder for the installer.
pause
