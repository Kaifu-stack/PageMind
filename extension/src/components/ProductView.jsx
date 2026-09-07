export default function ProductView({
    result
}) {
    if (!result) return null;

    const product =
        result.product || {};

    const price = [
        product.price,
        product.currency
    ]
        .filter(Boolean)
        .join(" ");

    const productTitle =
        product.name || result.title;

    return (
        <section className="page-overview">
            <div className="overview-header">
                <span className="overview-label">
                    Product overview
                </span>
            </div>

            <strong
                className="overview-title"
                title={productTitle}
            >
                {productTitle}
            </strong>

            {(price || product.rating) && (
                <div className="product-facts">
                    {price && (
                        <span className="product-fact">
                            {price}
                        </span>
                    )}

                    {product.rating && (
                        <span className="product-fact">
                            ★ {product.rating}
                            {product.reviewCount
                                ? ` · ${product.reviewCount} reviews`
                                : ""}
                        </span>
                    )}
                </div>
            )}

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