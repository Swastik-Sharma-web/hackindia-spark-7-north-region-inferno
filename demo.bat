@echo off
setlocal

cd /d "%~dp0"

echo Starting TrustWork X demo...
echo.
echo API will run on http://localhost:4000
echo Web app will run on http://localhost:3000
echo.

start "TrustWork API" cmd /k "cd /d ""%~dp0apps\api"" && npm run dev"
start "TrustWork Web" cmd /k "cd /d ""%~dp0apps\web"" && npm run dev"

echo Waiting for the web app to start...
:wait_web
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:3000 -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
	timeout /t 2 /nobreak >nul
	goto wait_web
)

start http://localhost:3000

echo.
echo Demo windows launched.
echo If the browser did not open, visit http://localhost:3000 manually.
pause