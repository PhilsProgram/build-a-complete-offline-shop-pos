@echo off

cd /d "%~dp0"

echo Starting POS Server...

start "POS Server" cmd /k "cd server && npm run start"

timeout /t 5 > nul

start http://localhost:4000
