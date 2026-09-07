function VideoPanel({
  videoTitle,
  status,
  isError,
  onSummarize,
  summarizing,
  hasSummary,
  summarizeDisabled
}) {
  const label = summarizing
    ? "Summarizing…"
    : hasSummary
      ? "View summary"
      : "Summarize";

  return (
    <section className="video-panel">
      <div className="video-meta">
        <span className="video-label">
          Watching
        </span>

        <span
          className="video-indicator"
          aria-hidden="true"
        />
      </div>

      <div
        className="video-title"
        title={
          videoTitle || undefined
        }
      >
        {videoTitle ||
          "Detecting video…"}
      </div>

      <div className="video-footer">
        <div
          className={`video-status ${isError
              ? "video-status-error"
              : ""
            }`}
        >
          {status}
        </div>

        <button
          type="button"
          className="summarize-btn"
          onClick={onSummarize}
          disabled={summarizeDisabled}
        >
          {label}

          <span aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </section>
  );
}

export default VideoPanel;