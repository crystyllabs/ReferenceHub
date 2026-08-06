const API_URL =
  "https://script.google.com/macros/s/AKfycby0uePApOFx_D06Yb9tnIq0Xj15Q5iXz_Tg7WB6OHCVIaVIiJ-HaC_PtS-CXubF02ChrA/exec";

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

const RELATIONSHIP_LENGTH_ORDER = [
  "Less than 6 months",
  "6 months–1 year",
  "6 months - 1 year",
  "6 months to 1 year",
  "1–3 years",
  "1-3 years",
  "3–5 years",
  "3-5 years",
  "5–10 years",
  "5-10 years",
  "More than 10 years"
];

function handleReviewData(data) {
  const statusMessage =
    document.getElementById("status-message");

  if (!data || data.success !== true) {
    statusMessage.textContent =
      "Unable to load reviews.";

    return;
  }

  const reviews = Array.isArray(data.reviews)
    ? data.reviews
    : [];

  renderSummary(data);
  renderStatements(reviews);
  renderReviews(reviews);
  renderTopQualities(reviews);
  renderRelationshipLengths(reviews);
  renderCollaborationAreas(reviews);

  statusMessage.textContent =
    reviews.length > 0
      ? ""
      : "No approved reviews yet.";
}

function renderSummary(data) {
  const ratingElement =
    document.getElementById("average-rating");

  const reviewCountElement =
    document.getElementById("review-count");

  ratingElement.textContent =
    formatRating(data.averageRating);

  const reviewCount =
    Number(data.reviewCount) || 0;

  reviewCountElement.textContent =
    `${reviewCount} approved review${
      reviewCount === 1 ? "" : "s"
    }`;
}

function renderStatements(reviews) {
  const container =
    document.getElementById("statements-container");

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

  if (statements.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent =
      "No featured statements are available yet.";

    container.appendChild(message);
    return;
  }

  statements.forEach(statement => {
    const card = document.createElement("article");
    card.className = "statement-card";

    const quote = document.createElement("blockquote");
    quote.textContent = `“${statement.text}”`;

    const attribution = document.createElement("p");
    attribution.className = "statement-attribution";
    attribution.textContent = `— ${statement.name}`;

    card.appendChild(quote);
    card.appendChild(attribution);

    container.appendChild(card);
  });
}

function renderReviews(reviews) {
  const container =
    document.getElementById("reviews-container");

  container.replaceChildren();

  reviews.forEach(review => {
    const card = document.createElement("article");
    card.className = "review-card";

    const rating =
      clampRating(review[HEADERS.rating]);

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

    const stars = document.createElement("p");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(rating) +
      "☆".repeat(5 - rating);

    const quote = document.createElement("blockquote");
    quote.className = "review-quote";
    quote.textContent = `“${reviewText}”`;

    const name = document.createElement("p");
    name.className = "reviewer-name";
    name.textContent = reviewerName;

    const details = document.createElement("p");
    details.className = "reviewer-details";
    details.textContent = [
      reviewerTitle,
      reviewerCompany
    ]
      .filter(Boolean)
      .join(" • ");

    const relationshipElement =
      document.createElement("p");

    relationshipElement.className =
      "reviewer-relationship";

    relationshipElement.textContent =
      relationship
        ? `Professional relationship: ${relationship}`
        : "";

    card.appendChild(stars);

    if (reviewText) {
      card.appendChild(quote);
    }

    card.appendChild(name);

    if (details.textContent) {
      card.appendChild(details);
    }

    if (relationshipElement.textContent) {
      card.appendChild(relationshipElement);
    }

    container.appendChild(card);
  });
}

function renderTopQualities(reviews) {
  const counts = countSelections(
    reviews,
    HEADERS.qualities
  );

  const topFive = sortCounts(counts)
    .slice(0, 5);

  renderBarChart(
    "qualities-chart",
    topFive,
    "No professional qualities are available yet."
  );
}

