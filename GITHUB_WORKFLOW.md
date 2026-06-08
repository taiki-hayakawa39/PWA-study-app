# Smooth GitHub Workflow

This project lives under a Windows user folder with Japanese characters in the path. Some command-line tools can fail in that situation.

Use the included scripts to work through an ASCII-only drive alias.

## First-time setup

Double-click:

```text
setup-github-workspace.bat
```

What it does:

- Maps `S:` to `%USERPROFILE%\Documents\Codex`
- Creates `S:\github`
- Clones `taiki-hayakawa39/PWA-study-app` into `S:\github\PWA-study-app`
- Uses an isolated GitHub CLI config folder at `S:\github\.gh-config`
- Runs `gh auth login` if needed

## Commit current app changes

After making changes in this app folder, double-click:

```text
commit-current-app.bat
```

What it does:

- Maps `S:` again
- Copies the current app files into `S:\github\PWA-study-app`
- Shows `git status`
- Asks for a commit message
- Runs `git add -A`
- Commits
- Pushes to GitHub

## Normal Git commands

After setup, you can also use this folder directly:

```text
S:\github\PWA-study-app
```

Example:

```bat
git status
git add -A
git commit -m "Update study app"
git push
```

If `S:` disappears after restarting Windows, run either setup script again. The files remain in `%USERPROFILE%\Documents\Codex\github\PWA-study-app`; only the drive alias needs to be recreated.
