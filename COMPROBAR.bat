@echo off
cd /d "%~dp0"
call npm test
if errorlevel 1 goto fin
call npm run verificar:mysql
:fin
pause
