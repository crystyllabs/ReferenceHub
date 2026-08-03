const API_URL =
  "https://script.google.com/macros/s/AKfycby0uePApOFx_D06Yb9tnIq0Xj15Q5iXz_Tg7WB6OHCVIaVIiJ-HaC_PtS-CXubF02ChrA/exec";

function handleReviewData(data) {
  const statusMessage = document.getElementById("status-message");
  const reviewsContainer = document.getElementById("reviews-container");

  // Rating
  document.getElementById("average-rating").textContent =
    data.averageRating;

  // Review Count
  document.getElementById("review-count").textContent =
    `${data.reviewCount} approved review${data.reviewCount === 1 ? "" : "s"}`;

  // Clear existing reviews
  reviewsContainer.innerHTML = "";

  // Create review cards
  data.reviews.forEach(review => {

    const card = document.createElement("div");
    card.className = "review-card";

    const rating =
      parseInt(review["Overall Professional Rating"]) || 0;

    const stars =
      "★".repeat(rating) + "☆".repeat(5 - rating);

    const reviewText =
      review["Public Review"] ||
      review["Professional Recommendation"] ||
      "";

    const reviewerName =
      review["Public Reviewer Name"] ||
      review["Full Name"] ||
      "Anonymous";

    const reviewerTitle =
      review["Public Reviewer Title"] ||
      review["Title"] ||
      "";

    const reviewerCompany =
      review["Public Reviewer Company"] ||
      review["Company"] ||
      "";

    card.innerHTML = `
      <div style="font-size:22px;margin-bottom:10px;">
        ${stars}
      </div>

      <p style="font-size:18px;font-style:italic;">
        "${reviewText}"
      </p>

      <strong>${reviewerName}</strong>

      <div style="color:#666;margin-top:4px;">
        ${reviewerTitle}${reviewerTitle && reviewerCompany ? " • " : ""}${reviewerCompany}
      </div>
    `;

    reviewsContainer.appendChild(card);

  });

  if (data.reviewCount === 0) {
    statusMessage.textContent = "No approved reviews yet.";
  } else {
    statusMessage.textContent = "";
  }
}

function loadReviews() {

  const script = document.createElement("script");

  script.src =
    API_URL +
    "?callback=handleReviewData&t=" +
    new Date().getTime();

  script.onerror = function () {
    document.getElementById("status-message").textContent =
      "Unable to load reviews.";
  };

  document.body.appendChild(script);

}

loadReviews();
