// app.js - CarBuy India

// THEME (run immediately)
(function () {
  var saved = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-theme", saved === "dark");
  var icon = document.querySelector(".theme-toggle-icon");
  if (icon) icon.textContent = saved === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
}());

// SERVICE WORKER (caching only - no install prompt)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").catch(function (err) {
      console.warn("SW registration failed:", err);
    });
  });
}

// THEME TOGGLE BUTTON
var themeToggleBtn = document.getElementById("themeToggleBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", function () {
    var isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    var icon = themeToggleBtn.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = isDark ? "\u2600\uFE0F" : "\uD83C\uDF19";
  });
}

// MOBILE MENU
// ── Scroll shadow ──
window.addEventListener("scroll", function () {
  var h = document.getElementById("siteHeader");
  if (h) h.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// ── Right Drawer ──
var mobileMenuBtn = document.getElementById("mobileMenuBtn");
var navDrawer     = document.getElementById("navDrawer");
var drawerBackdrop = document.getElementById("drawerBackdrop");
var legacyNavMenu = document.getElementById("navMenu");

function openDrawer() {
  if (!navDrawer) return;
  navDrawer.classList.add("is-open");
  navDrawer.setAttribute("aria-hidden", "false");
  if (drawerBackdrop) drawerBackdrop.classList.add("is-open");
  if (mobileMenuBtn) mobileMenuBtn.classList.add("is-open");
  if (mobileMenuBtn) {
    mobileMenuBtn.setAttribute("aria-expanded", "true");
    mobileMenuBtn.setAttribute("aria-label", "Close menu");
  }
  document.body.style.overflow = "hidden";
  var drawerCloseBtn = document.getElementById("drawerCloseBtn");
  if (drawerCloseBtn) drawerCloseBtn.focus();
}
function closeDrawer(restoreFocus) {
  if (!navDrawer) return;
  var wasOpen = navDrawer.classList.contains("is-open");
  navDrawer.classList.remove("is-open");
  navDrawer.setAttribute("aria-hidden", "true");
  if (drawerBackdrop) drawerBackdrop.classList.remove("is-open");
  if (mobileMenuBtn) mobileMenuBtn.classList.remove("is-open");
  if (mobileMenuBtn) {
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mobileMenuBtn.setAttribute("aria-label", "Open menu");
  }
  document.body.style.overflow = "";
  if (wasOpen && restoreFocus !== false && mobileMenuBtn) mobileMenuBtn.focus();
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  if (navDrawer && navDrawer.classList.contains("is-open")) closeDrawer();
  else if (navDrawer) openDrawer();
  else if (legacyNavMenu) {
    var isOpen = legacyNavMenu.classList.toggle("active");
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  }
});
if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);
var drawerCloseBtn = document.getElementById("drawerCloseBtn");
if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
if (navDrawer) {
  navDrawer.querySelectorAll(".drawer-lnk").forEach(function (l) {
    l.addEventListener("click", function () { closeDrawer(false); });
  });
}
if (legacyNavMenu) {
  legacyNavMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      legacyNavMenu.classList.remove("active");
      if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.setAttribute("aria-label", "Open menu");
      }
    });
  });
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDrawer();
    if (legacyNavMenu) legacyNavMenu.classList.remove("active");
    if (mobileMenuBtn && legacyNavMenu) {
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileMenuBtn.setAttribute("aria-label", "Open menu");
    }
    closeMobSearch();
  }
});

// ── Mobile search slide-down ──
var mobSearchToggle = document.getElementById("mobSearchToggle");
var mobSrchBar      = document.getElementById("mobSrchBar");
var mobSrchInput    = document.getElementById("mobileCarSearch");
var mobSrchClose    = document.getElementById("mobSrchClose");

function openMobSearch() {
  if (!mobSrchBar) return;
  mobSrchBar.classList.add("is-open");
  if (mobSearchToggle) mobSearchToggle.setAttribute("aria-expanded", "true");
  if (mobSrchInput) setTimeout(function () { mobSrchInput.focus(); }, 120);
}
function closeMobSearch() {
  if (!mobSrchBar) return;
  mobSrchBar.classList.remove("is-open");
  if (mobSearchToggle) mobSearchToggle.setAttribute("aria-expanded", "false");
  if (mobSrchInput) mobSrchInput.blur();
}

