const API_URL =
  "https://script.google.com/macros/s/AKfycby0uePApOFx_D06Yb9tnIq0Xj15Q5iXz_Tg7WB6OHCVIaVIiJ-HaC_PtS-CXubF02ChrA/exec";

const APP_CONFIG = Object.freeze({
  initialStatements: 6,
  statementsPerPage: 6,
  initialReviews: 10,
  reviewsPerPage: 10,
  requestTimeoutMs: 15000
});

const appState = {
  reviews: [],
  visibleStatements: APP_CONFIG.initialStatements,
  visibleReviews: APP_CONFIG.initialReviews
};

const HEADERS = {
  rating: "Overall Professional Rating",

  publicReview: "Public Review",

  oneSentence:
    "If you had one sentence to describe this individual to another employer, what would you say?",

  publicName: "Public Reviewer Name",
  publicTitle: "Public Reviewer Title",
  publicCompany: "Public Reviewer Company",

  fullName: "Full Name",
  title: "Title",
  company: "Company",

  relationship:
    "What best describes your professional relationship with this individual? (select one)",

  relationshipLength:
    "Length of relationship (select one)",

  qualities:
    "Which three professional qualities best describe this individual?",

  collaborationAreas:
    "Which areas did you work with this individual on? (select all that apply)"
};

function handleReviewData(data) {
  const statusMessage =
    document.getElementById("status-message");

  if (!data || data.success !== true) {
    if (statusMessage) {
      statusMessage.textContent =
        "Unable to load reviews.";
    }

    return;
  }

  const reviews = Array.isArray(data.reviews)
    ? data.reviews.filter(review => review && typeof review === "object")
    : [];

  appState.reviews = reviews;

  renderProfile(data.profile || {});
  renderSummary(data);
  renderTopQualities(reviews);
  renderCollaborationAreas(reviews);
  renderStatements(reviews);
  renderReviews(reviews);

  if (statusMessage) {
    statusMessage.textContent =
      reviews.length > 0
        ? ""
        : "No approved reviews yet.";
  }
}

function renderProfile(profile) {
  const nameElement =
    document.getElementById("profile-name");

  const headlineElement =
    document.getElementById("profile-headline");

  const bioElement =
    document.getElementById("profile-bio");

  const headshotElement =
    document.getElementById("profile-headshot");

  if (nameElement) {
    nameElement.textContent =
      profile.fullName ||
      "Professional Profile";
  }

  if (headlineElement) {
    headlineElement.textContent =
      profile.headline || "";

    headlineElement.hidden =
      !profile.headline;
  }

  if (bioElement) {
    bioElement.textContent =
      profile.bio || "";

    bioElement.hidden =
      !profile.bio;
  }

  if (headshotElement) {
    const headshotUrl = getSafeHttpUrl(
      String(profile.headshotUrl || "").trim()
    );

    if (headshotUrl) {
      headshotElement.src = headshotUrl;

      headshotElement.alt =
        profile.fullName
          ? `${profile.fullName} professional headshot`
          : "Professional headshot";

      headshotElement.hidden = false;

      headshotElement.onerror = function () {
        console.error(
          "The headshot URL could not be loaded:",
          headshotUrl
        );

        headshotElement.hidden = true;
      };
    } else {
      headshotElement.hidden = true;
    }
  }

  configureProfileLink(
    "linkedin-link",
    profile.linkedinUrl
  );

  configureProfileLink(
    "website-link",
    profile.websiteUrl
  );

  configureProfileLink(
    "bragbook-link",
    profile.bragbookUrl
  );
}

function configureProfileLink(elementId, url) {
  const link =
    document.getElementById(elementId);

  if (!link) {
    return;
  }

  const cleanUrl =
    String(url || "").trim();

  const safeUrl = getSafeHttpUrl(cleanUrl);

  if (!safeUrl) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }

  link.href = safeUrl;
  link.hidden = false;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function renderSummary(data) {
  const ratingElement =
    document.getElementById(
      "average-rating"
    );

  const starsElement =
    document.getElementById(
      "average-stars"
    );

  const countElement =
    document.getElementById(
      "review-count"
    );

  const averageRating =
    Number(data.averageRating) || 0;

  const reviewCount =
    Number(data.reviewCount) || 0;

  if (ratingElement) {
    ratingElement.textContent =
      formatRating(averageRating);
  }

  if (starsElement) {
    starsElement.textContent =
      createStars(averageRating);

    starsElement.setAttribute(
      "aria-label",
      `${formatRating(
        averageRating
      )} out of 5 stars`
    );
  }

  if (countElement) {
    countElement.textContent =
      `${reviewCount} approved review${
        reviewCount === 1 ? "" : "s"
      }`;
  }
}

