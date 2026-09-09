import { useEffect, useRef, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import VideoPanel from "./components/VideoPanel";
import ArticleView from "./components/ArticleView";
import ProductView from "./components/ProductView";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";

// const API_URL = "http://127.0.0.1:8000";
const API_URL = "https://pagemind-backend.onrender.com";

const MIN_QA_HEIGHT = 25;
const MAX_QA_HEIGHT = 65;
const DEFAULT_QA_HEIGHT = 40;
const HEADER_HEIGHT = 52;

function errorMessage(data, fallback) {
  return data?.detail || data?.error || fallback;
}

function getSavedQaHeight() {
  const saved = Number(
    localStorage.getItem("pagemind-qa-height")
  );

  if (!Number.isFinite(saved)) {
    return DEFAULT_QA_HEIGHT;
  }

  return Math.min(
    MAX_QA_HEIGHT,
    Math.max(MIN_QA_HEIGHT, saved)
  );
}

function App() {
  const [page, setPage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [tabId, setTabId] = useState(null);

  const [status, setStatus] = useState(
    "Reading this page…"
  );

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [showingSummary, setShowingSummary] =
    useState(false);

  const [qaHeight, setQaHeight] = useState(
    getSavedQaHeight
  );

  const messageRefs = useRef({});
  const isDragging = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initializePage() {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });

        if (
          !tab?.id ||
          !tab.url ||
          !/^https?:/.test(tab.url)
        ) {
          throw new Error(
            "This page cannot be analyzed."
          );
        }

        setTabId(tab.id);

        let extracted;

        try {
          extracted = await chrome.tabs.sendMessage(
            tab.id,
            {
              type: "GET_PAGE_DATA"
            }
          );
        } catch (error) {
          console.error(
            "PageMind content script connection failed:",
            error
          );

          throw new Error(
            "PageMind could not access this page. Reload the page and try again."
          );
        }

        if (!extracted?.data) {
          throw new Error(
            "Could not read this page."
          );
        }

        setStatus(
          "Preparing your page assistant…"
        );

        const response = await fetch(
          `${API_URL}/extract`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              pageType: extracted.pageType,
              url: tab.url,
              title:
                extracted.data.title ||
                tab.title ||
                "Untitled page",
              content:
                extracted.data.content || "",
              videoId:
                extracted.data.videoId || null,
              product:
                extracted.pageType === "product"
                  ? extracted.data
                  : null
            })
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            errorMessage(
              result,
              "Could not analyze this page."
            )
          );
        }

        if (cancelled) {
          return;
        }

        setPage(result);
        setSessionId(result.sessionId);

        setStatus(
          result.cached
            ? "Ready · saved analysis"
            : "Ready"
        );
      } catch (error) {
        if (!cancelled) {
          setStatus(
            error?.message ||
            "Could not connect to the backend."
          );
        }
      }
    }

    initializePage();

    return () => {
      cancelled = true;
    };
  }, []);

  async function askQuestion(
    submittedQuestion = question
  ) {
    const userQuestion =
      submittedQuestion.trim();

    if (!userQuestion || !sessionId) {
      return;
    }

    setQuestion("");

    setMessages(previous => [
      ...previous,
      {
        role: "user",
        content: userQuestion
      },
      {
        role: "assistant",
        content: "Thinking…"
      }
    ]);

    try {
      const response = await fetch(
        `${API_URL}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            session_id: sessionId,
            question: userQuestion
          })
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      const content = response.ok
        ? result?.answer ||
        "I could not generate an answer."
        : `Error: ${errorMessage(
          result,
          "Failed to generate an answer."
        )}`;

      setMessages(previous => [
        ...previous.slice(0, -1),
        {
          role: "assistant",
          content
        }
      ]);
    } catch (error) {
      console.error(
        "Ask request failed:",
        error
      );

      setMessages(previous => [
        ...previous.slice(0, -1),
        {
          role: "assistant",
          content:
            "Could not connect to the backend."
        }
      ]);
    }
  }

  function showSummary() {
    if (
      !page?.summary ||
      showingSummary
    ) {
      return;
    }

    setMessages(previous => [
      ...previous,
      {
        role: "user",
        content: "Summarize this page"
      },
      {
        role: "assistant",
        content: page.summary
      }
    ]);

    setShowingSummary(true);
  }

  function startResize(event) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    isDragging.current = true;

    document.body.style.cursor =
      "row-resize";

    document.body.style.userSelect =
      "none";

    window.addEventListener(
      "pointermove",
      handleResize
    );

    window.addEventListener(
      "pointerup",
      stopResize
    );

    window.addEventListener(
      "pointercancel",
      stopResize
    );
  }

  function handleResize(event) {
    if (!isDragging.current) {
      return;
    }

    const app =
      document.querySelector(".app");

    if (!app) {
      return;
    }

    const rect =
      app.getBoundingClientRect();

    const usableHeight =
      rect.height - HEADER_HEIGHT;

    if (usableHeight <= 0) {
      return;
    }

    const distanceFromBottom =
      rect.bottom - event.clientY;

    let nextQaHeight =
      (distanceFromBottom /
        usableHeight) *
      100;

    nextQaHeight = Math.min(
      MAX_QA_HEIGHT,
      Math.max(
        MIN_QA_HEIGHT,
        nextQaHeight
      )
    );

    setQaHeight(nextQaHeight);

    localStorage.setItem(
      "pagemind-qa-height",
      String(nextQaHeight)
    );
  }

  function stopResize() {
    if (!isDragging.current) {
      return;
    }

    isDragging.current = false;

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    window.removeEventListener(
      "pointermove",
      handleResize
    );

    window.removeEventListener(
      "pointerup",
      stopResize
    );

    window.removeEventListener(
      "pointercancel",
      stopResize
    );
  }

  function handleResizeKeyDown(event) {
    const STEP = 5;

    if (
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }

    event.preventDefault();

    setQaHeight(current => {
      const next =
        event.key === "ArrowUp"
          ? Math.min(
            MAX_QA_HEIGHT,
            current + STEP
          )
          : Math.max(
            MIN_QA_HEIGHT,
            current - STEP
          );

      localStorage.setItem(
        "pagemind-qa-height",
        String(next)
      );

      return next;
    });
  }

  const isError =
    /could not|cannot|failed|error/i.test(
      status
    );

  const ready = Boolean(
    page && sessionId
  );

  const suggestions =
    page?.pageType === "product"
      ? [
        "What colors are available?",
        "What is the price?"
      ]
      : page?.pageType === "video"
        ? [
          "What is this video about?",
          "What are the key points?",
          "What should I remember?"
        ]
        : [
          "What is the main idea?",
          "What are the key points?",
          "What should I know?"
        ];

  return (
    <div className="app">
      <Header
        videoLoaded={ready}
        isError={isError}
        pageType={page?.pageType}
      />

      <main className="content-area">
        {page?.pageType === "video" && (
          <VideoPanel
            videoTitle={page.title}
            status={status}
            isError={isError}
            onSummarize={showSummary}
            summarizing={false}
            hasSummary={showingSummary}
            summarizeDisabled={!ready}
          />
        )}

        {page?.pageType === "article" && (
          <ArticleView result={page} />
        )}

        {page?.pageType === "product" && (
          <ProductView result={page} />
        )}

        {page?.pageType === "generic" && (
          <section className="page-overview">
            <div className="overview-header">
              <span className="overview-label">
                Page summary
              </span>
            </div>

            <strong
              className="overview-title"
              title={page.title}
            >
              {page.title}
            </strong>

            {page.summary && (
              <p className="overview-summary">
                {page.summary}
              </p>
            )}
          </section>
        )}

        {!page && (
          <div className="status-text">
            <p
              className={
                isError
                  ? "status-text-error"
                  : ""
              }
            >
              {status}
            </p>
          </div>
        )}
      </main>

      {ready && (
        <>
          <div
            className="splitter"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize page content and Q&A"
            aria-valuemin={MIN_QA_HEIGHT}
            aria-valuemax={MAX_QA_HEIGHT}
            aria-valuenow={Math.round(
              qaHeight
            )}
            tabIndex={0}
            onPointerDown={startResize}
            onKeyDown={handleResizeKeyDown}
          >
            <span
              className="splitter-grip"
              aria-hidden="true"
            />
          </div>

          <section
            className="qa-section"
            style={{
              flex: `0 0 ${qaHeight}%`
            }}
          >
            <ChatWindow
              messages={messages}
              messageRefs={messageRefs}
              youtubeTabId={
                page.pageType === "video"
                  ? tabId
                  : null
              }
              pageType={page.pageType}
              suggestions={suggestions}
              onSuggestion={askQuestion}
            />

            <ChatInput
              question={question}
              setQuestion={setQuestion}
              onSend={askQuestion}
              disabled={!ready}
              pageType={page.pageType}
            />
          </section>
        </>
      )}
    </div>
  );
}

export default App;