if (mobSearchToggle) mobSearchToggle.addEventListener("click", function () {
  if (mobSrchBar && mobSrchBar.classList.contains("is-open")) { closeMobSearch(); }
  else { openMobSearch(); }
});
if (mobSrchClose) mobSrchClose.addEventListener("click", closeMobSearch);

// Sync mobile search with desktop search input
document.addEventListener("DOMContentLoaded", function () {
  if (mobSrchInput && searchInput) {
    mobSrchInput.addEventListener("input", function () {
      searchInput.value = mobSrchInput.value;
      applyFilters();
    });
  }

  // Drawer admin button
  var drawerAdminBtn = document.getElementById("drawerAdminBtn");
  if (drawerAdminBtn) {
    drawerAdminBtn.addEventListener("click", function () {
      closeDrawer(false);
      if (window.carbuyOpenAuthModal) window.carbuyOpenAuthModal("admin");
    });
  }

  var drawerLoginBtn = document.getElementById("drawerLoginBtn");
  if (drawerLoginBtn) {
    drawerLoginBtn.addEventListener("click", function () {
      closeDrawer(false);
      if (window.carbuyOpenAuthModal) window.carbuyOpenAuthModal("login");
    });
  }

  var adminNavBtn = document.getElementById("adminNavBtn");
  if (adminNavBtn) {
    adminNavBtn.addEventListener("click", function () {
      if (window.carbuyOpenAuthModal) window.carbuyOpenAuthModal("admin");
    });
  }
});

// SEARCH TOGGLE
var searchToggleBtn = document.getElementById("searchToggleBtn");
var searchInput = document.getElementById("carSearch");
var initialSearch = new URLSearchParams(window.location.search).get("q");
if (searchInput && initialSearch) searchInput.value = initialSearch;
function initSearchToggle() {
  if (!searchToggleBtn || !searchInput) return;
  var sw = searchInput.closest(".nav-search");
  searchToggleBtn.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      sw && sw.classList.toggle("mobile-search-visible");
      searchInput.classList.toggle("mobile-search-active");
      if (sw && sw.classList.contains("mobile-search-visible")) {
        setTimeout(function () { searchInput.focus(); }, 100);
      }
    } else { searchInput.focus(); }
  });
  searchInput.addEventListener("blur", function () {
    if (window.innerWidth <= 768) {
      sw && sw.classList.remove("mobile-search-visible");
      searchInput.classList.remove("mobile-search-active");
    }
  });
}

// REVEAL ON SCROLL
var revealObserver = null;
function initRevealAnimations() {
  var elements = Array.from(document.querySelectorAll(".reveal-on-scroll"));
  if (!elements.length) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  }
  elements.forEach(function (el) {
    var delay = Number(el.dataset.delay || 0);
    el.style.transitionDelay = delay + "ms";
    if (el.classList.contains("reveal-initial")) {
      setTimeout(function () { el.classList.add("is-visible"); }, 180 + delay);
    } else { revealObserver.observe(el); }
  });
}

// USER PROFILE
var USER_KEY = "carbuy_user";
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } }
function saveUser(data) { localStorage.setItem(USER_KEY, JSON.stringify(data)); }
function clearUser() { localStorage.removeItem(USER_KEY); }

function showUserInNav(user) {
  var navUser    = document.getElementById("navUser");
  var loginBtn   = document.getElementById("openAuthModal");
  var avatarEl   = document.getElementById("navUserAvatar");
  var nameEl     = document.getElementById("navUserName");
  var dropAvatar = document.getElementById("dropdownAvatar");
  var dropName   = document.getElementById("dropdownUserName");
  var dropEmail  = document.getElementById("dropdownUserEmail");
  if (!navUser) return;
  var first = (user.fullName || user.name || "U").charAt(0).toUpperCase();
  var hue   = (user.email || "").split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0) % 360;
  navUser.style.display   = "flex";
  if (loginBtn) loginBtn.style.display = "none";
  if (avatarEl) { avatarEl.textContent = first; avatarEl.style.background = "hsl(" + hue + ",60%,46%)"; }
  if (nameEl)   nameEl.textContent = (user.fullName || user.name || "").split(" ")[0];
  if (dropAvatar){ dropAvatar.textContent = first; dropAvatar.style.background = "hsl(" + hue + ",60%,46%)"; }
  if (dropName)  dropName.textContent  = user.fullName || user.name || "";
  if (dropEmail) dropEmail.textContent = user.email || "";
}

