const profileButton = document.querySelector(".avatar");
const profilePopover = document.querySelector("#profile-popover");
const main = document.querySelector(".main");
const pages = document.querySelectorAll("[data-screen]");
const navigation = document.querySelectorAll("[data-page]");
const projectBack = document.querySelector(".project-details-page .project-back");
const documentationBack = document.querySelector(".documentation-back");
const rolloutBack = document.querySelector(".rollout-heading .project-back");
let currentPage = null;

function hasProductionOverview() {
  return ["pilot", "project-completed"].includes(document.documentElement.dataset.prototypePhase);
}

function showPage() {
  const requested = location.hash.slice(1);
  const productionMatch = requested.match(/^production-location\/(\d+)$/);
  const productionLocation = productionMatch && productionLocations.some((item) => item.id === productionMatch[1])
    ? productionLocations.find((item) => item.id === "9000000002") : null;
  const detailCard = requested === "learning-detail"
    ? learningCards[0]
    : [...learningCards].find((card) => card.getAttribute("href") === `#${requested}`);
  const page = productionMatch || requested === "production-location"
    ? productionLocation && hasProductionOverview() ? "production-location" : "production"
    : detailCard ? "learning-detail"
    : requested.startsWith("learning-detail/") ? "learning"
    : [...pages].some((screen) => screen.dataset.screen === requested) ? requested : "home";
  if (detailCard) showLearningDetail(detailCard);
  if (page === "production-location") showProductionLocation(productionLocation);
  if (page === "project" && (currentPage === "home" || currentPage === "company")) {
    projectBack.href = `#${currentPage}`;
  }
  if (page === "documentation" && (currentPage === "home" || currentPage === "company")) {
    documentationBack.href = `#${currentPage}`;
  }
  if (page === "rollout" && (currentPage === "home" || currentPage === "company")) {
    rolloutBack.href = `#${currentPage}`;
  }
  if (page === "learning" && currentPage !== "learning" && currentPage !== "learning-detail") {
    learningSearch.value = "";
    selectLearningFilter("In scope");
  }

  pages.forEach((screen) => {
    screen.hidden = screen.dataset.screen !== page;
  });
  navigation.forEach((item) => {
    const active = item.dataset.page === (page === "project" || page === "documentation" || page === "rollout" ? "company" : page === "learning-detail" ? "learning" : page === "production-location" ? "production" : page);
    const icon = item.querySelector(".rail-icon");
    const image = icon.querySelector("img");
    icon.classList.toggle("selected", active);
    image.src = active ? image.dataset.activeSrc : image.dataset.inactiveSrc;
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  main.classList.toggle("empty-page", page === "sandbox" || page === "production");
  main.classList.toggle("company-view", page === "company" || page === "documentation" || page === "rollout" || page === "learning" || page === "learning-detail" || page === "production-location" || (page === "production" && hasProductionOverview()));
  main.classList.toggle("rollout-view", page === "rollout");
  main.scrollTop = 0;
  setProfileOpen(false);
  currentPage = page;
  updateSandboxDrawer();
}

const rolloutFeedback = document.querySelector(".rollout-feedback");
document.querySelector(".rollout-confirm").addEventListener("click", () => {
  rolloutFeedback.textContent = "Prototype only: the rollout procedure has not been confirmed.";
});

const documentationTabs = [...document.querySelectorAll(".documentation-tabs [role=tab]")];
const documentationFeedback = document.querySelector(".documentation-feedback");
const documentationUrl = document.querySelector("#documentation-url");
const documentationLinkList = document.querySelector(".documentation-staged-links");
const documentationItems = document.querySelector(".documentation-items");
const documentationCount = document.querySelector(".documentation-items-count");
const documentationToast = document.querySelector(".documentation-toast");
const documentationFileInput = document.querySelector(".documentation-file-input");
const documentationDropzone = document.querySelector(".documentation-dropzone");
const documentationFileSelection = document.querySelector(".documentation-file-selection");
let documentationToastTimer;

function updateDocumentationCount() {
  const count = [...documentationLinkList.children].filter((item) => !item.hidden).length;
  documentationItems.hidden = count === 0;
  documentationCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
}

function wireDocumentationRemove(item) {
  item.querySelector(".documentation-item-remove").addEventListener("click", () => {
    const visibleItems = [...documentationLinkList.children].filter((other) => other !== item && !other.hidden);
    const nextFocus = visibleItems[0]?.querySelector(".documentation-item-remove") ||
      document.querySelector('.documentation-tabs [aria-selected="true"]');
    item.remove();
    updateDocumentationCount();
    showDocumentationToast("Link removed from this prototype.");
    nextFocus.focus();
  });
}

wireDocumentationRemove(documentationLinkList.querySelector(".documentation-item"));

function showDocumentationToast(message) {
  documentationToast.querySelector("span").textContent = message;
  documentationToast.hidden = false;
  clearTimeout(documentationToastTimer);
  documentationToastTimer = setTimeout(() => { documentationToast.hidden = true; }, 4000);
}

function selectDocumentationTab(tab, focus = false) {
  documentationTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  });
  documentationFeedback.textContent = "";
  if (focus) tab.focus();
}

documentationTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectDocumentationTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = documentationTabs.length - 1;
    else return;
    event.preventDefault();
    selectDocumentationTab(documentationTabs[next], true);
  });
});

document.querySelector(".documentation-link-form").addEventListener("submit", (event) => {
  event.preventDefault();
  let url;
  try {
    url = new URL(documentationUrl.value);
  } catch {
    documentationFeedback.textContent = "Enter a valid HTTP or HTTPS URL.";
    documentationUrl.focus();
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    documentationFeedback.textContent = "Enter a valid HTTP or HTTPS URL.";
    documentationUrl.focus();
    return;
  }
  const item = document.createElement("li");
  item.className = "documentation-item";
  item.innerHTML = '<span class="documentation-item-icon"><img src="assets/doc-link-icon.svg" alt=""></span><div class="documentation-item-content"><a class="documentation-item-link" target="_blank" rel="noopener noreferrer"><span></span><img src="assets/doc-link-external.svg" alt=""></a><p class="documentation-item-meta"></p></div><div class="documentation-item-actions"><a class="documentation-item-open" target="_blank" rel="noopener noreferrer"><img src="assets/doc-link-open.svg" alt="">Open</a><button type="button" class="documentation-item-remove"><img src="assets/doc-link-remove.svg" alt="">Remove</button></div>';
  const link = item.querySelector(".documentation-item-link");
  const open = item.querySelector(".documentation-item-open");
  link.href = url.href;
  open.href = url.href;
  link.querySelector("span").textContent = url.href.replace(/^https?:\/\//, "");
  link.setAttribute("aria-label", `${url.href} (opens in a new tab)`);
  open.setAttribute("aria-label", `Open ${url.href} in a new tab`);
  item.querySelector(".documentation-item-meta").textContent = `Link · Added ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}`;
  item.querySelector(".documentation-item-remove").setAttribute("aria-label", `Remove ${url.href}`);
  wireDocumentationRemove(item);
  documentationLinkList.append(item);
  updateDocumentationCount();
  documentationUrl.value = "";
  documentationFeedback.textContent = "";
  showDocumentationToast("Link added in this prototype; not submitted.");
});

function stageDocumentationFile(file) {
  if (!file) return;
  if (file.size > 500 * 1024 * 1024) {
    documentationFeedback.textContent = "File exceeds the 500 MB limit.";
    return;
  }
  if (!/^(image|video|text)\//.test(file.type)) {
    documentationFeedback.textContent = "Choose a video, image, or text file.";
    return;
  }
  documentationFileSelection.textContent = `Selected: ${file.name}`;
  documentationFileSelection.hidden = false;
  documentationFeedback.textContent = "File selected in this prototype only; it has not been uploaded.";
}

document.querySelector(".documentation-browse").addEventListener("click", () => documentationFileInput.click());
documentationFileInput.addEventListener("change", () => {
  stageDocumentationFile(documentationFileInput.files[0]);
  documentationFileInput.value = "";
});
documentationDropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  documentationDropzone.classList.add("dragging");
});
documentationDropzone.addEventListener("dragleave", (event) => {
  if (!documentationDropzone.contains(event.relatedTarget)) documentationDropzone.classList.remove("dragging");
});
documentationDropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  documentationDropzone.classList.remove("dragging");
  if (event.dataTransfer.files.length > 1) {
    documentationFeedback.textContent = "Choose one file at a time.";
    return;
  }
  stageDocumentationFile(event.dataTransfer.files[0]);
});

const learningFilters = document.querySelectorAll("[data-learning-filter]");
const learningCards = document.querySelectorAll(".learning-card");
const learningSearch = document.querySelector(".learning-search input");
const learningSearchContainer = document.querySelector(".learning-search");
const learningSearchClear = document.querySelector(".learning-search-clear");
const learningEmpty = document.querySelector(".learning-empty");
const learningDetail = document.querySelector(".learning-detail-page");
const slideImage = learningDetail.querySelector(".learning-slide img");
const slideError = learningDetail.querySelector(".learning-slide-error");
const slideCount = learningDetail.querySelector(".slide-count");
const slidePrevious = learningDetail.querySelector(".slide-previous");
const slideNext = learningDetail.querySelector(".slide-next");
let selectedLearningFilter = "In scope";
let detailSlides = [];
let slideIndex = 0;
let detailTitle = "";

