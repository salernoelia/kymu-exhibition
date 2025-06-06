# Kymu Exhibition App

![Kymu Exhibition Overview](/public/kymu-exhibition-overview.png)

This Nuxt 3 web application is part of the larger [Kymu](https://github.com/salernoelia/kymu) project (a platform for hybrid pediatric neuromuscular rehabilitation). This specific "Exhibition App" focuses on providing an interactive exercise experience using real-time body tracking via a webcam, designed for display on a TV or large screen. It assesses Range of Motion (ROM) and guides users through a series of configurable exercises and is meant to show the potential capabilities of the Kymu exercising platform.

[Bluetooth Remote Repository](https://github.com/salernoelia/kymu-exhibition-remote)

**Part of the [Kymu Main Project](https://github.com/salernoelia/kymu)** (Your link here if it's public, or describe the main project if private).

## Features

* **Real-time Pose Tracking:** Utilizes Google Mediapipe to track body landmarks via webcam.
* **Range of Motion (ROM) Assessment:** Calculates joint angles based on pose data.
* **Interactive Exercises:** Guides users through a sequence of exercises defined in `assets/exercises_config.json`.
* **Auditory & Visual Feedback:**
  * Sound effects for user actions and exercise states.
  * Dynamic audio tones (using Tone.js) corresponding to ROM.
  * Lottie animations for engaging visual cues.
* **Persistent Results:** Saves exercise outcomes (angles, pain points) to a local SQLite database using Drizzle ORM.
* **Remote Control / Keyboard Navigation:** Designed for easy interaction from a distance.
* **Fullscreen Mode:** Optimizes the experience for larger displays.
* **Customizable Poses:** `assets/pose_config.json` defines specific joint configurations for different exercises.

## Tech Stack

* **Framework:** Nuxt 3 (Vue 3, TypeScript)
* **Styling:** Tailwind CSS
* **Pose Tracking:** Google Mediapipe (Pose)
* **State Management:** Pinia
* **Audio:** Tone.js (for ROM feedback), standard HTML5 Audio for SFX
* **Animations:** Lottie, Motion One (`motion-v`)
* **UI Components:** Custom Vue components
* **Linting/Formatting:** ESLint, Prettier

## Getting Started

### Prerequisites

* Node.js (LTS version recommended, e.g., v18 or v20)
* npm (or yarn/pnpm)
* A webcam (for pose tracking functionality)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/salernoelia/kymu-exhibition.git
    cd kymu-exhibition
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

### Running the Application

1. **Start the development server:**

    ```bash
    npm run dev
    ```

2. Open your browser and navigate to `http://localhost:3000`.

## Configuration

* **Exercises:** Defined in `assets/exercises_config.json`. This file outlines the sequence of exercises, their properties, and goals.
* **Pose Definitions:** Specific joint landmarks and target angles for ROM calculations are configured in `assets/pose_config.json`.
* **Remote Control** Key mappings for the remote can be configured in `assets/remote_config.json`.

## Chrome Kiosk Mode

macOS

```sh
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --start-fullscreen \
  --app=http://localhost:3000
```

```sh
# make START_EXHIBITION.sh executable
chmod +x START_EXHIBITION.sh
```

Windows (Terminal)

```sh
@echo off
REM Full kiosk with additional flags for Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk ^
  --disable-web-security ^
  --disable-features=VizDisplayCompositor ^
  --start-fullscreen ^
  --app=http://localhost:3000
```

Windows (Powershell)

``sh
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
--kiosk `
  --disable-web-security `
--disable-features=VizDisplayCompositor `
  --start-fullscreen `
  --app=<http://localhost:3000>
```


```sh
#!/bin/zsh
cd /Users/user/kymu-exhibition || exit 1

# Create persistent Chrome profile directory
CHROME_PROFILE_DIR="$HOME/.kymu-chrome-profile"
mkdir -p "$CHROME_PROFILE_DIR"

# Create preferences file to auto-grant camera permissions
PREFS_FILE="$CHROME_PROFILE_DIR/Default/Preferences"
mkdir -p "$(dirname "$PREFS_FILE")"

# Set up preferences to allow camera access for localhost:3000
cat > "$PREFS_FILE" << 'EOF'
{
   "profile": {
      "content_settings": {
         "exceptions": {
            "media_stream_camera": {
               "http://localhost:3000,*": {
                  "last_modified": "13000000000000000",
                  "setting": 1
               }
            },
            "media_stream_mic": {
               "http://localhost:3000,*": {
                  "last_modified": "13000000000000000",
                  "setting": 1
               }
            }
         }
      }
   }
}
EOF

node .output/server/index.mjs &
NODE_PID=$!

sleep 2

cleanup() {
    echo "Cleaning up..."
    kill $NODE_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Open Chrome with persistent profile
open -W -a "Google Chrome" --args \
  --kiosk \
  --disable-web-security \
  --user-data-dir="$CHROME_PROFILE_DIR" \
  --no-default-browser-check \
  --no-first-run \
  --start-fullscreen \
  --start-maximized \
  --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:3000

cleanup
```