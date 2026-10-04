(function () {
  "use strict";

  var form = document.getElementById("adminCarForm");
  var status = document.getElementById("adminStatus");
  var inventoryList = document.getElementById("inventoryList");
  var inquiriesList = document.getElementById("inquiriesList");
  var inventorySearch = document.getElementById("inventorySearch");
  var fuelFilter = document.getElementById("fuelFilter");
  var inquirySearch = document.getElementById("inquirySearch");
  var cancelEditButton = document.getElementById("cancelEditButton");
  var saveCarButton = document.getElementById("saveCarButton");
  var cars = [];
  var inquiries = [];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function requestJson(url, options) {
    var response = await fetch(url, options);
    var result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error("The server returned an unexpected response. Please refresh and try again.");
    }
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = "admin-status admin-field-full" + (type ? " is-" + type : "");
  }

  function updateStats() {
    document.getElementById("carCount").textContent = cars.length;
    document.getElementById("inquiryCount").textContent = inquiries.length;
    document.getElementById("electricCount").textContent = cars.filter(function (car) {
      return String(car.fuelType || "").toLowerCase() === "electric";
    }).length;
  }

  function renderInventory() {
    var query = inventorySearch.value.trim().toLowerCase();
    var fuel = fuelFilter.value;
    var filteredCars = cars.filter(function (car) {
      var matchesQuery = (String(car.brand || "") + " " + String(car.model || ""))
        .toLowerCase().includes(query);
      return matchesQuery && (fuel === "all" || car.fuelType === fuel);
    });

    if (!filteredCars.length) {
      inventoryList.innerHTML = '<p class="admin-empty">No cars match your search.</p>';
      return;
    }

    inventoryList.innerHTML = filteredCars.map(function (car) {
      var imageUrl = car.imageUrl || "images/car-placeholder.svg";
      return `
        <article class="admin-car-card">
          <img class="admin-car-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)}" loading="lazy" onerror="this.onerror=null;this.src='images/car-placeholder.svg'">
          <div class="admin-car-info">
            <div class="admin-car-title-row">
              <h3>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>
              <span class="admin-fuel-tag">${escapeHtml(car.fuelType || "Other")}</span>
            </div>
            <p class="admin-car-price">${escapeHtml(car.price || "Price not set")}</p>
            <p class="admin-car-meta">${escapeHtml(car.segment || "New")} <span aria-hidden="true">·</span> ${escapeHtml(car.mileage || "Mileage n/a")}</p>
          </div>
          <div class="admin-car-actions">
            <button type="button" class="admin-action-button" data-action="edit" data-id="${escapeHtml(car.id)}">Edit</button>
            <button type="button" class="admin-action-button admin-action-delete" data-action="delete" data-id="${escapeHtml(car.id)}">Delete</button>
          </div>
        </article>`;
    }).join("");
  }

  function renderInquiries() {
    var query = inquirySearch.value.trim().toLowerCase();
    var filteredInquiries = inquiries.filter(function (inquiry) {
      return [inquiry.name, inquiry.email, inquiry.message].join(" ").toLowerCase().includes(query);
    });

    if (!filteredInquiries.length) {
      inquiriesList.innerHTML = '<p class="admin-empty">No inquiries match your search.</p>';
      return;
    }

    inquiriesList.innerHTML = filteredInquiries.map(function (inquiry) {
      var submittedAt = inquiry.submittedAt ? new Date(inquiry.submittedAt) : null;
      var dateLabel = submittedAt && !Number.isNaN(submittedAt.getTime())
        ? submittedAt.toLocaleString()
        : "Date unavailable";
      return `
        <article class="inquiry-card">
          <div class="inquiry-card-header">
            <div><h3>${escapeHtml(inquiry.name || "Unknown customer")}</h3><a href="mailto:${escapeHtml(inquiry.email || "")}">${escapeHtml(inquiry.email || "Email unavailable")}</a></div>
            <time>${escapeHtml(dateLabel)}</time>
          </div>
          <p>${escapeHtml(inquiry.message || "No message provided")}</p>
        </article>`;
    }).join("");
  }

  async function loadDashboard() {
    inventoryList.innerHTML = '<p class="admin-loading">Loading inventory...</p>';
    inquiriesList.innerHTML = '<p class="admin-loading">Loading inquiries...</p>';
    var results = await Promise.all([
      requestJson("/api/cars"),
      requestJson("/api/inquiries")
    ]);
    cars = results[0];
    inquiries = results[1];
    updateStats();
    renderInventory();
    renderInquiries();
  }

  function resetEditor() {
    form.reset();
    form.elements.id.value = "";
    document.getElementById("editorTitle").textContent = "Add a new car";
    saveCarButton.textContent = "Publish car";
    cancelEditButton.hidden = true;
    setStatus("", "");
  }

  function editCar(id) {
    var car = cars.find(function (item) { return String(item.id) === id; });
    if (!car) {
      setStatus("This car is no longer in the inventory. Refresh the page and try again.", "error");
      return;
    }
    form.elements.id.value = car.id;
    form.elements.brand.value = car.brand || "";
    form.elements.model.value = car.model || "";
    form.elements.price.value = car.price || "";
    form.elements.fuelType.value = car.fuelType || "Petrol";
    form.elements.segment.value = car.segment || "";
    form.elements.mileage.value = car.mileage || "";
    form.elements.imageUrl.value = car.imageUrl && !car.imageUrl.startsWith("data:")
      ? car.imageUrl
      : "";
    form.elements.description.value = car.description || "";
    form.elements.highlights.value = Array.isArray(car.highlights)
      ? car.highlights.join(", ")
      : String(car.highlights || "");
    document.getElementById("editorTitle").textContent = "Edit " + car.brand + " " + car.model;
    saveCarButton.textContent = "Save changes";
    cancelEditButton.hidden = false;
    setStatus("", "");
    document.getElementById("carEditor").scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.brand.focus({ preventScroll: true });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var formData = new FormData(form);
    var carId = formData.get("id");
    var payload = {
      brand: formData.get("brand").trim(),
      model: formData.get("model").trim(),
      price: formData.get("price").trim(),
      fuelType: formData.get("fuelType"),
      segment: formData.get("segment").trim() || "New",
      mileage: formData.get("mileage").trim() || "N/A",
      imageUrl: formData.get("imageUrl").trim() || "images/car-placeholder.svg",
      description: formData.get("description").trim(),
      highlights: formData.get("highlights").trim()
    };

    saveCarButton.disabled = true;
    setStatus(carId ? "Saving changes..." : "Publishing car...", "info");
    try {
      await requestJson(carId ? "/api/cars/" + encodeURIComponent(carId) : "/api/cars", {
        method: carId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      await loadDashboard();
      resetEditor();
      setStatus(carId ? "Car updated successfully." : "Car published successfully.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      saveCarButton.disabled = false;
    }
  });

  inventoryList.addEventListener("click", async function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var id = button.dataset.id;
    if (button.dataset.action === "edit") {
      editCar(id);
      return;
    }

    var car = cars.find(function (item) { return String(item.id) === id; });
    if (!car || !window.confirm("Delete " + car.brand + " " + car.model + " from the catalog?")) return;
    button.disabled = true;
    try {
      await requestJson("/api/cars/" + encodeURIComponent(id), { method: "DELETE" });
      if (String(form.elements.id.value) === id) resetEditor();
      await loadDashboard();
    } catch (error) {
      window.alert(error.message);
      button.disabled = false;
    }
  });

  cancelEditButton.addEventListener("click", resetEditor);
  inventorySearch.addEventListener("input", renderInventory);
  fuelFilter.addEventListener("change", renderInventory);
  inquirySearch.addEventListener("input", renderInquiries);

  var logoutButton = document.getElementById("adminLogoutBtn");
  logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    try {
      await requestJson("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      window.alert(error.message);
      logoutButton.disabled = false;
    }
  });

  loadDashboard().catch(function (error) {
    inventoryList.innerHTML = '<p class="admin-empty admin-empty-error">' + escapeHtml(error.message) + '</p>';
    inquiriesList.innerHTML = '<p class="admin-empty admin-empty-error">Unable to load customer inquiries.</p>';
  });
}());
