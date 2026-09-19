# DLSS 5 Pre-SR Manager

A focused Windows manager for **DLSS 5 Neural Rendering with OptiScaler Pre-SR**.

Scan native DLSS games, install a verified Pre-SR backend, tune multipass Neural Rendering, and adjust it from an in-game overlay without exposing the full OptiScaler menu.

> Active development. Preview builds are produced by GitHub Actions from the standalone app branch.

## What this project focuses on

This project deliberately keeps a narrower scope than general DLSS mod managers:

- **OptiScaler Pre-SR first** — run Neural Rendering before DLSS Super Resolution.
- **In-game tuning** — open the dedicated manager overlay with **Insert** and change DLSS 5 settings while the game is running.
- **Multipass controls** — configure up to three Neural Rendering passes with independent styles and advanced per-pass controls.
- **Simple game workflow** — discover installed native-DLSS games, add games manually, launch them, browse their folders, favorite or hide them, and update the managed backend in place.
- **Safer file management** — tracked backups/restores, backend updates that preserve original-file backups, and write operations blocked while the game process is running.
- **English + Simplified Chinese** — including the in-game overlay and CJK font handling.

## Pre-SR pipeline

The manager exposes the backend placement directly:

| Mode | Pipeline | Notes |
| --- | --- | --- |
| **Pre-SR** | `Neural Rendering → DLSS Super Resolution → Output` | Runs Neural Rendering at the game's internal render resolution before DLSS SR. |
| **Post-SR** | `DLSS Super Resolution → Neural Rendering → Output` | Runs Neural Rendering after upscaling and therefore processes the higher-resolution image. |

The managed backend is based on **OptiScaler-DLSSNR-PreSR-Multipass v0.7.7** and the release archive is SHA-256 verified before extraction:

`4a315a3b3ee495631bd7cb1f562f609af577443602e507bfc7a7e6749c296258`

## In-game manager

Press **Insert** in a managed game to open the DLSS 5 overlay.

The overlay can control the settings this project exposes from the Pre-SR backend, including:

- Neural Rendering on/off and Pre-SR placement
- pass count and per-pass style
- intensity, structure, skin structure and local tone controls
- automatic skin masking
- A/B effect preview
- finished-picture mode and experimental DLSS/Ray Reconstruction options
- bilingual hover explanations for technical settings
- UI scale and remembered panel state

The desktop app and the in-game overlay share the same managed backend revision, so existing games can be updated in place from the library.

## Desktop manager

The standalone Electron app includes:

- automatic launcher-library discovery plus manual game add
- native DLSS/API compatibility scanning
- favorites, hide/remove-from-library, launch and browse-folder actions
- verified backend installation and managed backend updates
- original-file backup and restore
- per-game Pre-SR and multipass configuration
- game-running write guard
- English / 简体中文 interface
- Buy Me a Coffee support link and QR code

## Runtime note

This repository does **not** redistribute NVIDIA's proprietary `nvngx_dlssnr.dll`. The open-source forwarding DLL is a different component. Follow the upstream runtime requirements for the GPU/runtime files required by DLSS Neural Rendering.

This project is not affiliated with or endorsed by NVIDIA.

## Multiplayer / anti-cheat

OptiScaler is an injection mod. Injection can conflict with anti-cheat systems and may cause crashes or account penalties. The manager does not implement anti-cheat bypasses. Use it only where modding/injection is permitted.

## Build from source

```powershell
npm ci
npm test
npm run start:standalone
```

Build the Windows portable preview with:

```powershell
npm run build:standalone:portable
```

The standalone build generates its own application icon and packages only the standalone manager surface.

## Credits and licences

- **NeoSixon** — standalone DLSS 5 Pre-SR Manager, desktop workflow and in-game manager integration
- **wilsjo2 / OptiScaler-DLSSNR-PreSR-Multipass** — Pre-SR / multipass backend, GPL-3.0
- **Rakan Alkhaldi / DLSS5-Swapper** — retained compatibility-detection code is isolated and attributed under its MIT licence
- **OptiScaler contributors** — underlying injection/rendering framework

See `LICENSE`, `THIRD_PARTY_NOTICES.md`, and the upstream projects for their respective licence terms.

---

**DLSS 5 is the product identity. Neural Rendering is the feature this manager is built to install and tune.**
