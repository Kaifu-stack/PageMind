export default function ArticleView({
    result
}) {
    if (!result) return null;

    return (
        <section className="page-overview">
            <div className="overview-header">
                <span className="overview-label">
                    Article summary
                </span>
            </div>

            <strong
                className="overview-title"
                title={result.title}
            >
                {result.title}
            </strong>

            {result.summary && (
                <p className="overview-summary">
                    {result.summary}
                </p>
            )}

            {result.keyPoints?.length > 0 && (
                <div className="overview-points">
                    <span className="overview-points-label">
                        Key points
                    </span>

                    <ul>
                        {result.keyPoints.map(
                            (point, index) => (
                                <li
                                    key={`${point}-${index}`}
                                >
                                    {point}
                                </li>
                            )
                        )}
                    </ul>
                </div>
            )}
        </section>
    );
}