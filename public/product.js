/* ───────────────────────────────────────
   product.js  —  car detail page
   ─────────────────────────────────────── */

var productContent = document.getElementById("productContent");

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getCarWaleUrl(car) {
  if (car.carWaleUrl) return car.carWaleUrl;
  return "https://www.carwale.com/search?q=" + encodeURIComponent(car.brand + " " + car.model);
}

/* Offers — car.offers can be an array of objects OR a string (old data). Normalise it. */
function renderOfferCards(car) {
  var offers = [];

  if (Array.isArray(car.offers) && car.offers.length && typeof car.offers[0] === "object") {
    offers = car.offers;
  } else {
    // Fallback: build two default offers
    offers = [
      { platform: "Official Website", price: car.price, url: car.buyUrl || "#" },
      { platform: "CarWale",          price: car.price, url: getCarWaleUrl(car) }
    ];
  }

  return offers.map(function (o) {
    return '<div class="offer-card">' +
      '<div class="offer-card-header">' +
        '<span class="offer-platform">' + (o.platform || "Partner") + "</span>" +
        '<span class="offer-price">'    + (o.price    || car.price) + "</span>" +
      "</div>" +
      '<a class="btn btn-primary btn-offer" href="' + (o.url || "#") + '" target="_blank" rel="noopener noreferrer">' +
        "Buy on " + (o.platform || "Partner") +
      "</a>" +
    "</div>";
  }).join("");
}

function createDetailView(car, ratings) {
  var isElectric = car.fuelType === "Electric";
  var rangeLine  = isElectric ? "Range: " + (car.range || "N/A") : "Mileage: " + (car.mileage || "N/A");
  var chargeLine = isElectric && car.chargingTime
    ? '<div class="spec-item"><strong>Charging:</strong> ' + car.chargingTime + "</div>"
    : "";
  var tankLine   = isElectric
    ? "<p><strong>Battery:</strong> " + (car.batteryCapacity || "N/A") + "</p>"
    : "<p><strong>Fuel Tank:</strong> " + (car.fuelTankCapacity || "N/A") + "</p>";

  var carRatings = ratings.filter(function (r) { return Number(r.carId) === Number(car.id); });
  var avg = carRatings.length
    ? (carRatings.reduce(function (s, i) { return s + i.score; }, 0) / carRatings.length).toFixed(1)
    : car.rating;

  var reviewList = carRatings.length
    ? carRatings.map(function (item) {
        var filled = "\u2605".repeat(item.score);
        var empty  = "\u2606".repeat(5 - item.score);
        return '<div class="review-item">' +
          "<strong>" + filled + empty + "</strong>" +
          "<p>" + (item.comment || "No comment provided.") + "</p>" +
        "</div>";
      }).join("")
    : '<p class="review-empty">No ratings yet. Be the first to rate this car.</p>';

  var highlights = Array.isArray(car.highlights) ? car.highlights : [];

  return '<section class="product-main">' +
    '<div class="product-image">' +
      '<img src="' + car.imageUrl + '" alt="' + car.brand + " " + car.model + '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
    "</div>" +
    '<div class="product-summary">' +
      "<div>" +
        '<p class="eyebrow">' + car.brand + "</p>" +
        "<h2>" + car.brand + " " + car.model + "</h2>" +
        "<p>" + (car.description || "") + "</p>" +
        (highlights.length ? '<ul class="product-highlights">' + highlights.map(function(h){ return "<li>" + h + "</li>"; }).join("") + "</ul>" : "") +
      "</div>" +
      '<div class="product-meta">' +
        "<div>" +
          "<p><strong>Price:</strong> "     + car.price          + "</p>" +
          "<p><strong>" + rangeLine + "</strong></p>" +
          "<p><strong>Engine:</strong> "    + (car.cc || "N/A")   + "</p>" +
          tankLine +
          "<p><strong>Seats:</strong> "     + (car.seats || "N/A") + "</p>" +
          "<p><strong>Fuel:</strong> "      + car.fuelType        + "</p>" +
        "</div>" +
        '<div class="detail-specs">' +
          '<div class="spec-item"><strong>Transmission:</strong> ' + (car.transmission || "N/A") + "</div>" +
          '<div class="spec-item"><strong>Rating:</strong> '       + car.rating + " / 5</div>" +
          chargeLine +
        "</div>" +
      "</div>" +
      "<div>" +
        "<h3>Pricing &amp; Offers</h3>" +
        '<div class="offer-grid">' + renderOfferCards(car) + "</div>" +
      "</div>" +
      '<div class="rating-panel">' +
        "<h3>Rate this car</h3>" +
        '<div class="star-rating" data-car-id="' + car.id + '">' +
          '<button class="star-btn" data-score="1">\u2605</button>' +
          '<button class="star-btn" data-score="2">\u2605</button>' +
          '<button class="star-btn" data-score="3">\u2605</button>' +
          '<button class="star-btn" data-score="4">\u2605</button>' +
          '<button class="star-btn" data-score="5">\u2605</button>' +
        "</div>" +
        '<textarea id="ratingComment" rows="3" placeholder="Share your experience\u2026"></textarea>' +
        '<button id="submitRating" class="btn btn-secondary">Submit Rating</button>' +
        '<p id="ratingStatus" class="contact-status"></p>' +
      "</div>" +
      '<div class="rating-summary">' +
        "<h3>Customer Ratings</h3>" +
        "<p><strong>" + avg + " / 5</strong> based on " + carRatings.length + " review" + (carRatings.length === 1 ? "" : "s") + "</p>" +
        '<div class="review-list">' + reviewList + "</div>" +
      "</div>" +
    "</div>" +
  "</section>";
}