function renderTopQualities(reviews) {
  const counts =
    countSelections(
      reviews,
      HEADERS.qualities
    );

  const topFive =
    sortCounts(counts).slice(0, 5);

  renderBarChart(
    "qualities-chart",
    topFive,
    "No professional qualities are available yet."
  );
}

function renderCollaborationAreas(reviews) {
  const counts = {};

  reviews.forEach(review => {
    const exactValue = getValue(
      review,
      HEADERS.collaborationAreas
    );

    const matchingHeader =
      Object.keys(review).find(key =>
        key
          .toLowerCase()
          .includes(
            "which areas did you work with this individual"
          )
      );

    const rawValue =
      exactValue ||
      (
        matchingHeader
          ? String(
              review[matchingHeader] || ""
            ).trim()
          : ""
      );

    if (!rawValue) {
      return;
    }

    splitSelections(rawValue)
      .forEach(item => {
        counts[item] =
          (counts[item] || 0) + 1;
      });
  });

  const topAreas =
    sortCounts(counts).slice(0, 8);

  renderBarChart(
    "collaboration-chart",
    topAreas,
    "No collaboration areas are available yet."
  );
}

function renderStatements(reviews) {
  const container =
    document.getElementById(
      "statements-container"
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const statements = reviews
    .map(review => ({
      text: getValue(
        review,
        HEADERS.oneSentence,
        HEADERS.publicReview
      ),

      name: getReviewerName(review)
    }))
    .filter(statement => statement.text);

  if (!statements.length) {
    renderEmptyMessage(
      container,
      "No statements are available yet."
    );

    return;
  }

  const visibleStatements = statements.slice(
    0,
    appState.visibleStatements
  );
  const fragment = document.createDocumentFragment();

  visibleStatements.forEach(statement => {
    const card =
      document.createElement("article");

    card.className = "statement-card";

    const quote =
      document.createElement(
        "blockquote"
      );

    quote.textContent =
      `“${statement.text}”`;

    const attribution =
      document.createElement("p");

    attribution.className =
      "statement-attribution";

    attribution.textContent =
      `— ${statement.name}`;

    card.appendChild(quote);
    card.appendChild(attribution);

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  updateLoadMoreButton(
    "load-more-statements",
    visibleStatements.length,
    statements.length
  );
}

function renderReviews(reviews) {
  const container =
    document.getElementById(
      "reviews-container"
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const visibleReviews = reviews.slice(
    0,
    appState.visibleReviews
  );
  const fragment = document.createDocumentFragment();

  visibleReviews.forEach(review => {
    const card =
      document.createElement("article");

    card.className = "review-card";

    const rating = clampRating(
      review[HEADERS.rating]
    );

    const reviewText = getValue(
      review,
      HEADERS.publicReview,
      HEADERS.oneSentence
    );

    const reviewerName =
      getReviewerName(review);

    const reviewerTitle = getValue(
      review,
      HEADERS.publicTitle,
      HEADERS.title
    );

    const reviewerCompany = getValue(
      review,
      HEADERS.publicCompany,
      HEADERS.company
    );

    const relationship = getValue(
      review,
      HEADERS.relationship
    );

    const relationshipLength =
      getValue(
        review,
        HEADERS.relationshipLength
      );

    const stars =
      document.createElement("p");

    stars.className = "review-stars";
    stars.textContent =
      createStars(rating);

    const quote =
      document.createElement(
        "blockquote"
      );

    quote.className = "review-quote";
    quote.textContent =
      `“${reviewText}”`;

    const name =
      document.createElement("p");

    name.className = "reviewer-name";
    name.textContent = reviewerName;

    const details =
      document.createElement("p");

    details.className =
      "reviewer-details";

    details.textContent = [
      reviewerTitle,
      reviewerCompany
    ]
      .filter(Boolean)
      .join(" • ");

    const metadata =
      document.createElement("div");

    metadata.className =
      "review-metadata";

    if (relationship) {
      metadata.appendChild(
        createMetadataChip(
          relationship
        )
      );
    }

    if (relationshipLength) {
      metadata.appendChild(
        createMetadataChip(
          relationshipLength
        )
      );
    }

    card.appendChild(stars);

    if (reviewText) {
      card.appendChild(quote);
    }

    card.appendChild(name);

    if (details.textContent) {
      card.appendChild(details);
    }

    if (metadata.children.length) {
      card.appendChild(metadata);
    }

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  updateLoadMoreButton(
    "load-more-reviews",
    visibleReviews.length,
    reviews.length
  );
}

function countSelections(
  reviews,
  headerName
) {
  const counts = {};

  reviews.forEach(review => {
    const rawValue = getValue(
      review,
      headerName
    );

    if (!rawValue) {
      return;
    }

    splitSelections(rawValue)
      .forEach(item => {
        counts[item] =
          (counts[item] || 0) + 1;
      });
  });

  return counts;
}

function splitSelections(rawValue) {
  return String(rawValue)
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function sortCounts(counts) {
  return Object.entries(counts)
    .sort((first, second) => {
      const countDifference =
        second[1] - first[1];

      if (countDifference !== 0) {
        return countDifference;
      }

      return first[0].localeCompare(
        second[0]
      );
    });
}

function renderBarChart(
  containerId,
  entries,
  emptyMessage
) {
  const container =
    document.getElementById(
      containerId
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!entries.length) {
    renderEmptyMessage(
      container,
      emptyMessage
    );

    return;
  }

  const maximumValue = Math.max(
    ...entries.map(entry => entry[1])
  );

  entries.forEach(
    ([label, count]) => {
      const item =
        document.createElement("div");

      item.className =
        "bar-chart-item";

      const heading =
        document.createElement("div");

      heading.className =
        "bar-chart-heading";

      const labelElement =
        document.createElement("span");

      labelElement.className =
        "bar-chart-label";

      labelElement.textContent = label;

      const countElement =
        document.createElement("span");

      countElement.className =
        "bar-chart-count";

      countElement.textContent =
        `${count} reviewer${
          count === 1 ? "" : "s"
        }`;

      const track =
        document.createElement("div");

      track.className =
        "bar-chart-track";

      const bar =
        document.createElement("div");

      bar.className =
        "bar-chart-bar";

      const percentage =
        maximumValue > 0
          ? (
              count /
              maximumValue
            ) * 100
          : 0;

      bar.style.width =
        `${percentage}%`;

      heading.appendChild(
        labelElement
      );

      heading.appendChild(
        countElement
      );

      track.appendChild(bar);

      item.appendChild(heading);
      item.appendChild(track);

      container.appendChild(item);
    }
  );
}

function createMetadataChip(text) {
  const chip =
    document.createElement("span");

  chip.className = "metadata-chip";
  chip.textContent = text;

  return chip;
}

function getReviewerName(review) {
  return (
    getValue(
      review,
      HEADERS.publicName,
      HEADERS.fullName
    ) || "Anonymous"
  );
}

function getValue(
  review,
  ...headerNames
) {
  for (
    const headerName of headerNames
  ) {
    const value = String(
      review[headerName] || ""
    ).trim();

    const normalized =
      value.toLowerCase();

    if (
      value &&
      normalized !== "yes" &&
      normalized !== "no"
    ) {
      return value;
    }
  }

  return "";
}

function clampRating(value) {
  const rating =
    Math.round(
      Number(value) || 0
    );

  return Math.max(
    0,
    Math.min(5, rating)
  );
}

function createStars(value) {
  const rating =
    clampRating(value);

  return (
    "★".repeat(rating) +
    "☆".repeat(5 - rating)
  );
}

function formatRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return "0";
  }

  return Number.isInteger(rating)
    ? String(rating)
    : rating.toFixed(2);
}

function renderEmptyMessage(
  container,
  message
) {
  const element =
    document.createElement("p");

  element.className =
    "empty-message";

  element.textContent = message;

  container.appendChild(element);
}

function getSafeHttpUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch (error) {
    return "";
  }
}

function updateLoadMoreButton(id, visibleCount, totalCount) {
  const button = document.getElementById(id);
  if (!button) {
    return;
  }

  const remaining = Math.max(0, totalCount - visibleCount);
  button.hidden = remaining === 0;
  button.textContent = remaining > 0
    ? `Show more (${remaining} remaining)`
    : "Show more";
}

function showMoreStatements() {
  appState.visibleStatements += APP_CONFIG.statementsPerPage;
  renderStatements(appState.reviews);
}

function showMoreReviews() {
  appState.visibleReviews += APP_CONFIG.reviewsPerPage;
  renderReviews(appState.reviews);
}

function loadReviews() {
  const script =
    document.createElement("script");

  script.src =
    `${API_URL}` +
    `?callback=handleReviewData` +
    `&timestamp=${Date.now()}`;

  script.onerror = function () {
    window.clearTimeout(timeoutId);
    script.remove();

    const statusMessage =
      document.getElementById(
        "status-message"
      );

    if (statusMessage) {
      statusMessage.textContent =
        "Unable to load reviews.";
    }
  };

  const timeoutId = window.setTimeout(() => {
    script.remove();
    const statusMessage = document.getElementById("status-message");
    if (statusMessage && statusMessage.textContent === "Loading reviews...") {
      statusMessage.textContent = "Reviews are taking longer than expected. Please refresh to try again.";
    }
  }, APP_CONFIG.requestTimeoutMs);

  script.addEventListener("load", () => {
    window.clearTimeout(timeoutId);
    script.remove();
  });

  document.body.appendChild(script);
}

document
  .getElementById("load-more-statements")
  ?.addEventListener("click", showMoreStatements);

document
  .getElementById("load-more-reviews")
  ?.addEventListener("click", showMoreReviews);

loadReviews();

