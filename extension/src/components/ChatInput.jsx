function ChatInput({
  question,
  setQuestion,
  onSend,
  disabled,
  pageType
}) {
  const placeholder = disabled
    ? "Preparing this page…"
    : `Ask about this ${pageType || "page"
    }…`;

  const canSend =
    !disabled &&
    question.trim().length > 0;

  return (
    <form
      className="input-area"
      onSubmit={event => {
        event.preventDefault();

        if (canSend) {
          onSend();
        }
      }}
    >
      <div className="input-shell">
        <input
          type="text"
          value={question}
          onChange={event =>
            setQuestion(event.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          aria-label={`Ask about this ${pageType || "page"
            }`}
          autoComplete="off"
          spellCheck="true"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send question"
          title="Send"
        >
          <span aria-hidden="true">
            ↑
          </span>
        </button>
      </div>
    </form>
  );
}

export default ChatInput;