function showLearningDetail(card) {
  detailTitle = card.querySelector("h2").textContent;
  learningDetail.querySelector("h1").textContent = detailTitle;
  learningDetail.querySelector(".company-heading p").textContent = card.querySelector("p").textContent;
  learningDetail.querySelector(".learning-tags").replaceChildren(
    ...[...card.querySelectorAll(".learning-tags span")].map((tag) => tag.cloneNode(true))
  );
  detailSlides = card.dataset.slides.split(",").map(Number);
  slideIndex = 0;
  showSlide();
}

function showSlide() {
  slideImage.hidden = true;
  slideImage.removeAttribute("src");
  slideError.hidden = false;
  slideCount.textContent = "";
  slidePrevious.disabled = true;
  slideNext.disabled = true;
}

slideImage.addEventListener("error", () => {
  slideImage.hidden = true;
  slideError.hidden = false;
});
slidePrevious.addEventListener("click", () => {
  if (slideIndex > 0) { slideIndex--; showSlide(); }
});
slideNext.addEventListener("click", () => {
  if (slideIndex < detailSlides.length - 1) { slideIndex++; showSlide(); }
});

function matchesLearningFilter(card, filter) {
  return filter === "All" || [...card.querySelectorAll(".learning-tags span")]
    .some((tag) => tag.textContent.trim() === filter);
}

function updateLearningResults() {
  learningSearchClear.hidden = learningSearch.value.length === 0;
  const query = learningSearch.value.trim().toLocaleLowerCase();
  const matchesSearch = (card) => card.textContent.toLocaleLowerCase().includes(query);
  let visibleCount = 0;
  learningCards.forEach((card) => {
    card.hidden = !matchesSearch(card) || !matchesLearningFilter(card, selectedLearningFilter);
    if (!card.hidden) visibleCount++;
  });
  learningFilters.forEach((filter) => {
    const count = [...learningCards].filter((card) =>
      matchesSearch(card) && matchesLearningFilter(card, filter.dataset.learningFilter)
    ).length;
    filter.querySelector("span").textContent = `(${count})`;
  });
  learningEmpty.hidden = visibleCount > 0;
}

function selectLearningFilter(label) {
  selectedLearningFilter = label;
  learningFilters.forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter.dataset.learningFilter === label));
  });
  updateLearningResults();
}

learningFilters.forEach((filter) => {
  filter.addEventListener("click", () => selectLearningFilter(filter.dataset.learningFilter));
});
learningSearch.addEventListener("input", updateLearningResults);
learningSearchContainer.addEventListener("click", (event) => {
  if (event.target === learningSearchContainer) learningSearch.focus();
});
learningSearchClear.addEventListener("click", () => {
  learningSearch.value = "";
  updateLearningResults();
  learningSearch.focus();
});

window.addEventListener("hashchange", showPage);

function setProfileOpen(open) {
  profilePopover.hidden = !open;
  profileButton.setAttribute("aria-expanded", String(open));
}

profileButton.addEventListener("click", () => {
  setProfileOpen(profilePopover.hidden);
});

document.addEventListener("click", (event) => {
  if (!profilePopover.hidden && !profilePopover.contains(event.target) && !profileButton.contains(event.target)) {
    setProfileOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !profilePopover.hidden) {
    setProfileOpen(false);
    profileButton.focus();
  }
});

const prototypeControls = document.querySelector(".prototype-controls");
const prototypeToggle = document.querySelector(".prototype-toggle");
const prototypeMenu = document.querySelector(".prototype-menu");
const prototypePhases = document.querySelectorAll("[data-prototype-phase]");
const sandboxDrawer = document.querySelector(".sandbox-drawer");
const sandboxItems = document.querySelectorAll("[data-sandbox-section]");
const sandboxEnvironment = document.querySelector(".sandbox-environment");
const acceptanceTests = document.querySelector(".acceptance-tests");
const sandboxPlaceholder = document.querySelector(".sandbox-section-placeholder");
const pilotAcceptanceEmpty = document.querySelector(".pilot-acceptance-empty");
const pilotHistory = document.querySelector(".pilot-history");
const sandboxTabs = [...document.querySelectorAll(".sandbox-environment .sandbox-tabs [role=tab]")];
const locationPanel = document.querySelector(".location-panel");
const locationPanelClose = document.querySelector(".location-panel-close");
const sandboxFeedback = document.querySelector(".sandbox-feedback");
let locationPanelTrigger = null;
let feedbackTimeout;
const acceptanceDetail = document.querySelector(".acceptance-detail");
const acceptanceDetailClose = document.querySelector(".acceptance-detail-close");
const developmentSubmit = document.querySelector(".development-submit");
const reviewDialog = document.querySelector(".review-dialog");
const historyDetail = document.querySelector(".history-detail");
const historyDetailClose = document.querySelector(".history-detail-close");
let acceptanceDetailTrigger = null;
let selectedAcceptanceRow = null;
let historyDetailTrigger = null;
let selectedHistoryRow = null;