/* ── Horizontal Recommendation Carousel ── */
function createRecommendationGrid(currentCar, allCars) {
  var others = allCars.filter(function (c) { return String(c.id) !== String(currentCar.id); });
  var same   = others.filter(function (c) { return c.segment === currentCar.segment || c.brand === currentCar.brand; });
  var diff   = others.filter(function (c) { return c.segment !== currentCar.segment && c.brand !== currentCar.brand; });
  var picks  = same.slice(0, 4).concat(diff).slice(0, 10);
  if (!picks.length) return "";

  var cards = picks.map(function (c, i) {
    var metaLine = c.fuelType === "Electric"
      ? "Range: " + (c.range || "N/A")
      : "Mileage: " + (c.mileage || "N/A");
    var isSim = c.segment === currentCar.segment || c.brand === currentCar.brand;
    var badge = isSim
      ? '<span class="rec-badge rec-badge--same">Similar</span>'
      : '<span class="rec-badge rec-badge--diff">Explore</span>';

    return '<div class="rec-card" data-car-id="' + c.id + '" data-delay="' + (i * 70) + '" tabindex="0" role="button" aria-label="View ' + c.brand + " " + c.model + '">' +
      '<div class="rec-img-wrap">' +
        '<img src="' + c.imageUrl + '" alt="' + c.brand + " " + c.model + '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" loading="lazy" />' +
        badge +
      "</div>" +
      '<div class="rec-body">' +
        '<p class="rec-brand">' + c.brand + "</p>" +
        '<h4 class="rec-name">' + c.brand + " " + c.model + "</h4>" +
        '<div class="rec-specs">' +
          '<span class="rec-spec">' + c.fuelType + "</span>" +
          '<span class="rec-spec">' + (c.seats || "N/A") + " Seats</span>" +
          '<span class="rec-spec">' + metaLine + "</span>" +
          '<span class="rec-spec">\u2605 ' + c.rating + "</span>" +
        "</div>" +
        '<div class="rec-footer">' +
          '<span class="rec-price">' + c.price + "</span>" +
          '<span class="rec-arrow">View \u2192</span>' +
        "</div>" +
      "</div>" +
    "</div>";
  }).join("");

  return '<section class="rec-section">' +
    '<div class="rec-header">' +
      '<div class="rec-title-row">' +
        "<div>" +
          '<p class="rec-eyebrow">You might also like</p>' +
          '<h3 class="rec-title">Recommended Cars</h3>' +
        "</div>" +
        '<div class="rec-nav">' +
          '<button class="rec-btn rec-prev" id="recPrev" aria-label="Scroll left">&#8592;</button>' +
          '<button class="rec-btn rec-next" id="recNext" aria-label="Scroll right">&#8594;</button>' +
        "</div>" +
      "</div>" +
    "</div>" +
    '<div class="rec-track-wrap">' +
      '<div class="rec-track" id="recTrack">' + cards + "</div>" +
    "</div>" +
  "</section>";
}

