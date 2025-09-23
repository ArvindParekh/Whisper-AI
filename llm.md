# Project Brief: AI Co-Pilot on Call

**Version:** 1.0  
**Status:** Let's Build This Thing.

---

## 1. The Vision: A True Pair Programmer

We are not building a chatbot. We are building an **ambient, voice-first AI pair programmer** that a developer can get on a live call with.

The user experience should feel like talking to a senior engineer. The AI has full, real-time context of the user's local codebase, allows for natural conversation, helps reason through complex problems from first principles, and can even be tasked with proactively going off and performing tasks like creating GitHub issues from `TODO` comments.

This project is a technical demonstration of a next-generation developer tool, built entirely on a modern, serverless stack.

---

## 2. Core User Experience (The "Magic" Loop)

1. **Onboarding:** The user navigates to our web app. The page generates a unique Session ID and displays a single `npx` command for them to run.  
2. **Context Sync:** The user runs the command in their local project's terminal. A lightweight "watcher" script starts, silently syncing any file changes to our backend in real-time. This is the agent's "eyes."  
3. **The Call:** The user clicks "Start Call" on the web app. The microphone activates, and a voice-to-voice connection is established with the AI agent. This is the "ears and mouth."  
4. **The Conversation:** The user codes in their local IDE (VS Code, Cursor, etc.). They can speak naturally to the AI:
   - *"Hey, can you walk me through the database connection logic in `src/db.ts`?"*
   - *"I'm getting a weird error here, let's think about this from first principles. What are the possible points of failure?"*
   - *"Okay, I've added a few TODOs. Can you scan the project and create GitHub issues for them?"*
5. **Proactive Assistance:** The AI doesn't just respond. It can perform actions on the user's behalf, leveraging the full context of their codebase.

---

## 3. System Architecture

The system is composed of three main parts: the local client (the eyes), the web frontend (the voice), and the Cloudflare backend (the brain).

```mermaid
graph TD
    subgraph User's Machine
        A[Local File System] -- File Save --> B[Node.js Watcher Script];
        C[Browser Mic/Speakers];
    end

    subgraph Cloudflare Backend
        D[Ingestion Worker];
        E[Durable Object: Session State];
        F[AI Worker: Llama 3.3];
        G[Workflow: Agentic Tasks];
        H[Realtime/WebSocket Server];
    end

    subgraph Web Frontend (Cloudflare Pages)
        I[UI & Voice Controls];
    end

    B -- HTTPS POST w/ SessionID + File Content --> D;
    D -- Updates Code State --> E;

    C <--> I;
    I <-->|WebSocket w/ SessionID| H;
    H <--> E;

    E -- Gets Latest Code --> F;
    E -- Triggers --> G;

    F -- Generates Response --> E;
    G -- e.g., GitHub API --> J[External: GitHub];
```

### Component Breakdown

- **Local Client (The Watcher):** A minimal Node.js script. Its only job is to watch for file changes in a directory and push the updated file content to a specific Cloudflare Worker endpoint, along with the Session ID.  
- **Web Frontend (Cloudflare Pages):** A simple React/Vite application. It handles the Web Speech API for voice recognition/synthesis and manages the WebSocket connection for real-time communication.  
- **Cloudflare Realtime:** Manages the persistent WebSocket connection between the frontend and the backend for low-latency voice chat.  
- **Ingestion Worker:** A simple Worker with an HTTP endpoint that receives file updates from the local watcher and passes them to the correct Durable Object.  
- **Durable Object (The Brain's Memory):** The core of the system. Each session gets its own Durable Object, identified by the Session ID. It is responsible for:
  - Storing the current state of all files in the user's project.
  - Holding the conversation history.
  - Orchestrating calls to the AI Worker and Workflows.  
- **AI Worker (The Brain's Reasoning):** Receives a prompt (e.g., a user question + code context) from the Durable Object, calls the Llama 3.3 model via Workers AI, and returns the generated text response.  
- **Cloudflare Workflows (The Agent's Hands):** Used for reliable, multi-step asynchronous tasks like the `TODO`-to-Issue pipeline. This ensures that even if one step fails, the process can be retried.

---

## 4. Recommended Tech Stack (No Reinventing Wheels)

- **Frontend:**
  - **Framework:** React (with Vite) — Fast, modern, and the industry standard.
  - **Styling:** Tailwind CSS — For rapid, utility-first UI development.
  - **Voice:** `react-speech-kit` or similar library to provide simple hooks for the browser's Web Speech API.
- **Local Watcher Script:**
  - **Runtime:** Node.js
  - **File Watching:** `chokidar` — The most robust and widely-used file watching library.
  - **Distribution:** `npx` — Allows users to run the script with a single command without a global install.
- **Backend:**
  - **Platform:** Cloudflare Workers, Durable Objects, Workflows, Realtime
  - **Language:** TypeScript
  - **CLI:** `wrangler`
- **External APIs:**
  - **GitHub:** Use the official `@octokit/rest` library for interacting with the GitHub API to create issues.

---

## 5. The `TODO`-to-Issue Agentic Workflow (Deep Dive)

This is the key proactive feature.

1. **Trigger:** The user says, "Scan for TODOs." This is sent to the Durable Object.  
2. **Initiate:** The Durable Object triggers a **Cloudflare Workflow**, passing in the full code context it holds.  
3. **Step 1: Parse Files:** The first step in the workflow iterates through the files and uses a regex (`/\/\/\s*TODO:/`) to find all `TODO` comments.  
4. **Step 2: Generate Issues (Parallel):** The workflow maps over the found `TODO`s. For each one, it calls the **AI Worker** in parallel with a prompt:

```text
You are a task management AI. Based on the following code comment and its surrounding context, generate a concise and descriptive GitHub issue title and a well-formatted body. Respond ONLY with a JSON object:

{ "title": "...", "body": "..." }.

Context:
[...code snippet...]
```

5. **Step 3: Post to GitHub:** The final step takes the generated JSON from the AI and uses the `@octokit/rest` library to create the issue in the user's specified repository.

---

## 6. Hackathon Plan: MVP & Stretch Goals

### Minimum Viable Product (The "Must-Have" for the Demo)
1. **Full Voice Loop:** User can talk to the AI, and it talks back.  
2. **Basic Context Sync:** The local watcher script successfully syncs at least *one* file's content to the Durable Object. The AI uses this file for context in its answers.  
3. **Session Management:** The Session ID system works, connecting the watcher and the web frontend to the same Durable Object.

### Stretch Goals (If you're crushing it)
1. **Multi-File Context:** The watcher syncs the *entire* project directory. The AI can be prompted to consider the whole codebase when answering.  
2. **The `TODO`-to-Issue Agent:** Implement the full workflow. This is the biggest "wow" factor.  
3. **Conversation History:** Display the transcript of the conversation on the webpage.  
4. **More Agentic Tasks:** Add more voice commands, like "Write a unit test for this function" or "Add JSDoc comments to this file."

---