const productionLocations = [
  { id: "9000000001", name: "BestGym Bodensee", rate: 100, lastUsed: "Not used yet" },
  { id: "9000000002", name: "BestGym Stuttgart", rate: 72, lastUsed: "Not used yet" },
  { id: "9000000003", name: "BestGym Munich", rate: 96, lastUsed: "05.07.2026, 22:50" },
  { id: "9000000004", name: "BestGym Stuttgart West", rate: 0, lastUsed: "Not used yet" },
  { id: "9000000005", name: "BestGym Frankfurt", rate: 99, lastUsed: "05.07.2026, 22:50" },
  { id: "9000000006", name: "BestGym Berlin", rate: 85, lastUsed: "Not used yet" },
  { id: "9000000007", name: "BestGym Friedrichshafen", rate: 90, lastUsed: "05.07.2026, 22:50" },
  { id: "9000000008", name: "BestGym Munich Schwabing", rate: 98, lastUsed: "05.07.2026, 22:50" },
  { id: "9000000009", name: "BestGym Hamburg", rate: 100, lastUsed: "05.07.2026, 22:50" },
  { id: "9000000010", name: "BestGym Munich Sendling", rate: 99, lastUsed: "05.07.2026, 22:50" }
];
const productionTableBody = document.querySelector(".production-table tbody");
const productionSearch = document.querySelector(".production-search input");
const productionTabs = [...document.querySelectorAll(".production-tabs [role=tab]")];

productionLocations.forEach((location) => {
  const row = document.createElement("tr");
  row.dataset.locationName = location.name;
  row.dataset.search = `${location.id} BestGym ${location.name}`.toLowerCase();
  const rateClass = location.rate === 0 ? "neutral" : location.rate < 90 ? "warning" : "positive";
  row.innerHTML = `<td>${location.id}</td><td>BestGym</td><td><a href="#production-location/9000000002">${location.name}</a></td>
    <td><div class="production-rate ${rateClass}"><span>${location.rate}%</span><div class="production-rate-track"><div style="width:${location.rate}%"></div></div></div></td>
    <td><span class="sandbox-status active">Active</span></td><td class="${location.lastUsed === "Not used yet" ? "muted" : ""}">${location.lastUsed}</td>
    <td><div class="sandbox-key" data-mock-key="egym_100_demo_${location.id}_not_a_real_key"><span class="sandbox-key-value">egym_100•••••••••••••••••••••••••••••••</span><button class="sandbox-icon-button toggle-mock-key" type="button" aria-label="Show mock API key for ${location.name}" aria-pressed="false"><img src="assets/view.svg" alt=""></button><button class="sandbox-icon-button copy-mock-key" type="button" aria-label="Copy mock API key for ${location.name}"><img src="assets/copy.svg" alt=""></button></div></td>`;
  row.addEventListener("click", (event) => {
    if (!event.target.closest("a, button")) window.location.hash = "#production-location/9000000002";
  });
  productionTableBody.append(row);
});

productionSearch.addEventListener("input", () => {
  const query = productionSearch.value.trim().toLowerCase();
  let count = 0;
  productionTableBody.querySelectorAll("tr").forEach((row) => {
    row.hidden = !row.dataset.search.includes(query);
    if (!row.hidden) count++;
  });
  document.querySelector(".production-location-count").textContent = `${count} ${count === 1 ? "location" : "locations"} and ${count ? "1 chain" : "0 chains"}`;
  document.querySelector(".production-no-results").hidden = count !== 0;
});

function selectProductionTab(tab, focus = false) {
  productionTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  });
  if (focus) tab.focus();
}

productionTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectProductionTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % productionTabs.length;
    else if (event.key === "ArrowLeft") next = (index + productionTabs.length - 1) % productionTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = productionTabs.length - 1;
    else return;
    event.preventDefault();
    selectProductionTab(productionTabs[next], true);
  });
});

