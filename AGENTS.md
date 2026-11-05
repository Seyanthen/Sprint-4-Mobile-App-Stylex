# Stylex Agent Guide
Guide created with Copilot AI using reference human created AGENTS.md file in commit [ef86582](https://github.com/Seyanthen/Sprint-4-Mobile-App-Stylex/commit/ef865825fa9626fb600e3b16be23ff289602b9c6)

## Project Overview

Stylex is a React Native app for creating and saving artwork locally. The planned primary pages are:

- **New Drawing**: create artwork on a fixed-size canvas.
- **Gallery**: browse and open saved artwork.

Initial drawing tools are drawing, erasing, drawing with a selected color, and color fill. Layers, brush customization, viewport zoom, drawing renaming, drawing jpg/pdf exporting, and canvas-size customization are planned future features; do not assume they are in scope unless requested.

The app currently contains Expo starter screens. Treat the structure below as the existing baseline and the product route names as the intended direction, not as already implemented functionality.

## Codebase Structure and Navigation

The app code is in `Stylex/`. Expo Router uses file-based routing: files under `src/app/` define routes, and `_layout.tsx` sets up their shared navigation.

```text
Stylex/
├── src/
│   ├── app/                     # Expo Router routes and layouts
│   │   ├── _layout.tsx          # Shared root/tab navigation setup
│   │   ├── index.tsx            # Current starter Home route; intended New Drawing entry
│   │   ├── explore.tsx          # Current starter Explore route; replace/map to Gallery
│   │   └── gallery.tsx          # Suggested route if Gallery is implemented as a separate screen
│   ├── components/              # Reusable UI, including app-tabs.tsx
│   │   └── ui/                  # Shared low-level UI components
│   ├── constants/               # Shared theme and app constants
│   ├── hooks/                   # Shared React hooks
│   └── global.css               # Global web styles
├── assets/                      # App icons and image assets
├── scripts/                     # Project scripts
├── app.json                     # Expo app configuration
├── package.json                 # Dependencies and commands
└── tsconfig.json                # Strict TypeScript configuration
```

Keep route components in `src/app/` and reusable components, hooks, and utilities outside it. Use Expo Router for navigation; update the route file and its corresponding tab trigger in `src/components/app-tabs.tsx` together when changing tabs. Prefer clear product labels (“New Drawing” and “Gallery”) over the starter labels (“Home” and “Explore”). Add folders such as `src/components/drawing/` or `src/storage/` only when implementation needs them; do not create empty scaffolding.

## Implementation Conventions

- Follow the existing React Native, Expo, and TypeScript patterns. Keep TypeScript strict and use explicit types for drawing data, component props, and storage boundaries.
- Use camelCase for variables and functions, and descriptive PascalCase for React components and types.
- Prefer small, reusable components and keep drawing state and persistence logic separate from presentation where practical.
- Use React Native components and styles for native UI. Check platform-specific behavior when using gestures, touch input, file APIs, or web-only code.
- Reuse existing theme values and shared components rather than introducing duplicate colors or styles.
- Add comments only to explain non-obvious intent, constraints, or tradeoffs; do not add comments that merely repeat what a line does.
- Avoid adding dependencies unless existing APIs cannot reasonably meet the requirement. If a native dependency is needed, check Expo SDK compatibility and whether it requires a development build.
- Do not implement planned features (layers, custom brushes, zoom, or canvas resizing) as part of unrelated work.

For example, the drawing screen should pass typed drawing state and selected tool/color to reusable canvas/tool components rather than embedding all canvas rendering and toolbar logic in a route. A future gallery item should use a shared artwork type rather than having the screen and storage layer independently interpret untyped objects.

## Local Data Expectations

- Artwork must remain available locally; do not add a remote service, account, analytics upload, or cloud sync unless explicitly requested.
- Keep saved artwork data and metadata in a clearly defined, typed format. For example, an artwork record could have an ID, title, created/updated timestamps, canvas dimensions, and either a rendered image reference or drawing data. Choose the representation based on the implemented drawing/rendering approach; do not assume this example dictates a storage library or format.
- Keep persistence behind a small storage module or helper so the Gallery and drawing screen do not each implement storage details.
- Handle loading, saving, and invalid or missing saved data explicitly. Show a useful UI state or error rather than silently reporting success when persistence fails.
- Preserve artwork across app restarts using an appropriate local persistence mechanism. Do not store large image or stroke payloads in a settings-oriented key/value store unless that is suitable for the chosen format and size.
- Avoid destructive overwrite or deletion behavior without a user action and confirmation where appropriate. Preserve existing artwork when changing the storage format, or provide a deliberate migration.

For example, saving a drawing should complete only after local persistence succeeds; the Gallery should handle an empty library separately from a storage error.

## Validation Commands

Run commands from the `Stylex/` directory. Dependencies are managed with npm and `package-lock.json`.

```bash
npm install             # Install dependencies when needed
npm run lint            # Run the configured Expo lint command
npx tsc --noEmit        # Type-check without emitting build files
npm start               # Start Expo for manual app testing
```

Run lint and type-check after code changes when available. For UI, navigation, drawing, or persistence changes, also manually exercise the affected flow in the relevant target (Android, iOS, or web) when available. There is currently no test script in `package.json`; if automated tests are later configured, run the focused tests for the changed behavior. Do not claim tests passed if they were not run.

## Boundaries

- Do not delete files without user verification.
- Do not run `npm run reset-project` without explicit approval; it moves/replaces starter project files.
- Do not run `git push`.
- Inspect `git status` and existing diffs before editing. Do not overwrite or discard unrelated user changes. Keep changes scoped to the request.
- Do not add services, dependencies, or unrequested product behavior merely because they might be useful later.
