# PageMind

**An AI browser extension that understands whatever page you're on.**

Chat with YouTube videos, get instant summaries of articles and educational content, or ask questions about product pages while you shop — all from one popup that auto-detects what kind of page you're looking at.

## Features

- 🎥 **Video mode** — Loads a YouTube video's transcript, answers questions with clickable timestamp citations that jump you straight to the relevant moment, and generates a full video summary on demand.
- 📄 **Article mode** — Extracts the actual article content using Mozilla's Readability (stripping navigation, ads, and embedded code samples) and answers questions grounded only in that page — no hallucinated outside knowledge.
- 🛍️ **Product mode** — Pulls structured product data (price, rating, sizes, description) from JSON-LD or page markup and answers shopping questions directly from those facts.
- 🧠 **Automatic page-type detection** — No manual switching. The extension figures out whether you're on a video, article, or product page and adapts instantly.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, LangChain |
| LLM | Google Gemini (`langchain-google-genai`) |
| Retrieval | FAISS + HuggingFace sentence embeddings |
| Transcripts | `youtube-transcript-api` |
| Extension | React + Vite, Manifest V3 |
| Content extraction | Mozilla Readability.js, JSON-LD parsing |

## How it works

1. When the popup opens, it asks the active tab's content script what type of page it is — `video`, `article`, `product`, or `generic`.
2. **Video pages**: the transcript is fetched and chunked for retrieval-based Q&A with timestamp citations.
3. **Article/product pages**: Readability.js and JSON-LD parsing extract clean content directly in the browser, stripping hidden elements and embedded code so only real, visible content reaches the model.
4. The extracted content is sent to `/extract`, which generates a summary and opens a session for follow-up questions.
5. Follow-up questions go to `/ask` — video sessions always use retrieval (needed for timestamp citations); article and product sessions answer directly from the extracted content when it's short enough, falling back to retrieval only for longer pages.

## Project structure

.
├── backend/
│ ├── main.py # FastAPI app: /youtube, /ask, /summary, /extract
│ ├── requirements.txt
│ └── .env # GOOGLE_API_KEY (not committed)
└── extension/
├── src/
│ ├── App.jsx
│ ├── contentScript.js # page-type detection + content extraction
│ └── components/
│ ├── Header.jsx
│ ├── VideoPanel.jsx
│ ├── ArticleView.jsx
│ ├── ProductView.jsx
│ ├── ChatWindow.jsx
│ ├── MessageRow.jsx
│ └── ChatInput.jsx
└── public/
├── manifest.json
└── background.js


## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

GOOGLE_API_KEY=your_gemini_api_key_here


Run the server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be running at `http://127.0.0.1:8000`.

### Extension

```bash
cd extension
npm install
npm run build
```

Then load it into Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `extension/dist` folder
4. Open any YouTube video, article, or product page and click the PageMind icon

## Roadmap

- [ ] Deploy backend to a public host (currently points at `localhost` for local development)
- [ ] Add per-user rate limiting ahead of public release
- [ ] Publish to the Chrome Web Store
- [ ] Multi-tab comparison mode for research and shopping workflows

## License

All rights reserved. This code is publicly viewable for portfolio purposes, but no permission is granted to use, copy, modify, or distribute it without explicit permission from the author.