function showProductionLocation(location) {
  document.querySelector("#production-location-title").textContent = location.name;
  document.querySelector('[data-production-field="id"]').textContent = location.id;
  document.querySelector('[data-production-field="chain"]').textContent = "BestGym";
  const key = document.querySelector(".production-detail-key");
  key.querySelector(".sandbox-key-value").textContent = "egym_100•••••••••••••••••••••••••••••••";
  key.querySelector(".toggle-mock-key").setAttribute("aria-pressed", "false");
  key.querySelector(".toggle-mock-key").setAttribute("aria-label", `Show mock API key for ${location.name}`);
  selectProductionTab(productionTabs[0]);
}

const acceptanceCases = {
  member: [
    { title: "Sync new member", status: "not-started" },
    { title: "Update member's contract data", status: "passed" },
    { title: "Update member's personal data", status: "failed", example: true },
    { title: "Upload member's image", status: "not-started" },
    { title: "Delete member's image", status: "not-started" },
    { title: "Sync new prospect", status: "not-started" },
    { title: "Update prospect to member", status: "not-started" },
    { title: "Delete membership data from EGYM", status: "not-started" },
    { title: "Delete member data from EGYM upon deletion from MMS", status: "not-started" },
    { title: 'Sync new member resolving email conflict "Membership conflicts with another account."', status: "not-started" },
    { title: 'Sync new member resolving membershipId conflict "This membershipId already exists."', status: "not-started" },
    { title: 'Update member\'s email resolving email conflict "The email you sent is already used within your gym or chain."', status: "not-started" }
  ],
  rfid: [
    { title: "Sync new member", status: "passed" },
    { title: "Add RFID to a member", status: "not-started" },
    { title: "Delete RFID for a member", status: "not-started" },
    { title: "Update all RFIDs for a member", status: "not-started" }
  ]
};

function getAcceptanceStatus(test) {
  const phase = document.documentElement.dataset.prototypePhase;
  return phase === "review" ? "passed" : phase === "development-completed" ? test.completedStatus : test.status;
}

function updateDevelopmentTasks(passed, total) {
  const completedPhase = document.documentElement.dataset.prototypePhase === "development-completed";
  const testsCompleted = completedPhase && passed === total;
  document.querySelector(".development-count").textContent = completedPhase ? `${testsCompleted ? 2 : 1} of 2 completed` : "0 of 2 completed";
  document.querySelector(".development-header p").textContent = testsCompleted
    ? "All tasks completed. You may now submit your integration for review"
    : "Complete both tasks before submitting for review.";
  document.querySelector(".open-acceptance-tests .task-indicator").classList.toggle("is-complete", testsCompleted);
  document.querySelector(".open-documentation .task-indicator").classList.toggle("is-complete", completedPhase);
  document.querySelector(".open-documentation .task-description").textContent = completedPhase
    ? "Share your online documentation to help our team support you."
    : "Share your online documentation to help the EGYM team support you.";
  developmentSubmit.disabled = !testsCompleted;
}

function closeAcceptanceDetail(restoreFocus = false) {
  if (acceptanceDetail.hidden) return;
  acceptanceDetail.hidden = true;
  selectedAcceptanceRow?.classList.remove("selected");
  if (restoreFocus && acceptanceDetailTrigger) acceptanceDetailTrigger.focus();
  acceptanceDetailTrigger = null;
  selectedAcceptanceRow = null;
}

function closeHistoryDetail(restoreFocus = false) {
  if (historyDetail.hidden) return;
  historyDetail.hidden = true;
  selectedHistoryRow?.classList.remove("selected");
  if (restoreFocus && historyDetailTrigger) historyDetailTrigger.focus();
  historyDetailTrigger = null;
  selectedHistoryRow = null;
}

function updateAcceptanceProgress() {
  let passed = 0;
  let total = 0;
  Object.entries(acceptanceCases).forEach(([group, cases]) => {
    const groupPassed = cases.filter((test) => getAcceptanceStatus(test) === "passed").length;
    document.querySelector(`[data-test-group="${group}"] .acceptance-group-count`).textContent = `${groupPassed} of ${cases.length} passed`;
    passed += groupPassed;
    total += cases.length;
  });
  document.querySelector(".acceptance-progress-count").textContent = `${passed} of ${total} passed`;
  document.querySelector(".acceptance-progress-track").setAttribute("aria-valuenow", String(passed));
  document.querySelector(".acceptance-progress-fill").style.width = `${passed / total * 100}%`;
  updateDevelopmentTasks(passed, total);
}

