# Stylex 7-Step Implementation Roadmap

## Purpose and current-state assessment

Stylex is currently an Expo Router starter app. The existing `Stylex/src/app/index.tsx` and `Stylex/src/app/explore.tsx` screens are still template screens, and `Stylex/src/components/app-tabs.tsx` exposes the starter `Home` and `Explore` tabs. The root README defines the product direction:

- Initial tools: drawing, erasing, drawing with a selected color, and region-based color fill.
- Core product pages: New Drawing and Gallery.
- Planned features: layers, brush customization, viewport zoom, drawing renaming, JPG/PDF export, and canvas-size customization.
- Artwork must be saved locally and remain available after an app restart.

The roadmap below divides implementation into seven focused one-hour sessions. Each session includes a concrete implementation target, expected files or boundaries, validation criteria, and an agentic prompt that can be given to an AI coding agent. The prompts assume the agent is working from the repository root and must inspect existing code before editing.

## Working rules for every session

The coding agent should:

1. Read `AGENTS.md`, the root `README.md`, and the relevant existing source files before changing code.
2. Inspect `git status` and preserve unrelated user changes.
3. Keep the implementation local-only; do not add accounts, remote services, analytics, or cloud sync.
4. Use strict TypeScript, typed component props, and React Native/Expo APIs that match the installed SDK.
5. Keep persistence behind a small storage module instead of duplicating storage logic in screens.
6. Run `npm run lint` and `npx tsc --noEmit` from `Stylex/` after each session when possible, and report any limitation honestly.
7. Avoid implementing features that are not part of the current session unless they are required to keep the app working.

## Step 1 — Establish the product shell and drawing architecture

### One-hour objective

Replace the Expo starter navigation language with the Stylex product shell and establish typed boundaries for artwork, drawing tools, and canvas state. This session should leave the app navigable even before the drawing engine is complete.

### Implementation guidance

- Rename the tab labels to `New Drawing` and `Gallery`, updating route names and triggers together.
- Replace the starter Home/Explore content with a minimal New Drawing screen and an empty Gallery screen.
- Add a small typed domain model outside `src/app/`, such as an artwork type, canvas dimensions, point/stroke types, tool union, and color representation.
- Decide and document the initial representation of artwork. A serializable vector model of strokes plus fill operations is preferred because it supports local persistence and later editing.
- Create reusable drawing-oriented component boundaries without adding empty scaffolding. Keep route components responsible for composition and keep state/rendering helpers outside routes.
- Preserve the existing light/dark theme conventions and safe-area behavior.

### Definition of done

- The app shows product labels instead of Expo starter labels.
- Navigation reaches New Drawing and Gallery.
- The domain types compile and do not depend on screen-specific untyped objects.
- No drawing or persistence behavior is falsely presented as complete.

### Agentic prompt

```text
You are working in the Stylex repository. Read AGENTS.md and the root README.md first, then inspect the current Expo Router starter code and git status. Implement Step 1 of roadmap.md: establish the product shell and typed drawing architecture.

Replace the starter Home/Explore labels and screens with New Drawing and Gallery routes, updating route files and tab triggers consistently. Add only the typed domain model and reusable component boundaries needed for later drawing work: artwork metadata, canvas dimensions, points/strokes, drawing tools, and serializable drawing state. Keep the app local-only, preserve the existing theme and safe-area patterns, and do not implement advanced features yet. Do not discard unrelated changes. Run npm run lint and npx tsc --noEmit from Stylex, fix issues caused by your changes, and summarize files changed, decisions, and validation results.
```

## Step 2 — Implement the drawing canvas and initial tools

### One-hour objective

Deliver the first usable drawing experience: a fixed-size canvas with touch/pointer input, a selected color, drawing, erasing, and color fill.

### Implementation guidance

- Build a reusable canvas component that receives typed drawing state and callbacks rather than owning all route-level state.
- Support pointer/touch movement and completion events, including a reasonable minimum stroke width and coordinate conversion from screen space to canvas space.
- Implement drawing with the selected color, erasing, and fill as explicit tool modes.
- Make Fill a tap-based, region-based flood fill: fill only the connected region containing the tap point, bounded by existing marks or the canvas edge. An empty or unbounded canvas should fill as one region without crashing.
- Choose a rendering/data representation that preserves fill boundaries and operation order so later strokes, erasing, saving, reopening, layers, and export can reproduce the filled regions accurately. Do not implement Fill as only a global background-color change.
- Use a real canvas renderer for the drawing surface rather than one view per stroke segment. Strokes should render as continuous paths with rounded caps and joins, and erasing should use canvas compositing/masking rather than repainting with a guessed background color. If a native canvas dependency is required, document its development-build requirement and verify its Expo SDK compatibility.
- The current renderer uses `@shopify/react-native-skia`; native testing requires a development build containing the Skia native module, while web rendering must wait for CanvasKit initialization.
- Keep the first canvas size fixed, as canvas-size customization is a later feature.
- Make the tool bar accessible and visibly communicate the selected tool and color.
- Handle the web target if the existing Expo setup supports it, while prioritizing the target used for manual validation.

