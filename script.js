const API_URL =
  "https://script.google.com/macros/s/AKfycby0uePApOFx_D06Yb9tnIq0Xj15Q5iXz_Tg7WB6OHCVIaVIiJ-HaC_PtS-CXubF02ChrA/exec";

function handleReviewData(data) {
  const statusMessage = document.getElementById("status-message");
  const reviewsContainer = document.getElementById("reviews-container");

  document.getElementById("average-rating").textContent =
    data.averageRating;

  document.getElementById("review-count").textContent =
    `${data.reviewCount} approved review${data.reviewCount === 1 ? "" : "s"}`;

  reviewsContainer.innerHTML = "";

  data.reviews.forEach(review => {
    const card = document.createElement("div");
    card.className = "review-card";

    const reviewText =
      review["Public Review"] ||
      review["Professional Recommendation"] ||
      "";

    card.textContent = reviewText;

    reviewsContainer.appendChild(card);
  });

  statusMessage.textContent =
    data.reviewCount > 0 ? "" : "No approved reviews yet.";
}

function loadReviews() {
  const script = document.createElement("script");
  script.src = `${API_URL}?callback=handleReviewData`;
  script.onerror = function () {
    document.getElementById("status-message").textContent =
      "Unable to load reviews.";
  };

  document.body.appendChild(script);
}

loadReviews();