function updateAcceptanceRow(row, test) {
  const status = getAcceptanceStatus(test);
  const label = row.querySelector(".acceptance-status");
  label.replaceChildren();
  label.className = `acceptance-status ${status}`;
  if (status !== "not-started") {
    const icon = document.createElement("img");
    icon.src = `assets/acceptance-${status}.svg`;
    icon.alt = "";
    label.append(icon);
  }
  label.append(document.createTextNode(status === "not-started" ? "Not started" : status === "passed" ? "Passed" : "Failed"));
  row.querySelector(".acceptance-error").hidden = status !== "failed";
  row.querySelector(".acceptance-retest").disabled = status === "not-started" || document.documentElement.dataset.prototypePhase === "review";
}

Object.entries(acceptanceCases).forEach(([group, cases]) => {
  const tbody = document.querySelector(`[data-test-group="${group}"] tbody`);
  cases.forEach((test) => {
    test.completedStatus = "passed";
    const row = document.createElement("tr");
    row.innerHTML = '<td><span class="acceptance-test-title"></span><p class="acceptance-error" hidden><img src="assets/acceptance-failed.svg" alt="">"email" field returns an invalid result. See Details for more information.</p></td><td><span class="acceptance-status"></span></td><td><button class="acceptance-retest" type="button"><img src="assets/acceptance-retest.svg" alt="">Retest</button></td><td><button class="acceptance-details-button" type="button">Details <img src="assets/chevron.svg" alt=""></button></td>';
    row.querySelector(".acceptance-test-title").textContent = test.title;
    const detailButton = row.querySelector(".acceptance-details-button");
    detailButton.setAttribute("aria-label", `Details for ${test.title} (${group === "member" ? "Member sync" : "RFID sync"})`);
    detailButton.addEventListener("click", () => {
      closeAcceptanceDetail();
      acceptanceDetailTrigger = detailButton;
      selectedAcceptanceRow = row;
      row.classList.add("selected");
      acceptanceDetail.querySelector("#acceptance-detail-title").textContent = test.title;
      acceptanceDetail.querySelector(".acceptance-detail-example").hidden = !test.example;
      acceptanceDetail.querySelector(".acceptance-detail-placeholder").hidden = Boolean(test.example);
      acceptanceDetail.hidden = false;
      acceptanceDetail.querySelector(".acceptance-detail-content").scrollTop = 0;
      acceptanceDetailClose.focus();
    });
    const retestButton = row.querySelector(".acceptance-retest");
    retestButton.setAttribute("aria-label", `Retest ${test.title} (${group === "member" ? "Member sync" : "RFID sync"})`);
    retestButton.addEventListener("click", () => {
      if (document.documentElement.dataset.prototypePhase === "review") return;
      if (document.documentElement.dataset.prototypePhase === "development-completed") test.completedStatus = "not-started";
      else test.status = "not-started";
      updateAcceptanceRow(row, test);
      updateAcceptanceProgress();
      detailButton.focus();
      showSandboxFeedback("Mock retest ready; no test was run.");
    });
    updateAcceptanceRow(row, test);
    tbody.append(row);
  });
});
const historyBody = document.querySelector(".pilot-history-table tbody");
Object.entries(acceptanceCases).forEach(([group, cases]) => {
  cases.forEach((test) => {
    const row = document.createElement("tr");
    row.innerHTML = '<td>Aug 28, 2026, 1:43 PM</td><td>MMS API Integration</td><td></td><td></td><td><span class="acceptance-status passed"><img src="assets/acceptance-passed.svg" alt="">Passed</span></td><td><button class="acceptance-details-button" type="button">Details <img src="assets/chevron.svg" alt=""></button></td>';
    row.cells[2].textContent = group === "member" ? "Member sync" : "RFID sync";
    row.cells[3].textContent = test.title;
    const button = row.querySelector("button");
    button.setAttribute("aria-label", `Results for ${test.title} (${row.cells[2].textContent})`);
    button.addEventListener("click", () => {
      closeHistoryDetail();
      historyDetailTrigger = button;
      selectedHistoryRow = row;
      row.classList.add("selected");
      historyDetail.querySelector("#history-detail-title").textContent = test.title;
      historyDetail.querySelector(".history-detail-example").hidden = !test.example;
      historyDetail.querySelector(".history-detail-placeholder").hidden = Boolean(test.example);
      historyDetail.hidden = false;
      historyDetail.querySelector(".history-detail-content").scrollTop = 0;
      historyDetailClose.focus();
    });
    historyBody.append(row);
  });
});
updateAcceptanceProgress();
acceptanceDetailClose.addEventListener("click", () => closeAcceptanceDetail(true));
historyDetailClose.addEventListener("click", () => closeHistoryDetail(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !acceptanceDetail.hidden) closeAcceptanceDetail(true);
  if (event.key === "Escape" && !historyDetail.hidden) closeHistoryDetail(true);
});
document.querySelector(".acceptance-copy").addEventListener("click", () => {
  copySandboxValue(document.querySelector(".acceptance-alert p span").textContent);
});
developmentSubmit.addEventListener("click", () => {
  reviewDialog.showModal();
});
document.querySelector(".review-close").addEventListener("click", () => reviewDialog.close());
document.querySelector(".review-cancel").addEventListener("click", () => reviewDialog.close());
document.querySelector(".review-confirm").addEventListener("click", () => {
  reviewDialog.close();
  setPrototypePhase("review");
  document.querySelector("#submission-summary-heading").focus();
  showSandboxFeedback("Prototype only: no submission was sent.");
});