### Definition of done

- A user can draw multiple strokes on the canvas.
- Eraser removes or masks marks according to the chosen representation.
- A color can be selected and applied to new marks.
- Fill performs a region-based flood fill at the tapped point, respects boundaries created by existing marks, and has no crashes on an empty canvas.
- The UI clearly distinguishes the three initial tool modes (Draw, Erase, and Fill) and the selected color palette.

### Agentic prompt

```text
Implement Step 2 of roadmap.md in the Stylex repository. First inspect the typed drawing model from Step 1 and the installed Expo/React Native dependencies. Build a reusable, typed canvas component and a New Drawing screen that supports drawing with a selected color, erasing, and region-based color fill.

Use React Native/Expo-compatible input handling and keep canvas state separate from presentation where practical. Use the fixed initial canvas size; do not add layers, zoom, custom brushes, export, or persistence in this session. Make tool selection and color selection visible and usable. Preserve existing theme conventions and unrelated work. Run npm run lint and npx tsc --noEmit from Stylex, then report manual validation steps and any platform limitations.
```

## Step 3 — Add local persistence and save/open behavior

### One-hour objective

Make artwork durable across app restarts and connect the drawing screen to a typed local storage boundary.

### Implementation guidance

- Choose a persistence mechanism compatible with the installed Expo project and the selected serialized artwork representation. Avoid putting large payloads in a settings-oriented store if the artwork format is too large for it.
- Create a storage module with typed operations such as list, read, create/update, and delete, even if deletion is not exposed until Gallery work.
- Generate stable IDs and timestamps for artwork records.
- Save only after persistence succeeds; show a loading or error state instead of reporting success prematurely.
- Add a simple save action to New Drawing and an open/edit path for an existing artwork if the current navigation structure supports it.
- Handle malformed, missing, or empty storage data explicitly.

### Definition of done

- Saving an artwork creates a typed local record.
- Closing and reopening the app preserves saved artwork.
- Storage failures produce a useful user-facing state.
- Existing records are not silently overwritten except through an intentional update flow.

### Agentic prompt

```text
Implement Step 3 of roadmap.md. Inspect the current artwork types and canvas state, then create a small typed local storage module for artwork records. Choose an Expo-compatible persistence approach based on the actual installed dependencies and the serialized data size; do not add a remote service or account system.

Add save behavior to New Drawing and connect loading an existing artwork when appropriate. Include stable IDs, created/updated timestamps, explicit loading and error states, and validation for malformed or missing records. Saving must be considered successful only after local persistence succeeds. Do not implement Gallery presentation, layers, zoom, export, or canvas resizing yet. Run lint and TypeScript checks from Stylex and report the storage choice and validation results.
```

## Step 4 — Build the Gallery and artwork lifecycle

### One-hour objective

Turn the Gallery route into a useful local library where users can see saved artwork, open it for editing, and intentionally remove artwork with confirmation.

### Implementation guidance

- Load artwork through the storage module rather than reading storage directly in the route.
- Show distinct loading, empty, error, and populated states.
- Create a reusable gallery item with title/metadata and a preview derived from the artwork representation.
- Make opening an item return to the drawing experience with the correct artwork loaded.
- If deletion is exposed, require a user action and confirmation and refresh the gallery after success.
- Add pull-to-refresh or a focused refresh action only if it fits the existing platform patterns.

### Definition of done

- The Gallery lists locally saved artwork after navigation and app restart.
- Empty libraries are clearly different from storage errors.
- A user can open a saved artwork and continue editing it.
- Deletion, if implemented, is deliberate and confirmed.

### Agentic prompt

```text
Implement Step 4 of roadmap.md. Inspect the current storage API and navigation routes, then build the Gallery screen around that storage boundary. Add typed gallery items with useful metadata and previews, plus distinct loading, empty, populated, and error states.

Allow a user to open a saved artwork in the drawing screen and continue editing it. If you add deletion, require explicit user confirmation and update storage and the gallery only after successful deletion. Keep the app local-only and do not add advanced drawing features yet. Run npm run lint and npx tsc --noEmit from Stylex and describe how you manually verified save, restart, open, and empty-library flows.
```

## Step 5 — Add layers and brush customization

### One-hour objective

Implement the planned editing features that build directly on the drawing model: multiple layers and configurable brush behavior.

### Implementation guidance

- Evolve the artwork model with ordered layers, an active layer, visibility, and a clear compositing/rendering rule.
- Keep layer operations typed: add, select, rename if needed for usability, hide/show, reorder, and remove with safeguards for the last layer.
- Add a small brush settings model, at minimum size and opacity or hardness if the rendering approach supports it.
- Keep tool state and brush settings separate so the canvas remains reusable.
- Update serialization and storage migration defensively so existing single-layer artwork remains readable.
- Avoid introducing a full graphics engine unless the current canvas approach cannot support the requirement.

