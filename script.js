
const serviceName = "Net:Check";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const storageKey = "netcheck-inspection-records-v1";

const formData = {
  inspector: "", name: "", location: "", type: "", duration: "10",
  additional: false, additionalCount: "2", power: "", link: "",
  alarm: "", status: "", message: "", actions: []
};

let currentFilter = "all";
let savedInspectionId = null;
let records = readRecords();

function readRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(item => item && typeof item.id === "string" &&
      typeof item.name === "string" && ["정상", "주의", "점검 필요"].includes(item.status));
  } catch (error) {
    console.warn("점검 기록을 읽지 못했습니다.", error);
    return [];
  }
}

function saveRecords() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch (error) {
    console.warn("점검 기록 저장 실패:", error);
    return false;
  }
}

function makeElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  return element;
}

function statusClass(status) {
  if (status === "정상") return "status-normal";
  if (status === "주의") return "status-warning";
  return "status-critical";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(date);
}

const subscribeForm = $("#subscribe-form");
const emailInput = $("#email");
const subscribeButton = $("#subscribeButton");
const subscribeMessage = $("#subscribeMessage");

subscribeForm.addEventListener("submit", event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  subscribeMessage.classList.remove("is-success", "is-error");
  if (!valid) {
    subscribeMessage.textContent = email ? "올바른 이메일 주소를 입력해 주세요." : "이메일 주소를 입력해 주세요.";
    subscribeMessage.classList.add("is-error");
    emailInput.focus();
    return;
  }
  subscribeMessage.textContent = `${email}로 서비스 소식 신청이 완료되었습니다.`;
  subscribeMessage.classList.add("is-success");
  subscribeButton.textContent = "신청 완료";
  subscribeButton.disabled = true;
});

const themeButton = $("#themeButton");
themeButton.addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  themeButton.textContent = dark ? "라이트 테마로 바꾸기" : "다크 테마로 바꾸기";
  themeButton.setAttribute("aria-pressed", String(dark));
});

const nicknameInput = $("#nickname");
const nicknameCount = $("#nicknameCount");
const agreeCheck = $("#agreeCheck");
const agreeMessage = $("#agreeMessage");
const startButton = $("#startButton");

function updateNickname() {
  nicknameCount.textContent = `${nicknameInput.value.length} / ${nicknameInput.maxLength}`;
}

function updateAgreement() {
  startButton.disabled = !agreeCheck.checked;
  agreeMessage.textContent = agreeCheck.checked
    ? "안내 사항을 확인했습니다. 장비 점검을 시작할 수 있습니다."
    : "안내 사항을 확인한 후 장비 점검을 시작할 수 있습니다.";
  agreeMessage.classList.toggle("is-ready", agreeCheck.checked);
  agreeMessage.classList.remove("has-error");  
}

nicknameInput.addEventListener("input", updateNickname);
agreeCheck.addEventListener("change", updateAgreement);

const tabs = $$(".tab");
const panels = $$(".panel");

