import { Readability } from "@mozilla/readability";

const MAX_CONTENT_LENGTH = 24_000;

function normaliseText(value, limit = MAX_CONTENT_LENGTH) {
    return (value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function isProductType(value) {
    const values = Array.isArray(value) ? value : [value];
    return values.some(item => String(item || "").toLowerCase() === "product");
}

function flattenJsonLd(value, results = []) {
    if (!value || typeof value !== "object") return results;
    if (Array.isArray(value)) {
        value.forEach(item => flattenJsonLd(item, results));
        return results;
    }
    results.push(value);
    if (value["@graph"]) flattenJsonLd(value["@graph"], results);
    return results;
}

function getJsonLdProducts() {
    const products = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
            flattenJsonLd(JSON.parse(script.textContent)).forEach(item => {
                if (isProductType(item["@type"])) products.push(item);
            });
        } catch {
            // Pages often contain partial or malformed JSON-LD; ignore only that block.
        }
    });
    return products;
}

function getMeta(name) {
    return document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content?.trim() || "";
}

function asTextList(value) {
    if (Array.isArray(value)) return value.flatMap(asTextList);
    if (value === null || value === undefined) return [];
    const text = normaliseText(String(value), 200);
    return text ? [text] : [];
}

function getProductProperty(product, names) {
    const properties = Array.isArray(product?.additionalProperty)
        ? product.additionalProperty
        : [product?.additionalProperty].filter(Boolean);
    const found = properties.find(item => names.includes(String(item?.name || "").toLowerCase()));
    return found?.value || "";
}

function getYouTubeVideoId() {
    const url = new URL(location.href);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (!/(^|\.)youtube\.com$/.test(url.hostname)) return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
    return null;
}

function detectPageType() {
    if (getYouTubeVideoId()) return "video";

    const ogType = getMeta("og:type").toLowerCase();
    if (getJsonLdProducts().length || ogType === "product") return "product";

    const hasPrice = document.querySelector('[itemprop="price"], [class*="price" i], [data-testid*="price" i]');
    const hasPurchaseAction = document.querySelector('[class*="add-to-cart" i], [class*="buy-now" i], button[name*="add" i]');
    if (hasPrice && hasPurchaseAction) return "product";

    if (document.querySelector("article") || ogType === "article") return "article";

    return "generic";
}

// Mark elements the browser is actually rendering as hidden (display:none
// or visibility:hidden), so tab panels, accordions, and duplicate
// language-tab code samples don't get counted as visible article text.
// Must run on the LIVE document — a detached clone always reports
// default (visible) computed styles regardless of the page's CSS.
function markHiddenElements(root) {
    const hidden = [];
    root.querySelectorAll("*").forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") {
            el.setAttribute("data-pagemind-hidden", "1");
            hidden.push(el);
        }
    });
    return hidden;
}

function extractArticle() {
    const markedElements = markHiddenElements(document.body);

    const clone = document.cloneNode(true);
    clone.querySelectorAll("pre, code").forEach(el => el.remove());
    clone.querySelectorAll('[data-pagemind-hidden="1"]').forEach(el => el.remove());

    // Immediately clean up the temporary markers — nothing about the
    // user's actual page should change.
    markedElements.forEach(el => el.removeAttribute("data-pagemind-hidden"));

    const article = new Readability(clone).parse();
    if (!article?.textContent) return extractGeneric();
    return {
        title: article.title || document.title,
        byline: article.byline || "",
        content: normaliseText(article.textContent)
    };
}

function extractProduct() {
    const product = getJsonLdProducts()[0];
    const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
    const name = product?.name || getMeta("og:title") || document.querySelector("h1")?.textContent || document.title;
    const price = offer?.price || document.querySelector('[itemprop="price"]')?.getAttribute("content") || "";
    const currency = offer?.priceCurrency || document.querySelector('[itemprop="priceCurrency"]')?.getAttribute("content") || "";
    const description = product?.description || getMeta("og:description") || "";
    const rating = product?.aggregateRating?.ratingValue || "";
    const reviewCount = product?.aggregateRating?.reviewCount || "";
    const color = product?.color || getProductProperty(product, ["color", "colour"]);
    const sizes = asTextList(product?.size || getProductProperty(product, ["size", "sizes"]));
    const visibleDetails = normaliseText(document.querySelector("main")?.innerText || document.body.innerText, 8_000);

    return {
        title: normaliseText(name, 300),
        name: normaliseText(name, 300),
        price: String(price || ""),
        currency: normaliseText(currency, 16),
        rating: String(rating || ""),
        reviewCount: String(reviewCount || ""),
        color: normaliseText(String(color || ""), 100),
        sizes,
        content: normaliseText([`Product: ${name}`, `Price: ${price} ${currency}`, `Color: ${color}`, `Sizes: ${sizes.join(", ")}`, `Description: ${description}`, `Rating: ${rating}`, visibleDetails].filter(Boolean).join("\n"))
    };
}

function extractGeneric() {
    const root = document.querySelector("main, [role='main'], article") || document.body;
    return {
        title: getMeta("og:title") || document.title,
        content: normaliseText(root?.innerText)
    };
}

function extractPageData() {
    const pageType = detectPageType();
    if (pageType === "video") {
        return { pageType, data: { title: document.title.replace(/\s*-\s*YouTube$/, ""), videoId: getYouTubeVideoId() } };
    }
    if (pageType === "article") return { pageType, data: extractArticle() };
    if (pageType === "product") return { pageType, data: extractProduct() };
    return { pageType, data: extractGeneric() };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_DATA") sendResponse(extractPageData());
});