function closeLocationPanel(restoreFocus = false) {
  if (locationPanel.hidden) return;
  locationPanel.hidden = true;
  if (restoreFocus && locationPanelTrigger) locationPanelTrigger.focus();
  locationPanelTrigger = null;
}

function selectSandboxTab(tab, focus = false) {
  closeLocationPanel();
  sandboxTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  });
  if (focus) tab.focus();
}

sandboxTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectSandboxTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % sandboxTabs.length;
    else if (event.key === "ArrowLeft") next = (index + sandboxTabs.length - 1) % sandboxTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sandboxTabs.length - 1;
    else return;
    event.preventDefault();
    selectSandboxTab(sandboxTabs[next], true);
  });
});

document.querySelectorAll(".sandbox-details-action").forEach((button) => {
  const row = button.closest("tr");
  button.setAttribute("aria-label", `Details for ${row.dataset.locationName}`);
  button.addEventListener("click", () => {
    locationPanelTrigger = button;
    locationPanel.querySelector("#location-panel-title").textContent = row.dataset.locationName;
    locationPanel.querySelectorAll("[data-location-field]").forEach((field) => {
      field.textContent = row.dataset[`location${field.dataset.locationField[0].toUpperCase()}${field.dataset.locationField.slice(1)}`];
    });
    const key = locationPanel.querySelector(".sandbox-key");
    key.dataset.mockKey = row.querySelector(".sandbox-key").dataset.mockKey;
    key.querySelector(".sandbox-key-value").textContent = "egym_100•••••••••••••••••••••••••••••••";
    key.querySelector(".toggle-mock-key").setAttribute("aria-pressed", "false");
    key.querySelector(".toggle-mock-key").setAttribute("aria-label", `Show mock API key for ${row.dataset.locationName}`);
    locationPanel.hidden = false;
    locationPanel.querySelector(".location-panel-content").scrollTop = 0;
    locationPanelClose.focus();
  });
});
locationPanelClose.addEventListener("click", () => closeLocationPanel(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !locationPanel.hidden) closeLocationPanel(true);
});