### Definition of done

- Users can create, select, hide/show, and remove layers without losing unrelated layer content.
- Brush customization visibly affects new strokes.
- Existing saved artwork still loads after the model change.
- Layer and brush state is saved and restored.

### Agentic prompt

```text
Implement Step 5 of roadmap.md. Start by reviewing the existing serialized artwork format and canvas renderer. Extend the typed model to support ordered layers and a selected layer, then add a focused layer UI for add/select/visibility/reorder/remove with protection against removing the final layer.

Add practical brush customization, such as size and opacity, and make it affect newly created strokes. Update rendering, serialization, storage validation, and any migration needed for existing single-layer artwork. Preserve the initial tools and avoid zoom, export, and canvas resizing in this session. Run lint and TypeScript checks from Stylex and manually verify that old and newly saved artwork remain editable.
```

## Step 6 — Add zoom, canvas-size customization, and renaming

### One-hour objective

Complete the planned editing workflow with viewport zoom, configurable canvas dimensions for new artwork, and user-facing artwork names.

### Implementation guidance

- Add a viewport transform that separates display scale/offset from artwork coordinates so saved geometry remains stable.
- Support platform-appropriate pinch or pointer zoom plus a reset-to-fit action; keep drawing input from accidentally zooming when the user is drawing.
- Add validated canvas-size presets or width/height controls for new artwork. Define behavior when loading an artwork with existing dimensions.
- Add a rename flow with validation, sensible defaults, and persistence of the title.
- Test small and large dimensions, orientation changes, and restoring an existing artwork.
- Keep these changes scoped to editing UX; do not add export yet.

### Definition of done

- Users can zoom and reset the viewport without changing stored artwork coordinates.
- New artwork can use a validated custom or preset canvas size.
- Existing artwork retains its dimensions when reopened.
- Artwork names can be changed and persist in the Gallery.

### Agentic prompt

```text
Implement Step 6 of roadmap.md. Inspect the current canvas coordinate system before editing. Add a typed viewport transform with zoom and reset-to-fit, using platform-appropriate gestures or controls and ensuring drawing input is not confused with zoom input.

Add validated canvas-size selection for new artwork while preserving dimensions for existing artwork, and add a rename flow that persists a validated title and updates Gallery metadata. Keep stored artwork coordinates independent from viewport scale. Do not implement export in this session. Run npm run lint and npx tsc --noEmit from Stylex, then manually verify zoom, reset, custom dimensions, rename, restart, and reopen behavior.
```

## Step 7 — Add JPG/PDF export, polish, and release validation

### One-hour objective

Finish the planned feature set with export and use the remaining time for end-to-end validation, error handling, and concise project documentation.

### Implementation guidance

- Render the artwork to an exportable image using an Expo-compatible approach that matches the actual platform support.
- Add JPG export with a user-visible success/failure state and a platform share/save flow where available.
- Add PDF export only if the chosen Expo-compatible implementation is reliable for the target; otherwise provide a clear limitation and leave a focused follow-up note rather than pretending it works.
- Keep exports derived from the artwork model so layers, colors, canvas size, and viewport state are handled correctly.
- Polish loading, save, export, and storage error states; prevent duplicate saves or exports while an operation is active.
- Update the README with actual installation, run, usage, and development-environment instructions, and replace placeholder future-work entries with accurate status.
- Run lint and type-check, then manually exercise the full flow: create, draw, erase, fill, color, save, restart, gallery, open, rename, layers, brush settings, zoom, custom size, and export.

### Definition of done

- JPG export works on the supported target or is explicitly documented as a limitation.
- PDF export works on the supported target or is explicitly documented as a limitation with no misleading UI.
- The full local artwork lifecycle is usable and survives restart.
- README instructions reflect the actual project.
- Validation results and remaining issues are recorded.

### Agentic prompt

```text
Implement Step 7 of roadmap.md. Read the current implementation and verify the actual Expo SDK/platform capabilities before choosing an export method. Add JPG export and a platform-appropriate share/save flow, with typed loading, success, and error states. Add PDF export only if it can be implemented reliably with the current project; otherwise document the limitation clearly and avoid presenting a broken control.

Polish save, storage, gallery, and export states, prevent duplicate operations, and ensure exports reflect the artwork model rather than only the current viewport. Update the root README with accurate setup, run, usage, development, and feature-status information. Run npm run lint and npx tsc --noEmit from Stylex. Manually exercise the complete create/draw/save/restart/gallery/edit/advanced-tools/export flow and report passed checks, platform limitations, and remaining issues. Do not discard unrelated user changes.
```

## Suggested completion criteria for the whole roadmap

At the end of the seven sessions, Stylex should provide a local-first drawing app with New Drawing and Gallery routes, the four initial drawing tools, durable artwork storage, a usable gallery lifecycle, layers, brush customization, viewport zoom, canvas-size customization, renaming, and the export capabilities that are supported by the selected Expo targets. Any unsupported platform feature should be documented honestly rather than represented as complete.
