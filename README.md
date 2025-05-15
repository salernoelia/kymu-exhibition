# Kymu Exhibition App

This Nuxt 3 web application is part of the larger [Kymu](https://github.com/salernoelia/kymu) project (a platform for hybrid pediatric neuromuscular rehabilitation). This specific "Exhibition App" focuses on providing an interactive exercise experience using real-time body tracking via a webcam, designed for display on a TV or large screen. It assesses Range of Motion (ROM) and guides users through a series of configurable exercises and is meant to show the potential capabilities of the Kymu exercising platform.

**Part of the [Kymu Main Project](https://github.com/salernoelia/kymu)** (Your link here if it's public, or describe the main project if private).

## Features

*   **Real-time Pose Tracking:** Utilizes Google Mediapipe to track body landmarks via webcam.
*   **Range of Motion (ROM) Assessment:** Calculates joint angles based on pose data.
*   **Interactive Exercises:** Guides users through a sequence of exercises defined in `assets/exercises_config.json`.
*   **Auditory & Visual Feedback:**
    *   Sound effects for user actions and exercise states.
    *   Dynamic audio tones (using Tone.js) corresponding to ROM.
    *   Lottie animations for engaging visual cues.
*   **Persistent Results:** Saves exercise outcomes (angles, pain points) to a local SQLite database using Drizzle ORM.
*   **Remote Control / Keyboard Navigation:** Designed for easy interaction from a distance.
*   **Fullscreen Mode:** Optimizes the experience for larger displays.
*   **Customizable Poses:** `assets/pose_config.json` defines specific joint configurations for different exercises.

## Tech Stack

*   **Framework:** Nuxt 3 (Vue 3, TypeScript)
*   **Styling:** Tailwind CSS
*   **Pose Tracking:** Google Mediapipe (Pose)
*   **Database:** SQLite
*   **ORM:** Drizzle ORM
*   **State Management:** Pinia
*   **Audio:** Tone.js (for ROM feedback), standard HTML5 Audio for SFX
*   **Animations:** Lottie, Motion One (`motion-v`)
*   **UI Components:** Custom Vue components
*   **Linting/Formatting:** ESLint, Prettier

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended, e.g., v18 or v20)
*   npm (or yarn/pnpm)
*   A webcam (for pose tracking functionality)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/salernoelia/kymu-exhibition.git
    cd kymu-exhibition
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Database Setup (Drizzle ORM with SQLite)

This project uses Drizzle ORM to manage a local SQLite database (`drizzle.db`).

1.  **Generate Drizzle Migrations (if schema changes):**
    If you modify the database schema in `db/users.ts` or `db/results.ts`, you'll need to generate new migration files:
    ```bash
    npm exec drizzle-kit generate
    ```

2.  **Apply Migrations to Database:**
    This command will create the `drizzle.db` file if it doesn't exist and apply any pending migrations to set up your database tables:
    ```bash
    npm exec drizzle-kit push
    ```


### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to `http://localhost:3000`.

## Configuration

*   **Exercises:** Defined in `assets/exercises_config.json`. This file outlines the sequence of exercises, their properties, and goals.
*   **Pose Definitions:** Specific joint landmarks and target angles for ROM calculations are configured in `assets/pose_config.json`.
*   **Remote Control** Key mappings for the remote can be configured in `assets/remote_config.json`.
