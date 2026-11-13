# Sprint-4-Mobile-App-Stylex

Stylex is a local-first Expo/React Native app that allows users to draw, paint, and save artwork on the device.

The current implementation provides a fixed-size drawing canvas with draw, erase, and region-based fill tools; color selection; brush size and opacity controls; layers; artwork titles; local persistence; and a Gallery for reopening and deleting saved artwork. Viewport zoom, JPG/PDF export, and canvas-size customization remain future work.

Requirements:
- The app should have at least one screen
- Provide at least 1 input from the user (e.g. tap, double-tap, swipe)
- The display should change after the input from the user.
- Display a picture
- Provide a custom icon for the app on the phone

Stretch Challenge:
- Incorporate two or more screens
- Store data either in local storage so is persists even if the app closes or if the phone is turned off

## Current Implementation

The requirements and stretch challenge are implemented in the following areas:

| Capability | Implementation |
|---|---|
| At least one screen | `Stylex/src/app/index.tsx` provides the New Drawing screen. |
| User input and changing display | `Stylex/src/components/drawing/drawing-canvas.tsx` handles touch/pointer input, and `Stylex/src/app/index.tsx` updates the drawing state and rendered canvas. Tool, color, brush, layer, save, and title controls are also interactive. |
| Display a picture | `Stylex/src/components/drawing/drawing-canvas.tsx` renders artwork with `@shopify/react-native-skia`; `Stylex/src/components/drawing/artwork-preview.tsx` renders saved artwork previews in the Gallery. |
| Custom app icon | `Stylex/app.json` configures the app icon and platform-specific icons from `Stylex/assets/images/` and `Stylex/assets/expo.icon/`. |
| Two or more screens | `Stylex/src/components/app-tabs.tsx` exposes the New Drawing (`index`) and Gallery (`explore`) routes. The Gallery implementation is in `Stylex/src/app/explore.tsx`. |
| Local persistence | `Stylex/src/storage/artwork-storage.ts` stores versioned artwork records in browser local storage on web and the app document directory on native platforms. |

### Drawing capabilities

- Draw continuous strokes with a selected palette color.
- Erase strokes using canvas compositing.
- Fill the connected region at a tapped point.
- Adjust brush size and opacity for new strokes.
- Add, select, hide/show, reorder, and remove layers, while protecting the final layer.
- Edit an artwork title and save a new or existing artwork record.

### Gallery capabilities

- Load saved artwork through the storage module when the Gallery receives focus.
- Show loading, empty, populated, and storage-error states.
- Preview artwork, show its title and update date, and refresh the list with pull-to-refresh.
- Open a saved artwork in New Drawing for continued editing.
- Delete artwork only after an explicit confirmation.

The serializable artwork model is defined in `Stylex/src/domain/artwork.ts`. Existing single-layer records are migrated when read by `Stylex/src/storage/artwork-storage.ts`.

## Instructions for Build and Use

Run the commands below from the `Stylex/` directory.

1. Install dependencies: `npm.cmd install`
2. Start the Expo development server: `npm.cmd start`
3. For web, use `npm.cmd run web`. For Android, use `npm.cmd run android`; use `npm.cmd run ios` when the corresponding development environment is configured.

Instructions for using the software:

1. Open **New Drawing**, choose a tool and color, then draw on the canvas. Use Fill by tapping a region.
2. Adjust brush size or opacity as needed. Use the Layers controls to add, select, hide/show, reorder, or remove layers.
3. Enter an optional title and choose **Save**. Open **Gallery** to preview, reopen, refresh, or delete saved artwork.

Native drawing requires a development build that includes the Skia native module. Web rendering waits for CanvasKit initialization before displaying the canvas.

## Development Environment

To recreate the development environment, you need the following software and/or libraries with the specified versions:

* Node.js and npm
* Expo SDK 58
* React Native 0.88.1 and React 19.3.0
* TypeScript 6.0.3
* `@shopify/react-native-skia` 2.14.0 or a compatible installed version

Useful development checks from `Stylex/` are `npm run lint` and `npx tsc --noEmit`.

## Useful Websites to Learn More

I found these websites useful in developing this software:

* [W3Schools Type Script Tutorial](https://www.w3schools.com/typescript/index.php)
* [W3Schools React Tutorial](https://www.w3schools.com/react/)
* [React Native Crash Course](https://www.youtube.com/watch?v=XCifkDC0yXA)
* [How to Write AGENTS.md files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

## Future Work

The following items I plan to fix, improve, and/or add to this project in the future:

* [ ] Add viewport zoom and a reset-to-fit interaction.
* [ ] Add validated canvas-size customization.
* [ ] Add JPG and PDF export with platform-appropriate sharing or saving.