function activateTab(tab) {
  tabs.forEach(item => {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panels.forEach(panel => {
    const active = `#${panel.id}` === tab.dataset.target;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
}

tabs.forEach(tab => tab.addEventListener("click", () => activateTab(tab)));
if (tabs.length) activateTab(tabs.find(tab => tab.classList.contains("is-active")) || tabs[0]);

const inspectionFlow = $("#inspection-flow");
const flowSteps = $$("#inspection-flow .step");
const progressItems = $$("#inspection-flow .progress_item");
const inspectionDialog = $("#inspection-dialog");

function showStep(index) {
  flowSteps.forEach((step, i) => step.hidden = i !== index);
  progressItems.forEach((item, i) => {
    item.classList.toggle("is-active", i === index);
    if (i === index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  if (!inspectionFlow.hidden) inspectionFlow.scrollIntoView({ behavior: "smooth", block: "start" });
}

function revokeAgreement() {
  agreeCheck.checked = false;
  inspectionFlow.hidden = true;
  updateAgreement();
  agreeCheck.focus();
}

startButton.addEventListener("click", () => {
  if (!agreeCheck.checked) return;

  if (nicknameInput.value.trim().length < 2) {
    agreeMessage.textContent = "담당자 이름은 2자 이상 입력해 주세요.";
    agreeMessage.classList.remove("is-ready");
    agreeMessage.classList.add("has-error");
    nicknameInput.focus();
    return;
  }

  inspectionDialog.showModal();
});

$("#inspection-cancel").addEventListener("click", () => {
  inspectionDialog.close();
  revokeAgreement();
});
inspectionDialog.addEventListener("cancel", revokeAgreement);

$("#inspection-confirm").addEventListener("click", () => {
  if (!agreeCheck.checked) return;
  formData.inspector = nicknameInput.value.trim();
  if (!formData.inspector) {
    inspectionDialog.close();
    nicknameInput.focus();
    return;
  }
  inspectionDialog.close();
  inspectionFlow.hidden = false;
  showStep(0);
  $("#equipment-name").focus();
});

const equipmentName = $("#equipment-name");
const equipmentLocation = $("#equipment-location");
const equipmentType = $("#equipment-type");

function setInputError(input, message) {
  const error = $(`#${input.id}-error`);
  error.textContent = message;
  input.classList.toggle("has-error", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
}

function validateEquipment() {
  const fields = [
    [equipmentName, "장비명을 입력해 주세요."],
    [equipmentLocation, "장비 설치 위치를 입력해 주세요."],
    [equipmentType, "장비 종류를 선택해 주세요."]
  ];
  let firstInvalid = null;
  fields.forEach(([input, message]) => {
    const invalid = !input.value.trim();
    setInputError(input, invalid ? message : "");
    if (invalid && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  formData.name = equipmentName.value.trim();
  formData.location = equipmentLocation.value.trim();
  formData.type = equipmentType.value;
  return true;
}

[equipmentName, equipmentLocation, equipmentType].forEach(input => {
  input.addEventListener(input === equipmentType ? "change" : "input", () => setInputError(input, ""));
});

$("#equipment-next").addEventListener("click", () => {
  if (validateEquipment()) showStep(1);
});

const durationValues = ["5", "10", "20"];
const durationRange = $("#duration-range");
const durationValue = $("#duration-value");
const additionalOption = $("#additional-option");
const additionalOptions = $("#additional-options");

durationRange.addEventListener("input", () => {
  durationValue.textContent = `${durationValues[Number(durationRange.value)]}분`;
});

additionalOption.addEventListener("change", () => {
  additionalOptions.hidden = !additionalOption.checked;
  additionalOption.setAttribute("aria-expanded", String(additionalOption.checked));
  $$('input[name="additional-count"]').forEach(input => input.disabled = !additionalOption.checked);
});

function saveInspectionOptions() {
  formData.duration = durationValues[Number(durationRange.value)];
  formData.additional = additionalOption.checked;
  formData.additionalCount = $('input[name="additional-count"]:checked')?.value || "2";
}

function updateSummary() {
  const values = {
    "#summary-inspector": formData.inspector,
    "#summary-name": formData.name,
    "#summary-location": formData.location,
    "#summary-type": formData.type,
    "#summary-duration": `${formData.duration}분`,
    "#summary-additional": formData.additional ? `${formData.additionalCount}개 항목 포함` : "미포함"
  };
  Object.entries(values).forEach(([selector, value]) => $(selector).textContent = value);
}

$("#option-prev").addEventListener("click", () => showStep(0));
$("#option-next").addEventListener("click", () => {
  saveInspectionOptions();
  updateSummary();
  showStep(2);
});
$("#summary-prev").addEventListener("click", () => showStep(1));
$("#summary-next").addEventListener("click", () => {
  if (!validateEquipment()) {
    showStep(0);
    return;
  }
  saveInspectionOptions();
  updateSummary();
  showStep(3);
});

const diagnosisInputs = $$('input[name="power-status"], input[name="link-status"], input[name="alarm-status"]');
const diagnosisResult = $("#diagnosis-result");
const diagnosisError = $("#diagnosis-error");

function selectedStatus(name) {
  return $(`input[name="${name}"]:checked`)?.value || "";
}

function validateDiagnosis() {
  formData.power = selectedStatus("power-status");
  formData.link = selectedStatus("link-status");
  formData.alarm = selectedStatus("alarm-status");
  const valid = Boolean(formData.power && formData.link && formData.alarm);
  diagnosisError.textContent = valid ? "" : "전원, 링크, 알람 상태를 모두 선택해 주세요.";
  return valid;
}

function analyzeEquipment() {
  const { power, link, alarm } = formData;
  if (power === "abnormal" || link === "down" || alarm === "critical") {
    formData.status = "점검 필요";
    formData.message = "장비 상태에 이상이 확인되었습니다. 원인을 확인하고 후속 점검을 진행해 주세요.";
  } else if (alarm === "minor") {
    formData.status = "주의";
    formData.message = "경미한 알람이 확인되었습니다. 알람 원인과 장비 상태를 추가로 확인해 주세요.";
  } else {
    formData.status = "정상";
    formData.message = "입력한 점검 항목에서 이상이 확인되지 않았습니다.";
  }

  formData.actions = [];
  if (power === "abnormal") formData.actions.push("전원 공급 상태와 전원 케이블 및 전원 장치를 확인하세요.");
  if (link === "down") formData.actions.push("점검 대상 포트의 사용 여부와 광케이블, 연결 상태를 확인하세요.");
  if (alarm === "critical") formData.actions.push("중대 알람의 종류와 발생 시각을 확인하고 장애 대응 절차를 진행하세요.");
  if (alarm === "minor") formData.actions.push("경미한 알람의 발생 원인과 지속 여부를 확인하세요.");
  if (formData.status === "정상") formData.actions.push("현재 점검 상태를 기록하고 정기 점검을 유지하세요.");
  if (formData.status === "주의") formData.actions.push("알람 발생 이력을 확인하고 상태 변화를 관찰하세요.");
  if (formData.status === "점검 필요") formData.actions.push("필요한 경우 담당자에게 보고하고 조치 후 상태를 다시 확인하세요.");
}

function displayDiagnosis() {
  const status = $("#diagnosis-status");
  status.textContent = formData.status;
  status.classList.remove("status-normal", "status-warning", "status-critical");
  status.classList.add(statusClass(formData.status));
  $("#diagnosis-message").textContent = formData.message;
  const list = $("#diagnosis-actions");
  list.replaceChildren();
  formData.actions.forEach(action => list.append(makeElement("li", "", action)));
  diagnosisResult.hidden = false;
  diagnosisResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("#diagnosis-button").addEventListener("click", () => {
  if (!validateDiagnosis()) {
    diagnosisResult.hidden = true;
    const firstUnchecked = ["power-status", "link-status", "alarm-status"]
      .find(name => !selectedStatus(name));
    if (firstUnchecked) $(`input[name="${firstUnchecked}"]`)?.focus();
    return;
  }
  analyzeEquipment();
  displayDiagnosis();
});

diagnosisInputs.forEach(input => input.addEventListener("change", () => {
  diagnosisError.textContent = "";
  diagnosisResult.hidden = true;
  formData.status = "";
}));

$("#diagnosis-prev").addEventListener("click", () => {
  diagnosisResult.hidden = true;
  showStep(2);
});

function resetDiagnosis() {
  diagnosisInputs.forEach(input => input.checked = false);
  diagnosisError.textContent = "";
  diagnosisResult.hidden = true;
  $("#diagnosis-status").textContent = "";
  $("#diagnosis-message").textContent = "";
  $("#diagnosis-actions").replaceChildren();
  Object.assign(formData, { power: "", link: "", alarm: "", status: "", message: "", actions: [] });
}

$("#diagnosis-reset").addEventListener("click", () => {
  resetDiagnosis();
  diagnosisInputs[0].focus();
});

function displayComplete() {
  $("#complete-name").textContent = formData.name;
  $("#complete-type").textContent = formData.type;
  $("#complete-inspector").textContent = formData.inspector;
  const status = $("#complete-status");
  status.textContent = formData.status;
  status.className = statusClass(formData.status);
  const message = $("#complete-message");
  message.replaceChildren();
  message.append(makeElement("p", "", formData.message));
  message.append(makeElement("h4", "", "권장 점검 사항"));
  const list = makeElement("ul", "", "");
  formData.actions.forEach(action => list.append(makeElement("li", "", action)));
  message.append(list);
}

$("#diagnosis-finish").addEventListener("click", () => {
  if (!formData.status || diagnosisResult.hidden) {
    diagnosisError.textContent = "장비 상태를 먼저 분석해 주세요.";
    return;
  }
  displayComplete();
  showStep(4);
});

const saveInspectionButton = $("#save-inspection");
const saveStatus = $("#save-status");

function resetInspection() {
  Object.assign(formData, {
    inspector: nicknameInput.value.trim(), name: "", location: "", type: "",
    duration: "10", additional: false, additionalCount: "2"
  });
  equipmentName.value = "";
  equipmentLocation.value = "";
  equipmentType.value = "";
  [equipmentName, equipmentLocation, equipmentType].forEach(input => setInputError(input, ""));
  durationRange.value = "1";
  durationValue.textContent = "10분";
  additionalOption.checked = false;
  additionalOptions.hidden = true;
  additionalOption.setAttribute("aria-expanded", "false");
  $$('input[name="additional-count"]').forEach(input => {
    input.checked = input.value === "2";
    input.disabled = true;
  });
  resetDiagnosis();
  ["#summary-inspector", "#summary-name", "#summary-location", "#summary-type",
    "#summary-duration", "#summary-additional", "#complete-name", "#complete-type",
    "#complete-inspector", "#complete-status"].forEach(selector => $(selector).textContent = "");
  $("#complete-message").replaceChildren();
  savedInspectionId = null;
  saveInspectionButton.disabled = false;
  saveInspectionButton.textContent = "점검 결과 저장하기";
  saveStatus.textContent = "";
  saveStatus.classList.remove("is-success", "has-error");
  showStep(0);
  equipmentName.focus();
}

$("#restart-button").addEventListener("click", resetInspection);

const inspectionList = $("#inspection-list");
const emptyState = $("#empty-state");
const archiveCount = $("#archive-count");
const archiveStatus = $("#archive-status");
const recordDialog = $("#record-dialog");
const filterButtons = $$(".filter-button");

function visibleRecords() {
  const statuses = { normal: "정상", warning: "주의", critical: "점검 필요" };
  return records.filter(record => currentFilter === "all" || record.status === statuses[currentFilter]);
}

function renderRecords() {
  const visible = visibleRecords();
  inspectionList.replaceChildren();
  inspectionList.hidden = visible.length === 0;
  emptyState.hidden = visible.length !== 0;
  archiveCount.textContent = `현재 표시 중인 점검 기록 ${visible.length}건 (전체 ${records.length}건)`;

  if (!visible.length) {
    emptyState.querySelector("h3").textContent = records.length
      ? "선택한 조건에 맞는 점검 기록이 없습니다." : "아직 저장한 점검 기록이 없습니다.";
    emptyState.querySelector("p").textContent = records.length
      ? "다른 상태 필터를 선택하거나 전체 기록을 확인해 주세요."
      : "장비 점검을 완료하고 결과를 저장하면 이곳에서 확인할 수 있습니다.";
    const emptyAction = emptyState.querySelector("a");
    emptyAction.hidden = false;
    const filtered = currentFilter !== "all";
    emptyAction.textContent = filtered ? "전체 보기" : "장비 점검 시작하기";
    emptyAction.href = filtered ? "#archive" : "#inspection-setup";
  }

  visible.forEach(record => {
    const card = makeElement("li", `inspection-card${record.cancelled ? " is-cancelled" : ""}`, "");
    const top = makeElement("div", "record-card-top", "");
    top.append(makeElement("span", `record-state ${statusClass(record.status)}`, record.status));
    const date = makeElement("time", "record-date", formatDate(record.createdAt));
    date.dateTime = record.createdAt;
    top.append(date);
    card.append(top);
    card.append(makeElement("h3", "", record.name));
    card.append(makeElement("p", "", `${record.type} · ${record.location}`));
    card.append(makeElement("p", "", `담당자: ${record.inspector} · ${record.cancelled ? "취소된 기록" : "저장된 기록"}`));

    const actions = makeElement("div", "record-actions", "");
    const open = makeElement("button", "", "상세 보기");
    const toggle = makeElement("button", "", record.cancelled ? "취소 되돌리기" : "기록 취소하기");
    [open, toggle].forEach(button => {
      button.type = "button";
      button.dataset.id = record.id;
    });
    open.dataset.action = "open";
    toggle.dataset.action = "toggle";
    actions.append(open, toggle);
    card.append(actions);
    inspectionList.append(card);
  });
}

function saveInspection() {
  if (!formData.status || flowSteps[4].hidden) {
    saveStatus.textContent = "점검 결과를 먼저 확정해 주세요.";
    saveStatus.classList.add("has-error");
    return;
  }
  if (savedInspectionId) return;

  const record = {
    ...formData, actions: [...formData.actions],
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    cancelled: false, createdAt: new Date().toISOString()
  };

  records.unshift(record);
  if (!saveRecords()) {
    records.shift();
    saveStatus.textContent = "저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.";
    saveStatus.classList.add("has-error");
    return;
  }
  savedInspectionId = record.id;
  saveInspectionButton.disabled = true;
  saveInspectionButton.textContent = "저장 완료";
  saveStatus.textContent = `‘${record.name}’ 점검 결과를 저장했습니다.`;
  saveStatus.classList.remove("has-error");
  saveStatus.classList.add("is-success");
  archiveStatus.textContent = `‘${record.name}’ 점검 기록이 추가되었습니다.`;
  renderRecords();
}

saveInspectionButton.addEventListener("click", saveInspection);

function openRecord(record) {
  const values = {
    "#record-name": record.name,
    "#record-location": record.location,
    "#record-type": record.type,
    "#record-inspector": record.inspector,
    "#record-duration": `${record.duration}분`,
    "#record-additional": record.additional ? `${record.additionalCount}개 항목 포함` : "미포함",
    "#record-power": record.power === "normal" ? "정상" : "이상",
    "#record-link": record.link === "up" ? "UP" : "DOWN",
    "#record-alarm": { none: "알람 없음", minor: "경미한 알람 (Minor)", critical: "중대 알람 (Critical)" }[record.alarm] || "미확인",
    "#record-result": record.status,
    "#record-date": formatDate(record.createdAt)
  };
  Object.entries(values).forEach(([selector, value]) => $(selector).textContent = value);
  $("#record-dialog-status").textContent = `${record.cancelled ? "취소된 기록" : "저장된 기록"} · ${record.message}`;
  const actions = $("#record-actions");
  actions.replaceChildren();
  (record.actions || []).forEach(action => actions.append(makeElement("li", "", action)));
  recordDialog.showModal();
}

inspectionList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button || !inspectionList.contains(button)) return;
  const record = records.find(item => item.id === button.dataset.id);
  if (!record) return;
  if (button.dataset.action === "open") return openRecord(record);
  if (button.dataset.action !== "toggle") return;

  const previous = record.cancelled;
  record.cancelled = !previous;
  if (!saveRecords()) {
    record.cancelled = previous;
    archiveStatus.textContent = "기록 상태를 저장하지 못했습니다.";
    return;
  }
  archiveStatus.textContent = `‘${record.name}’ 기록을 ${previous ? "복원했습니다" : "취소했습니다"}.`;
  renderRecords();
  const nextButton = $$('#inspection-list button[data-action="toggle"]')
    .find(item => item.dataset.id === record.id);
  const selectedFilter = $('.filter-button[aria-pressed="true"]');
  (nextButton || selectedFilter)?.focus();
});

$("#record-dialog-close").addEventListener("click", () => recordDialog.close());

filterButtons.forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderRecords();
  const count = visibleRecords().length;
  const filterName = button.textContent.trim();
  archiveStatus.textContent = count > 0
    ? `${filterName} 점검 기록 ${count}건이 표시됩니다.`
    : `${filterName} 점검 기록이 없습니다. 다른 조건을 선택해 보세요.`;
}));

emptyState.querySelector("a").addEventListener("click", event => {
  if (currentFilter === "all") return;
  event.preventDefault();
  const allButton = $('.filter-button[data-filter="all"]');
  allButton.click();
  allButton.focus();
});

const menuToggle = $("#menu-toggle");
const mainNav = $("#main-nav");
const navLinks = $$('#main-nav a[href^="#"]');

function setMenuOpen(open) {
  mainNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "메뉴 닫기" : "메뉴 열기";
}

function updateCurrentNav() {
  const currentHash = window.location.hash;
  const activeLink = navLinks.find(link => link.getAttribute("href") === currentHash) || navLinks[0];
  navLinks.forEach(link => {
    const active = link === activeLink;
    link.classList.toggle("is-current", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  const currentLink = navLinks.find(link => link.getAttribute("aria-current") === "location");
  const pageName = currentLink ? currentLink.textContent.trim() : "홈";
  document.title = `${pageName} | ${serviceName}`;
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !mainNav.classList.contains("is-open")) return;
  setMenuOpen(false);
  menuToggle.focus();
});

navLinks.forEach(link => link.addEventListener("click", () => {
  setMenuOpen(false);
  requestAnimationFrame(updateCurrentNav);
}));

window.addEventListener("hashchange", updateCurrentNav);
window.addEventListener("popstate", updateCurrentNav);
window.addEventListener("pageshow", updateCurrentNav);

const mobileQuery = window.matchMedia("(max-width: 768px)");
function syncMenu() { if (!mobileQuery.matches) setMenuOpen(false); }
if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", syncMenu);
else mobileQuery.addListener(syncMenu);

updateNickname();
updateAgreement();
additionalOptions.hidden = !additionalOption.checked;
additionalOption.setAttribute("aria-expanded", String(additionalOption.checked));
$$('input[name="additional-count"]').forEach(input => input.disabled = !additionalOption.checked);
durationValue.textContent = `${durationValues[Number(durationRange.value)]}분`;
showStep(0);
inspectionFlow.hidden = true;
renderRecords();
updateCurrentNav();
syncMenu();