function bindRecommendationEvents() {
  var track   = document.getElementById("recTrack");
  var prevBtn = document.getElementById("recPrev");
  var nextBtn = document.getElementById("recNext");
  if (!track) return;

  // Staggered card reveal
  track.querySelectorAll(".rec-card").forEach(function (card) {
    var delay = parseInt(card.getAttribute("data-delay")) || 0;
    setTimeout(function () { card.classList.add("rec-visible"); }, delay);
  });

  function scrollAmount() {
    var card = track.querySelector(".rec-card");
    return card ? card.offsetWidth + 16 : 280;
  }

  if (prevBtn) prevBtn.addEventListener("click", function () {
    track.scrollBy({ left: -scrollAmount() * 2, behavior: "smooth" });
  });
  if (nextBtn) nextBtn.addEventListener("click", function () {
    track.scrollBy({ left: scrollAmount() * 2, behavior: "smooth" });
  });

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  track.addEventListener("scroll", updateArrows, { passive: true });
  updateArrows();

  track.addEventListener("click",   navigateToRecommendation);
  track.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigateToRecommendation(e); }
  });
}

function navigateToRecommendation(e) {
  var card = e.target.closest("[data-car-id]");
  if (!card) return;
  var id   = card.getAttribute("data-car-id");
  var main = document.querySelector("main");
  if (main) {
    main.style.transition = "opacity 0.32s ease, transform 0.32s ease";
    main.style.opacity    = "0";
    main.style.transform  = "translateY(12px)";
  }
  setTimeout(function () { window.location.href = "product.html?id=" + id; }, 340);
}

/* ── Load product ── */
async function loadProduct() {
  var id = getQueryParam("id");
  if (!id) {
    productContent.innerHTML = '<p class="empty-state">No car selected. <a href="index.html">Browse cars</a></p>';
    return;
  }
  try {
    var results = await Promise.all([fetch("/api/cars"), fetch("/api/ratings")]);
    var cars    = await results[0].json();
    var ratings = await results[1].json();
    var car     = cars.find(function (c) { return String(c.id) === id; });
    if (!car) {
      productContent.innerHTML = '<p class="empty-state">Car not found. <a href="index.html">Browse all cars</a></p>';
      return;
    }
    productContent.innerHTML = createDetailView(car, ratings) + createRecommendationGrid(car, cars);
    bindRatingEvents(car.id);
    bindRecommendationEvents();
  } catch (err) {
    productContent.innerHTML = '<p class="empty-state">Unable to load car details. Please try again.</p>';
    console.error(err);
  }
}

/* ── Rating events ── */
function bindRatingEvents(carId) {
  var stars     = Array.from(document.querySelectorAll(".star-btn"));
  var submitBtn = document.getElementById("submitRating");
  var commentBox = document.getElementById("ratingComment");
  var statusEl  = document.getElementById("ratingStatus");
  var selected  = 0;

  stars.forEach(function (star) {
    star.addEventListener("click", function () {
      selected = Number(star.dataset.score);
      stars.forEach(function (s) { s.classList.remove("active"); });
      stars.slice(0, selected).forEach(function (s) { s.classList.add("active"); });
    });
  });

  if (submitBtn) submitBtn.addEventListener("click", async function () {
    if (!selected) {
      statusEl.textContent = "Please choose a star rating.";
      statusEl.style.color = "#dc2626";
      return;
    }
    statusEl.textContent = "Submitting\u2026";
    statusEl.style.color = "var(--text)";
    try {
      var res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: carId, score: selected, comment: commentBox.value })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      statusEl.textContent = "Thank you! Your rating has been added.";
      statusEl.style.color = "#16a34a";
      commentBox.value = ""; selected = 0;
      stars.forEach(function (s) { s.classList.remove("active"); });
      loadProduct();
    } catch (err) {
      statusEl.textContent = "Unable to save your rating.";
      statusEl.style.color = "#dc2626";
    }
  });
}

loadProduct();
