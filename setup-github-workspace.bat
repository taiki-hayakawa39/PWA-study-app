@echo off
setlocal

set "CODEX_ROOT=%USERPROFILE%\Documents\Codex"
set "DRIVE=S:"
set "WORKSPACE=%DRIVE%\github"
set "REPO_DIR=%WORKSPACE%\PWA-study-app"
set "REPO_URL=https://github.com/taiki-hayakawa39/PWA-study-app.git"
set "GH_CONFIG_DIR=%WORKSPACE%\.gh-config"

echo Setting up an ASCII Git workspace for Study Ledger.
echo.

subst %DRIVE% /D >nul 2>nul
subst %DRIVE% "%CODEX_ROOT%"
if errorlevel 1 (
  echo Failed to create %DRIVE% drive mapping.
  pause
  exit /b 1
)

if not exist "%WORKSPACE%" mkdir "%WORKSPACE%"
if not exist "%GH_CONFIG_DIR%" mkdir "%GH_CONFIG_DIR%"

where git >nul 2>nul
if errorlevel 1 (
  echo Git was not found. Please install Git for Windows.
  echo https://git-scm.com/download/win
  pause
  exit /b 1
)

where gh >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI was not found. Please install GitHub CLI.
  echo https://cli.github.com/
  pause
  exit /b 1
)

if exist "%REPO_DIR%\.git" (
  echo Repository already exists:
  echo %REPO_DIR%
  git -C "%REPO_DIR%" pull --ff-only
) else (
  echo Cloning repository into:
  echo %REPO_DIR%
  git clone "%REPO_URL%" "%REPO_DIR%"
)

echo.
echo Checking GitHub CLI authentication with isolated config:
gh auth status
if errorlevel 1 (
  echo.
  echo Please sign in to GitHub CLI.
  gh auth login
)

echo.
echo Setup complete.
echo Use this folder for future Git work:
echo %REPO_DIR%
echo.
echo You can now run commit-current-app.bat from the current app folder.
pause
