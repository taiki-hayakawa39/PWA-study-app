# Study Ledger

Study Ledger is a local study-time tracking app.

## Real React App

Install Node.js LTS first:

```text
https://nodejs.org/
```

Then run:

```text
start-app.bat
```

The app opens at:

```text
http://127.0.0.1:5173/
```

## Simple Preview

For quick local checking without the full React/Vite setup, run:

```text
start-web-app.bat
```

The preview opens at:

```text
http://127.0.0.1:4173/preview.html
```

## Smooth GitHub Workflow

Windows tools can fail when the project path contains Japanese characters.
Use the included ASCII-path workflow.

First-time setup:

```text
setup-github-workspace.bat
```

Commit and push current app changes:

```text
commit-current-app.bat
```

See details:

```text
GITHUB_WORKFLOW.md
```

## Features

- Record study date, subject, duration in minutes, and memo
- Save data in browser localStorage
- Calendar view with daily totals
- Calendar record list showing saved details
- Report view with subject totals
- Subject management with icon and color
- Responsive layout for PC and mobile
