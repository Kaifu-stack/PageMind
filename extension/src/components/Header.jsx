import logo from "../assets/logo.svg";

function Header({
  videoLoaded,
  isError,
  pageType
}) {
  const label = pageType
    ? `${pageType} assistant`
    : "AI page assistant";

  const statusClass = isError
    ? "status-dot-error"
    : videoLoaded
      ? "status-dot-ready"
      : "";

  const statusLabel = isError
    ? "Connection error"
    : videoLoaded
      ? "Ready"
      : "Preparing";

  return (
    <header className="header">
      <div className="brand">
        <img
          src={logo}
          alt="PageMind"
          className="brand-logo"
        />

        <div className="brand-text">
          <h1>PageMind</h1>
          <span>{label}</span>
        </div>
      </div>

      <div
        className="header-status"
        title={statusLabel}
        aria-label={statusLabel}
      >
        <span
          className={`status-dot ${statusClass}`}
        />
      </div>
    </header>
  );
}

export default Header;