@echo off
setlocal

set "CODEX_ROOT=%USERPROFILE%\Documents\Codex"
set "DRIVE=S:"
set "WORKSPACE=%DRIVE%\github"
set "REPO_DIR=%WORKSPACE%\PWA-study-app"
set "GH_CONFIG_DIR=%WORKSPACE%\.gh-config"
set "SOURCE_DIR=%~dp0"

subst %DRIVE% /D >nul 2>nul
subst %DRIVE% "%CODEX_ROOT%"
if errorlevel 1 (
  echo Failed to create %DRIVE% drive mapping.
  pause
  exit /b 1
)

if not exist "%REPO_DIR%\.git" (
  echo Git workspace was not found.
  echo Run setup-github-workspace.bat first.
  pause
  exit /b 1
)

echo Syncing current app files into ASCII Git workspace...
robocopy "%SOURCE_DIR%" "%REPO_DIR%" /MIR /XD .git node_modules dist .vite /XF server.err.log server.out.log >nul
if errorlevel 8 (
  echo File sync failed.
  pause
  exit /b 1
)

cd /d "%REPO_DIR%"

echo.
git status -sb
echo.
set /p COMMIT_MSG=Commit message: 
if "%COMMIT_MSG%"=="" (
  echo Commit cancelled.
  pause
  exit /b 1
)

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to commit.
  pause
  exit /b 0
)

git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo Commit failed.
  pause
  exit /b 1
)

git push
if errorlevel 1 (
  echo Push failed. Check your GitHub login or network connection.
  pause
  exit /b 1
)

echo.
echo Commit and push complete.
pause
