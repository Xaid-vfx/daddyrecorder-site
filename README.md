# DaddyRecorder — site

Landing page for DaddyRecorder, the native Mac screen recorder.

```
website/
├── index.html        # all layout + copy
├── styles.css        # design system, hero, feature reel, download CTA
├── script.js         # custom cursor, hero demo, countdown viz
└── assets/
    └── (DMG served from GitHub Releases)
```

## Local dev

```bash
python3 -m http.server 4821
# open http://localhost:4821/
```

Drop the latest `DaddyRecorder.dmg` into `assets/` if you want the local
download button to work — production pulls from the GitHub release.

## Release

Build a new DMG from the Electron app, then:

```bash
gh release create vX.Y.Z DaddyRecorder.dmg --latest
```

The download button in `index.html` points at
`releases/latest/download/DaddyRecorder.dmg`, so a fresh release is all
that's needed.
