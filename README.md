# OutSkill AI — ChatGPT Clone MVP

OutSkill AI is a production-ready, highly polished, full-stack ChatGPT-inspired AI assistant MVP. It is designed to help students, developers, and learners explain, write, and debug code beautifully.

## 🚀 Key Features

-   **ChatGPT-Style Interface**: Generous layouts, spacious padding, smooth input animations, and bento-box sample prompt grids.
-   **Dark Theme Toggle**: Native dark-mode first design with immediate toggle transitions.
-   **Conversation Workspace**: Create, delete, rename, and clear multi-chat sessions seamlessly.
-   **LocalStorage Persistence**: All chats and configuration preferences are auto-persisted on the client side.
-   **Advanced Markdown & Code Block Renderers**: High-quality styling for bold, lists, quotes, tables, and links. Integrates a custom syntax-highlighted code block with line indicators and one-click copy logic.
-   **Hybrid Dual-Core Backend API**:
    1. Connects to any standard **OpenAI-Compatible API** when `OPENAI_API_KEY` is provided.
    2. Gracefully falls back to the Google **Gemini API** via the native `@google/genai` SDK when `GEMINI_API_KEY` is supplied, guaranteeing immediate local running out of the box in the AI Studio workspace.
-   **Interactive Controls**: Support for request termination (Stop Generation), error recovery banners, and a "Regenerate Last Response" retry stream.

---

## 🛠️ Project Structure

```bash
├── server.ts               # Express.js Full-Stack Backend & Vite integration
├── metadata.json           # Applet configurations
├── package.json            # Scripts & Applet dependencies
├── index.html              # Frontend DOM mount
├── .env.example            # Environment configurations reference
└── src/
    ├── main.tsx            # React application renderer
    ├── App.tsx             # State provider wrapping top view
    ├── types.ts            # Core TypeScript interfaces definitions
    ├── index.css           # Global typography & scrollbar styles
    ├── context/
    │   └── ChatContext.tsx # React Context State Manager (localStorage, Axios proxy)
    └── components/
        ├── Sidebar.tsx     # Branding, New Chat CTA, & bottom quick-actions
        ├── ChatHistory.tsx # Recent sessions list with inline double-click renaming
        ├── Navbar.tsx      # Responsive mobile banner & sidebar toggles
        ├── ChatWindow.tsx  # Interactive greeting bento cards & scrollable conversation stream
        ├── ChatMessage.tsx # Message cards displaying sender info, avatars, & markdown
        ├── MessageInput.tsx# Auto-expanding textarea with key handlers and send/cancel binds
        ├── MarkdownRenderer.tsx # Render markdown elements to customized Tailwind layouts
        ├── CodeBlock.tsx   # Custom syntax highlighting box with Copy-Code action
        ├── ThemeToggle.tsx # Dual Sun-Moon rotating animation
        ├── LoadingSpinner.svg # Bouncing spin loader
        ├── TypingIndicator.tsx # Custom Framer Motion bouncy chat dots loader
        ├── Modal.tsx       # Blurred backdrop confirmation cards
        └── Toast.tsx       # Notification overlays for error captures
```

---

## ⚙️ Environment Variables

The application reads from `.env`. Declare the following configurations to direct your completion pipeline:

```env
# Port allocation for Express
PORT=3000

# OPTION A: OpenAI or OpenAI-Compatible credentials
OPENAI_API_KEY="your_api_key_here"
OPENAI_BASE_URL="https://api.openai.com/v1"
MODEL_NAME="gpt-4o"

# OPTION B: Google Gemini fallback (Automatically configured in Google AI Studio)
GEMINI_API_KEY="your_gemini_key_here"
```

---

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
To boot the full-stack server (Vite + Express in proxy middleware mode) on port `3000`:
```bash
npm run dev
```

### 3. Build for Production
To bundle the frontend assets and compile the TypeScript backend server into a single CJS bundle file inside `dist/`:
```bash
npm run build
```

### 4. Run Production Build
```bash
npm run start
```
