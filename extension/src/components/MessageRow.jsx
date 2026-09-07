import ReactMarkdown from "react-markdown";

function MessageRow({
  role,
  content,
  youtubeTabId,
  registerRef
}) {
  const isUser = role === "user";

  const isThinking =
    content === "Thinking…" ||
    content === "Thinking...";

  const isErrorMessage =
    content.startsWith("Error:") ||
    content ===
    "Could not connect to the backend.";

  async function openTimestamp(
    event,
    seconds
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!youtubeTabId) {
      console.error(
        "No YouTube tab ID"
      );
      return;
    }

    try {
      const response =
        await chrome.runtime.sendMessage(
          {
            type: "JUMP_TO_TIMESTAMP",
            tabId: youtubeTabId,
            seconds: Number(seconds)
          }
        );

      if (!response?.success) {
        console.error(
          "Timestamp jump failed:",
          response?.error
        );
      }
    } catch (error) {
      console.error(
        "Background message failed:",
        error
      );
    }
  }

  const textClasses = [
    "message-text",
    isThinking
      ? "message-text-pending"
      : "",
    isErrorMessage
      ? "message-text-error"
      : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={`message-row ${isUser
        ? "message-row-user"
        : "message-row-assistant"
        }`}
      ref={registerRef}
    >
      <div
        className={`message-avatar ${isUser
          ? "message-avatar-user"
          : "message-avatar-assistant"
          }`}
        aria-hidden="true"
      >
        {isUser ? "Y" : "P"}
      </div>

      <div className="message-body">
        <div className="message-header">
          <span className="message-name">
            {isUser
              ? "You"
              : "PageMind"}
          </span>
        </div>

        <div className={textClasses}>
          {isUser ? (
            content
          ) : (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  if (href?.startsWith("#ts-")) {
                    const seconds = Number(href.replace("#ts-", ""));

                    return (
                      <button
                        type="button"
                        className="timestamp-link"
                        onClick={event => openTimestamp(event, seconds)}
                      >
                        {children}
                      </button>
                    );
                  }

                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </article>
  );
}

export default MessageRow;