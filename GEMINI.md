# Project Overview

This project, "Whisper," is a voice-first AI pair programming tool. It allows developers to interact with an AI assistant using natural language, and the AI has real-time access to the local codebase. The project is a monorepo managed with Turborepo and pnpm workspaces.

The architecture consists of three main components:

1.  **`apps/watcher`**: A Node.js client that monitors the local filesystem for changes and syncs them to the backend.
2.  **`apps/backend`**: A Cloudflare Workers application that manages sessions, processes file updates, and interacts with the AI model. It uses Durable Objects for session management and KV storage for token management.
3.  **`apps/web`**: A React-based web application that provides the user interface for voice interaction with the AI.

The `packages` directory contains shared code, including TypeScript types (`packages/shared`), ESLint configurations (`packages/eslint-config`), and UI components (`packages/ui`).

# Building and Running

The following commands are used to build, run, and test the project:

*   **Install dependencies:**
    ```bash
    pnpm install
    ```

*   **Run the development server:**
    ```bash
    pnpm dev
    ```

*   **Build all packages and apps:**
    ```bash
    pnpm build
    ```

*   **Run linting:**
    ```bash
    pnpm lint
    ```

*   **Run type checking:**
    ```bash
    pnpm check-types
    ```

# Development Conventions

*   **Monorepo:** The project uses a monorepo structure managed by Turborepo.
*   **Package Manager:** The project uses pnpm for package management.
*   **TypeScript:** The entire codebase is written in TypeScript.
*   **Linting and Formatting:** The project uses ESLint for linting and Prettier for code formatting.
*   **Shared Code:** Shared code is organized into packages in the `packages` directory.
*   **Cloudflare Workers:** The backend is built with Cloudflare Workers, and the configuration is in the `apps/backend/wrangler.jsonc` file.
