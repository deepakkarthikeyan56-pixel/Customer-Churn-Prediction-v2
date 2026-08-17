@echo off
echo =====================================================================
echo Setting up Customer Churn System 24/7 Always-Awake Auto-Start
echo =====================================================================

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_PATH=%~dp0start_background.vbs"

echo Creating shortcut in Windows Startup Folder: %STARTUP_FOLDER%

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\CustomerChurnAI_24_7.lnk'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_PATH%\"'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

echo.
echo [SUCCESS] Server is now configured to automatically launch on Windows boot and stay awake 24/7!
pause
