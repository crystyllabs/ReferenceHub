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

  const rating =
    parseInt(review["Overall Professional Rating"], 10) || 0;

  const stars = document.createElement("p");
  stars.textContent =
    "★".repeat(Math.min(rating, 5)) +
    "☆".repeat(Math.max(5 - rating, 0));

  const quote = document.createElement("p");
  quote.textContent = `"${reviewText}"`;

  const name = document.createElement("strong");
  name.textContent = reviewerName;

  const details = document.createElement("p");
  details.textContent = [reviewerTitle, reviewerCompany]
    .filter(Boolean)
    .join(" • ");

  card.appendChild(stars);
  card.appendChild(quote);
  card.appendChild(name);

  if (details.textContent) {
    card.appendChild(details);
  }

  reviewsContainer.appendChild(card);
});
