@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0android-cli.ps1" %*
exit /b %errorlevel%