function hideUserFromNav() {
  var navUser  = document.getElementById("navUser");
  var loginBtn = document.getElementById("openAuthModal");
  if (navUser)  navUser.style.display  = "none";
  if (loginBtn) loginBtn.style.display = "";
}

function initUserProfile() {
  var user = getUser();
  if (user) showUserInNav(user);

  var navUserBtn = document.getElementById("navUserBtn");
  var dropdown   = document.getElementById("navUserDropdown");
  if (navUserBtn && dropdown) {
    navUserBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });
    document.addEventListener("click", function () { dropdown.classList.remove("active"); });
    dropdown.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  var logoutBtn = document.getElementById("navLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      clearUser();
      hideUserFromNav();
      if (dropdown) dropdown.classList.remove("active");
      showToast("Signed out successfully.");
    });
  }

  var dropWishlist = document.getElementById("dropdownWishlist");
  if (dropWishlist) {
    dropWishlist.addEventListener("click", function () {
      if (dropdown) dropdown.classList.remove("active");
      openWishlistDrawer();
    });
  }
}

window.carbuyShowUser = function (user) {
  saveUser(user);
  showUserInNav(user);
};

// WISHLIST
var WL_KEY = "carbuy_wishlist";
function getWishlist() { try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch (e) { return []; } }
function saveWishlist(list) { localStorage.setItem(WL_KEY, JSON.stringify(list)); }
function isWishlisted(id) { return getWishlist().indexOf(String(id)) > -1; }

function toggleWishlist(id, allCars) {
  id = String(id);
  var list = getWishlist();
  var idx  = list.indexOf(id);
  if (idx > -1) { list.splice(idx, 1); } else { list.push(id); }
  saveWishlist(list);
  updateWishlistBadge();
  refreshHeartButtons();
  var backdrop = document.getElementById("wishlistBackdrop");
  if (backdrop && backdrop.classList.contains("active")) renderWishlistContent(allCars);
}

function updateWishlistBadge() {
  var badge = document.getElementById("wishlistBadge");
  var count = getWishlist().length;
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
  var btn = document.getElementById("wishlistNavBtn");
  if (btn) btn.classList.toggle("has-wishlist", count > 0);
}

function refreshHeartButtons() {
  document.querySelectorAll(".heart-btn").forEach(function (btn) {
    var on = isWishlisted(btn.dataset.id);
    btn.classList.toggle("heart-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = on ? "Remove from wishlist" : "Add to wishlist";
  });
}

function renderWishlistContent(allCars) {
  var content = document.getElementById("wishlistContent");
  if (!content) return;
  var list = getWishlist();
  if (!list.length) {
    content.innerHTML =
      '<div class="wl-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        "<p>Your wishlist is empty.</p>" +
        '<a href="#cars" class="btn btn-primary wl-browse-btn" id="wlBrowseBtn">Browse Cars</a>' +
      "</div>";
    var b = document.getElementById("wlBrowseBtn");
    if (b) b.addEventListener("click", closeWishlistDrawer);
    return;
  }
  var wlCars = list.map(function (id) {
    return (allCars || []).find(function (c) { return String(c.id) === id; });
  }).filter(Boolean);

  content.innerHTML = wlCars.map(function (car) {
    var mileage = car.fuelType === "Electric" ? (car.range || "N/A") + " range" : (car.mileage || "N/A");
    return '<div class="wl-card">' +
      '<img src="' + car.imageUrl + '" alt="' + car.brand + " " + car.model +
      '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
      '<div class="wl-info">' +
        '<p class="wl-brand">' + car.brand + "</p>" +
        '<h4 class="wl-name">' + car.brand + " " + car.model + "</h4>" +
        '<p class="wl-meta">' + car.price + " \u00B7 " + mileage + "</p>" +
      "</div>" +
      '<div class="wl-actions">' +
        '<a class="btn btn-primary wl-view-btn" href="product.html?id=' + car.id + '">View</a>' +
        '<button class="wl-remove-btn" data-id="' + car.id + '" aria-label="Remove">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>' +
        "</button>" +
      "</div>" +
    "</div>";
  }).join("");

  content.querySelectorAll(".wl-remove-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { toggleWishlist(btn.dataset.id, allCars); });
  });
}

