import MessageRow from "./MessageRow";

function ChatWindow({
  messages,
  messageRefs,
  youtubeTabId,
  pageType,
  suggestions,
  onSuggestion
}) {
  if (messages.length === 0) {
    return (
      <div className="empty">
        <div className="empty-content">
          <h2>Ask PageMind</h2>

          <p>
            Understand this{" "}
            {pageType || "page"} faster with
            focused answers and useful insights.
          </p>

          {suggestions?.length > 0 && (
            <div className="quick-questions">
              <span className="quick-questions-label">
                Try asking
              </span>

              <div className="quick-questions-list">
                {suggestions.map(question => (
                  <button
                    key={question}
                    type="button"
                    className="suggestion-chip"
                    onClick={() =>
                      onSuggestion(question)
                    }
                  >
                    <span>{question}</span>

                    <span
                      className="suggestion-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat">
      {messages.map((message, index) => (
        <MessageRow
          key={`${message.role}-${index}`}
          role={message.role}
          content={message.content}
          youtubeTabId={youtubeTabId}
          registerRef={el => {
            if (messageRefs) {
              messageRefs.current[index] =
                el;
            }
          }}
        />
      ))}
    </div>
  );
}

export default ChatWindow;