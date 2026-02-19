@echo off
setlocal

REM Put dump.h in this same folder, then double-click this file.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update_offsets.ps1" -DumpPath "%~dp0dump.h" -HtmlPath "%~dp0dumped.html"

echo.
echo Done. If you see an error above, make sure dump.h exists and dumped.html contains a ^<pre^>^<code^> block.
pause
endlocal