function openWishlistDrawer() {
  var backdrop = document.getElementById("wishlistBackdrop");
  if (!backdrop) return;
  renderWishlistContent(window._allCars || []);
  backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeWishlistDrawer() {
  var backdrop = document.getElementById("wishlistBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function initWishlistDrawer() {
  var backdrop  = document.getElementById("wishlistBackdrop");
  var closeBtn  = document.getElementById("wishlistCloseBtn");
  var navWlBtn  = document.getElementById("wishlistNavBtn");
  if (backdrop) backdrop.addEventListener("click", function (e) { if (e.target === backdrop) closeWishlistDrawer(); });
  if (closeBtn) closeBtn.addEventListener("click", closeWishlistDrawer);
  if (navWlBtn) navWlBtn.addEventListener("click", openWishlistDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeWishlistDrawer(); });
  updateWishlistBadge();
}

// COMPARE FEATURE
var compareIds  = [];
var MAX_COMPARE = 3;
var compareBar  = null;

function initCompareBar() {
  compareBar = document.createElement("div");
  compareBar.id        = "compareBar";
  compareBar.className = "compare-bar";
  compareBar.innerHTML =
    '<div class="compare-bar-inner">' +
      '<div class="compare-bar-slots" id="compareSlots"></div>' +
      '<div class="compare-bar-actions">' +
        '<span class="compare-count" id="compareCount">0 / ' + MAX_COMPARE + ' selected</span>' +
        '<button class="btn btn-secondary compare-clear-btn" id="compareClearBtn">Clear</button>' +
        '<button class="btn btn-primary compare-go-btn" id="compareGoBtn" disabled>Compare Now</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(compareBar);
  document.getElementById("compareClearBtn").addEventListener("click", clearCompare);
  document.getElementById("compareGoBtn").addEventListener("click", function () {
    if (compareIds.length >= 2) window.location.href = "compare.html?ids=" + compareIds.join(",");
  });
}

function updateCompareBar(allCars) {
  if (!compareBar) return;
  var slots = document.getElementById("compareSlots");
  var count = document.getElementById("compareCount");
  var goBtn = document.getElementById("compareGoBtn");
  compareBar.classList.toggle("compare-bar-visible", compareIds.length > 0);
  if (count) count.textContent = compareIds.length + " / " + MAX_COMPARE + " selected";
  if (goBtn) goBtn.disabled = compareIds.length < 2;
  if (!slots) return;
  slots.innerHTML = compareIds.map(function (id) {
    var car = (allCars || []).find(function (c) { return String(c.id) === id; });
    if (!car) return "";
    return '<div class="compare-slot"><img src="' + car.imageUrl +
      '" alt="" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
      '<span class="compare-slot-name">' + car.brand + " " + car.model + "</span>" +
      '<button class="compare-slot-remove" data-id="' + car.id + '" aria-label="Remove">&times;</button></div>';
  }).join("");
  slots.querySelectorAll(".compare-slot-remove").forEach(function (btn) {
    btn.addEventListener("click", function () { toggleCompare(btn.dataset.id, allCars); });
  });
}

function toggleCompare(id, allCars) {
  var idx = compareIds.indexOf(id);
  if (idx > -1) { compareIds.splice(idx, 1); }
  else {
    if (compareIds.length >= MAX_COMPARE) { showToast("Max " + MAX_COMPARE + " cars can be compared."); return; }
    compareIds.push(id);
  }
  refreshCompareButtons();
  updateCompareBar(allCars);
}

function refreshCompareButtons() {
  document.querySelectorAll(".compare-btn").forEach(function (btn) {
    var on = compareIds.indexOf(btn.dataset.id) > -1;
    btn.classList.toggle("compare-btn-active", on);
    btn.textContent = on ? "\u2713 Added" : "+ Compare";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function clearCompare() {
  compareIds = [];
  refreshCompareButtons();
  updateCompareBar(window._allCars || []);
}

// TOAST
function showToast(msg) {
  var t = document.createElement("div");
  t.className   = "compare-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function () { t.classList.add("compare-toast-show"); });
  setTimeout(function () {
    t.classList.remove("compare-toast-show");
    setTimeout(function () { t.remove(); }, 420);
  }, 2600);
}

// PRICE RANGE SLIDER
var priceRange  = { min: 0, max: Infinity };
var sliderReady = false;

function parsePriceLakh(car) {
  var s = String(car.price || "").toLowerCase();
  var m = s.match(/([\d.]+)\s*(lakh|lac|cr|crore)/i);
  if (!m) { var n = parseFloat(s.replace(/[^\d.]/g, "")); return isNaN(n) ? 0 : n; }
  var n = parseFloat(m[1]);
  return /cr/i.test(m[2]) ? n * 100 : n;
}

function initPriceSlider(allCars) {
  var minSlider = document.getElementById("priceMinSlider");
  var maxSlider = document.getElementById("priceMaxSlider");
  var label     = document.getElementById("priceRangeDisplay");
  var fill      = document.getElementById("priceFill");
  if (!minSlider || !maxSlider) return;

  var prices  = allCars.map(parsePriceLakh).filter(function (p) { return p > 0; });
  var dataMin = Math.floor(Math.min.apply(null, prices));
  var dataMax = Math.ceil(Math.max.apply(null, prices));

  minSlider.min = dataMin; minSlider.max = dataMax; minSlider.value = dataMin;
  maxSlider.min = dataMin; maxSlider.max = dataMax; maxSlider.value = dataMax;
  priceRange = { min: dataMin, max: dataMax };
  sliderReady = true;
  updateSliderUI(minSlider, maxSlider, dataMin, dataMax, fill, label);

  function onSlide() {
    var lo = parseInt(minSlider.value), hi = parseInt(maxSlider.value);
    if (lo > hi) { if (this === minSlider) minSlider.value = hi; else maxSlider.value = lo; }
    lo = parseInt(minSlider.value); hi = parseInt(maxSlider.value);
    priceRange = { min: lo, max: hi };
    updateSliderUI(minSlider, maxSlider, dataMin, dataMax, fill, label);
    applyFilters();
  }
  minSlider.addEventListener("input", onSlide);
  maxSlider.addEventListener("input", onSlide);
}

function updateSliderUI(minSlider, maxSlider, dataMin, dataMax, fill, label) {
  var lo   = parseInt(minSlider.value);
  var hi   = parseInt(maxSlider.value);
  var span = dataMax - dataMin || 1;
  var lp   = ((lo - dataMin) / span) * 100;
  var rp   = ((hi - dataMin) / span) * 100;
  if (fill) { fill.style.left = lp + "%"; fill.style.width = (rp - lp) + "%"; }
  if (label) {
    label.textContent = (lo === dataMin && hi === dataMax)
      ? "All prices"
      : "\u20B9" + lo + "L \u2014 \u20B9" + hi + "L";
  }
}

// CAR GRID
var carGrid     = document.getElementById("carGrid");
var brandFilter = document.getElementById("brandFilter");
var fuelFilter  = document.getElementById("fuelFilter");
var cars = [];

function createCard(car) {
  if (!carGrid) return null;
  var card = document.createElement("article");
  card.className = "car-card reveal-on-scroll";
  var mileageLine = car.fuelType === "Electric"
    ? "Range: " + (car.range || "N/A")
    : "Mileage: " + (car.mileage || "N/A");
  var desc = car.description && car.description.length > 100
    ? car.description.slice(0, 100) + "..."
    : (car.description || "");
  var highlights = Array.isArray(car.highlights) ? car.highlights : [];
  var firstHighlight = highlights[0] ? "<li>" + highlights[0] + "</li>" : "";
  var wlOn = isWishlisted(car.id);

  card.innerHTML =
    '<div class="car-card-img-wrap">' +
      '<img src="' + car.imageUrl + '" alt="' + car.brand + " " + car.model +
      '" loading="lazy" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
      '<button class="heart-btn' + (wlOn ? " heart-on" : "") + '" data-id="' + car.id +
      '" aria-pressed="' + (wlOn ? "true" : "false") + '" title="' + (wlOn ? "Remove from wishlist" : "Add to wishlist") + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      "</button>" +
    "</div>" +
    '<div class="car-card-header"><div>' +
      "<h3>" + car.brand + " " + car.model + "</h3>" +
      "<p>" + (car.segment || "") + " \u00B7 " + car.fuelType + "</p>" +
    "</div></div>" +
    '<div class="car-details car-summary">' +
      '<div class="car-meta">' +
        "<p><strong>Price:</strong> " + car.price + "</p>" +
        "<p><strong>" + mileageLine + "</strong></p>" +
      "</div>" +
      "<p>" + desc + "</p>" +
      '<ul class="highlights">' + firstHighlight + "</ul>" +
    "</div>" +
    '<div class="car-card-footer">' +
      '<button class="compare-btn" data-id="' + car.id + '" aria-pressed="false">+ Compare</button>' +
    "</div>";

  card.querySelector(".heart-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    toggleWishlist(car.id, cars);
  });
  card.querySelector(".compare-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    toggleCompare(String(car.id), cars);
  });

  card.tabIndex = 0;
  function goTo() { window.location.href = "product.html?id=" + car.id; }
  card.addEventListener("click", goTo);
  card.addEventListener("keypress", function (e) { if (e.key === "Enter") goTo(); });
  return card;
}

function renderCars(list) {
  if (!carGrid) return;
  carGrid.innerHTML = "";
  if (!list.length) {
    carGrid.innerHTML = '<p class="empty-state">No cars match the selected filters.</p>';
    initRevealAnimations();
    return;
  }
  list.forEach(function (car) { var c = createCard(car); if (c) carGrid.appendChild(c); });
  initRevealAnimations();
}

function populateBrandFilter(list) {
  if (!brandFilter) return;
  var brands = Array.from(new Set(list.map(function (c) { return c.brand; }))).sort();
  brands.forEach(function (b) {
    var opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    brandFilter.appendChild(opt);
  });
}

function applyFilters() {
  if (!carGrid) return;
  var brand = brandFilter ? brandFilter.value : "all";
  var fuel  = fuelFilter  ? fuelFilter.value  : "all";
  var term  = searchInput ? searchInput.value.trim().toLowerCase() : "";
  var loP   = sliderReady ? priceRange.min : 0;
  var hiP   = sliderReady ? priceRange.max : Infinity;

  var filtered = cars.filter(function (car) {
    var bm = brand === "all" || car.brand === brand;
    var fm = fuel  === "all" || car.fuelType === fuel;
    var sm = !term || [car.brand, car.model, car.description, car.segment, car.fuelType]
      .some(function (v) { return String(v || "").toLowerCase().includes(term); });
    var price = parsePriceLakh(car);
    var pm = !sliderReady || (price >= loP && price <= hiP);
    return bm && fm && sm && pm;
  });

  renderCars(filtered);
  refreshCompareButtons();
  refreshHeartButtons();

  if (term && filtered.length) {
    var first = carGrid.querySelector(".car-card");
    if (first) {
      first.classList.add("highlight-match");
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { first.classList.remove("highlight-match"); }, 2200);
    }
  }
}

async function loadCars() {
  if (!carGrid) return;
  try {
    var res = await fetch("/api/cars");
    cars = await res.json();
    window._allCars = cars;
    populateBrandFilter(cars);
    initPriceSlider(cars);
    initCompareBar();
    renderCars(cars);
    if (searchInput && searchInput.value.trim()) applyFilters();
    updateWishlistBadge();
  } catch (err) {
    carGrid.innerHTML = '<p class="empty-state">Unable to load car data. Please try again.</p>';
    console.error("Failed to load cars:", err);
  }
}

if (brandFilter) brandFilter.addEventListener("change", applyFilters);
if (fuelFilter)  fuelFilter.addEventListener("change",  applyFilters);
if (searchInput) searchInput.addEventListener("input",   applyFilters);

// CONTACT FORM
function initContactForm() {
  var form   = document.getElementById("contactForm");
  var status = document.getElementById("contactStatus");
  if (!form || !status) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    status.textContent = "Sending...";
    status.style.color = "var(--text)";
    try {
      var res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    form.querySelector("[name='name']").value,
          email:   form.querySelector("[name='email']").value,
          message: form.querySelector("[name='message']").value
        })
      });
      var result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      status.textContent = "Thanks! Your message was sent.";
      status.style.color = "#16a34a";
      form.reset();
    } catch (err) {
      status.textContent = "Unable to send. Please try again.";
      status.style.color = "#dc2626";
    }
  });
}

// INIT
initSearchToggle();
initRevealAnimations();
initUserProfile();
initWishlistDrawer();
loadCars();
initContactForm();
