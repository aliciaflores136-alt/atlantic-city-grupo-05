@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo Instala Node.js 22.12 o posterior. & pause & exit /b 1)
if not exist ".env" (
 copy ".env.example" ".env" >nul
 echo Completa MYSQL_USUARIO y MYSQL_CLAVE. Guarda el archivo y cierra el Bloc de notas.
 start /wait notepad.exe ".env"
)
call npm install
if errorlevel 1 goto fin
call npm run preparar
:fin
pause