document.querySelectorAll(".toggle-mock-key").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.closest(".sandbox-key");
    const visible = button.getAttribute("aria-pressed") !== "true";
    const locationName = button.closest("tr")?.dataset.locationName || button.closest(".production-location")?.querySelector("#production-location-title").textContent || locationPanel.querySelector("#location-panel-title").textContent;
    key.querySelector(".sandbox-key-value").textContent = visible ? key.dataset.mockKey : "egym_100•••••••••••••••••••••••••••••••";
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} mock API key for ${locationName}`);
  });
});

function showSandboxFeedback(message) {
  sandboxFeedback.textContent = message;
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => { sandboxFeedback.textContent = ""; }, 3000);
}

async function copySandboxValue(value) {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(value);
    showSandboxFeedback("Copied to clipboard");
  } catch (error) {
    console.error("Could not copy to clipboard", error);
    showSandboxFeedback("Could not copy to clipboard");
  }
}

document.querySelectorAll(".copy-mock-key").forEach((button) => {
  button.addEventListener("click", () => copySandboxValue(button.closest(".sandbox-key").dataset.mockKey));
});
document.querySelectorAll(".copy-value").forEach((button) => {
  button.addEventListener("click", () => copySandboxValue(button.closest(".sandbox-copy-line").querySelector("[data-copy-value]").textContent));
});

function setPrototypeMenuOpen(open) {
  prototypeMenu.hidden = !open;
  prototypeToggle.setAttribute("aria-expanded", String(open));
  const label = open ? "Close prototype controls" : "Open prototype controls";
  prototypeToggle.setAttribute("aria-label", label);
  prototypeToggle.title = label;
  prototypeToggle.querySelector("span").textContent = open ? "»" : "«";
}

function setPrototypePhase(phase) {
  document.documentElement.dataset.prototypePhase = phase;
  const contentPhase = ["development-completed", "review", "pilot", "project-completed"].includes(phase) ? "development" : phase;
  document.querySelectorAll("[data-prototype-content]").forEach((element) => {
    const content = element.dataset.prototypeContent;
    const matches = content === "post-development" ? ["review", "pilot", "project-completed"].includes(phase)
      : content === "post-pilot" ? ["pilot", "project-completed"].includes(phase)
      : content === "review" || content === "pilot" || content === "project-completed" ? content === phase
      : content === contentPhase;
    element.hidden = !matches || (element.dataset.prototypeExclude || "").split(" ").includes(phase);
  });
  updateDocumentationCount();
  prototypePhases.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.prototypePhase === phase));
  });
  Object.entries(acceptanceCases).forEach(([group, cases]) => {
    const rows = document.querySelectorAll(`[data-test-group="${group}"] tbody tr`);
    cases.forEach((test, index) => updateAcceptanceRow(rows[index], test));
  });
  updateAcceptanceProgress();
  if (reviewDialog.open) reviewDialog.close();
  if (!hasProductionOverview() && currentPage === "production-location") {
    location.hash = "#production";
    showPage();
  }
  updateSandboxDrawer();
  selectSandboxSection(document.querySelector('[data-sandbox-section][aria-current="page"]'));
  localStorage.setItem("prototypePhase", phase);
}

function updateSandboxDrawer() {
  const open = document.documentElement.dataset.prototypePhase !== "planning" && currentPage === "sandbox";
  sandboxDrawer.hidden = !open;
  document.querySelector(".app").classList.toggle("sandbox-open", open);
  const productionAvailable = hasProductionOverview();
  document.querySelector(".production-empty").hidden = productionAvailable;
  document.querySelector(".production-overview").hidden = !productionAvailable;
  main.classList.toggle("empty-page", (currentPage === "production" && !productionAvailable) || (currentPage === "sandbox" && !open));
  if (currentPage === "production") main.classList.toggle("company-view", productionAvailable);
  if (!open) {
    closeLocationPanel();
    closeAcceptanceDetail();
    closeHistoryDetail();
  }
}

function selectSandboxSection(item) {
  sandboxItems.forEach((other) => {
    if (other === item) other.setAttribute("aria-current", "page");
    else other.removeAttribute("aria-current");
  });
  const section = item.dataset.sandboxSection;
  const isPilot = hasProductionOverview();
  sandboxEnvironment.hidden = section !== "Test environment";
  acceptanceTests.hidden = section !== "Acceptance tests" || isPilot;
  pilotAcceptanceEmpty.hidden = section !== "Acceptance tests" || !isPilot;
  sandboxPlaceholder.hidden = section !== "History" || isPilot;
  pilotHistory.hidden = section !== "History" || !isPilot;
  closeLocationPanel();
  closeAcceptanceDetail();
  closeHistoryDetail();
  main.scrollTop = 0;
}

sandboxItems.forEach((item) => {
  item.addEventListener("click", () => selectSandboxSection(item));
});

document.querySelector(".pilot-test-environment").addEventListener("click", () => {
  selectSandboxSection(document.querySelector('[data-sandbox-section="Test environment"]'));
});

document.querySelector(".review-tests").addEventListener("click", () => {
  selectSandboxSection(document.querySelector('[data-sandbox-section="Acceptance tests"]'));
});

document.querySelector(".open-acceptance-tests").addEventListener("click", () => {
  selectSandboxSection(document.querySelector('[data-sandbox-section="Acceptance tests"]'));
  location.hash = "#sandbox";
});

prototypeToggle.addEventListener("click", () => setPrototypeMenuOpen(prototypeMenu.hidden));
prototypePhases.forEach((button) => {
  button.addEventListener("click", () => {
    setPrototypePhase(button.dataset.prototypePhase);
    setPrototypeMenuOpen(false);
    prototypeToggle.focus();
  });
});
document.addEventListener("click", (event) => {
  if (!prototypeControls.contains(event.target)) setPrototypeMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !prototypeMenu.hidden) {
    setPrototypeMenuOpen(false);
    prototypeToggle.focus();
  }
});
const savedPrototypePhase = localStorage.getItem("prototypePhase");
setPrototypePhase(["planning", "development", "development-completed", "review", "pilot", "project-completed"].includes(savedPrototypePhase) ? savedPrototypePhase : "planning");
showPage();

document.querySelectorAll("[data-unavailable]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showSandboxFeedback("This link is unavailable in the public demo.");
  });
});