function renderRelationshipLengths(reviews) {
  const counts = {};

  reviews.forEach(review => {
    const value = getValue(
      review,
      HEADERS.relationshipLength
    );

    if (!value) return;

    counts[value] = (counts[value] || 0) + 1;
  });

  const knownOrder = [
    "Less than 6 months",
    "6 months–1 year",
    "6 months - 1 year",
    "6 months to 1 year",
    "1–3 years",
    "1-3 years",
    "3–5 years",
    "3-5 years",
    "5–10 years",
    "5-10 years",
    "More than 10 years"
  ];

  const orderedResults = [];

  knownOrder.forEach(label => {
    if (counts[label]) {
      orderedResults.push([
        normalizeRelationshipLength(label),
        counts[label]
      ]);
    }
  });

  Object.entries(counts).forEach(
    ([label, count]) => {
      const normalized =
        normalizeRelationshipLength(label);

      const alreadyAdded =
        orderedResults.some(
          item => item[0] === normalized
        );

      if (!alreadyAdded) {
        orderedResults.push([
          normalized,
          count
        ]);
      }
    }
  );

  renderBarChart(
    "relationship-length-chart",
    orderedResults,
    "No relationship-length information is available yet."
  );
}

function renderCollaborationAreas(reviews) {
  const counts = countSelections(
    reviews,
    HEADERS.collaborationAreas
  );

  const sortedAreas = sortCounts(counts);

  renderBarChart(
    "collaboration-chart",
    sortedAreas,
    "No collaboration areas are available yet."
  );
}

function countSelections(reviews, headerName) {
  const counts = {};

  reviews.forEach(review => {
    const rawValue = getValue(
      review,
      headerName
    );

    if (!rawValue) return;

    rawValue
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => {
        counts[item] =
          (counts[item] || 0) + 1;
      });
  });

  return counts;
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
    document.getElementById(containerId);

  container.replaceChildren();

  if (!entries.length) {
    const message =
      document.createElement("p");

    message.className = "empty-message";
    message.textContent = emptyMessage;

    container.appendChild(message);
    return;
  }

  const maximumValue = Math.max(
    ...entries.map(entry => entry[1])
  );

  entries.forEach(([label, count]) => {
    const item = document.createElement("div");
    item.className = "bar-chart-item";

    const heading =
      document.createElement("div");

    heading.className = "bar-chart-heading";

    const labelElement =
      document.createElement("span");

    labelElement.className = "bar-chart-label";
    labelElement.textContent = label;

    const countElement =
      document.createElement("span");

    countElement.className = "bar-chart-count";
    countElement.textContent =
      `${count} reviewer${count === 1 ? "" : "s"}`;

    heading.appendChild(labelElement);
    heading.appendChild(countElement);

    const track = document.createElement("div");
    track.className = "bar-chart-track";

    const bar = document.createElement("div");
    bar.className = "bar-chart-bar";

    const percentage =
      maximumValue > 0
        ? (count / maximumValue) * 100
        : 0;

    bar.style.width = `${percentage}%`;

    track.appendChild(bar);
    item.appendChild(heading);
    item.appendChild(track);

    container.appendChild(item);
  });
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

function getValue(review, ...headerNames) {
  for (const headerName of headerNames) {
    const value = String(
      review[headerName] || ""
    ).trim();

    if (
      value &&
      value.toLowerCase() !== "yes" &&
      value.toLowerCase() !== "no"
    ) {
      return value;
    }
  }

  return "";
}

function clampRating(value) {
  const rating = Math.round(
    Number(value) || 0
  );

  return Math.max(
    0,
    Math.min(5, rating)
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

function normalizeRelationshipLength(value) {
  const normalized = String(value)
    .replace("6 months - 1 year", "6 months–1 year")
    .replace("6 months to 1 year", "6 months–1 year")
    .replace("1-3 years", "1–3 years")
    .replace("3-5 years", "3–5 years")
    .replace("5-10 years", "5–10 years");

  return normalized;
}

function loadReviews() {
  const script =
    document.createElement("script");

  script.src =
    `${API_URL}` +
    `?callback=handleReviewData` +
    `&timestamp=${Date.now()}`;

  script.onerror = function () {
    document
      .getElementById("status-message")
      .textContent =
        "Unable to load reviews.";
  };

  document.body.appendChild(script);
}

loadReviews();
