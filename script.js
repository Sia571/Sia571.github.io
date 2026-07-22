const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");

const aiCase = document.getElementById("case-ai");
const medicalCase = document.getElementById("case-medical");
if (aiCase && medicalCase) medicalCase.before(aiCase);

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation?.classList.toggle("is-open", !isOpen);
});

navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMenu();
});

const courseworkItems = [...document.querySelectorAll("[data-coursework-item]")];

courseworkItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    courseworkItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

const processField = document.querySelector("[data-process-field]");
const processButtons = [...document.querySelectorAll("[data-process-stage]")];
const processDescription = document.querySelector("#process-description");
const processIndex = document.querySelector("[data-process-index]");

const stageCopy = {
  raw: "先完整看见杂乱、重复、表达不一的问题。",
  distill: "去重并归并表达不同、但关注点相近的问题。",
  index: "按产品线建立 11 类 FAQ 资料结构。",
  reuse: "配合医学团队统一专业答复，并支持后续回应。"
};

function seededValue(index, salt) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

if (processField) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 165; index += 1) {
    const mark = document.createElement("i");
    mark.style.setProperty("--x", `${(seededValue(index, 1) * 94 + 2).toFixed(2)}%`);
    mark.style.setProperty("--y", `${(seededValue(index, 2) * 84 + 7).toFixed(2)}%`);
    mark.style.setProperty("--r", `${(seededValue(index, 3) * 42 - 21).toFixed(2)}deg`);
    mark.style.setProperty("--w", `${(seededValue(index, 4) * 22 + 6).toFixed(2)}px`);
    fragment.append(mark);
  }

  processField.append(fragment);
}

function setProcessStage(stage, selectedButton) {
  if (!processField || !stageCopy[stage]) return;

  processField.dataset.stage = stage;
  processButtons.forEach((button) => button.setAttribute("aria-selected", String(button === selectedButton)));

  const index = processButtons.indexOf(selectedButton);
  if (processIndex && index >= 0) processIndex.textContent = String(index + 1).padStart(2, "0");
  if (processDescription) processDescription.textContent = stageCopy[stage];
}

processButtons.forEach((button, index) => {
  button.addEventListener("click", () => setProcessStage(button.dataset.processStage, button));

  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const nextButton = processButtons[(index + direction + processButtons.length) % processButtons.length];
    nextButton.focus();
    nextButton.click();
  });
});

const caseToggles = [...document.querySelectorAll("[data-case-toggle]")];
const caseTriggers = [...document.querySelectorAll("[data-case-trigger]")];
const caseCloseButtons = [...document.querySelectorAll("[data-case-close]")];
const readerLinks = [...document.querySelectorAll("[data-reader-id]")];
const readCount = document.querySelector("[data-read-count]");
const readerStorageKey = "sia-portfolio-read-v2";
let visitedReaders = new Set();

try {
  visitedReaders = new Set(JSON.parse(window.localStorage.getItem(readerStorageKey) || "[]"));
} catch (_error) {
  visitedReaders = new Set();
}

function saveReaderState() {
  try {
    window.localStorage.setItem(readerStorageKey, JSON.stringify([...visitedReaders]));
  } catch (_error) {
    // The page still works if storage is unavailable (for example in strict privacy mode).
  }
}

function renderReaderState() {
  readerLinks.forEach((link) => {
    const readerId = link.dataset.readerId;
    const isVisited = readerId && visitedReaders.has(readerId);
    const isActive = link.classList.contains("is-active");
    const label = link.querySelector("[data-reader-label]");
    const arrow = link.querySelector("[data-reader-arrow]");

    link.classList.toggle("is-visited", Boolean(isVisited));
    if (label) label.textContent = isVisited ? "已访问 · 再看" : "快速跳转";
    if (arrow) arrow.textContent = isVisited ? "↺" : "↓";
  });

  if (readCount) {
    const ids = new Set(readerLinks.map((link) => link.dataset.readerId).filter(Boolean));
    readCount.textContent = String([...ids].filter((id) => visitedReaders.has(id)).length);
  }
}

function markReaderVisited(readerId) {
  if (!readerId) return;
  visitedReaders.add(readerId);
  saveReaderState();
  renderReaderState();
}

function getCaseParts(caseId) {
  const article = document.getElementById(caseId);
  const toggle = document.querySelector(`[data-case-toggle="${caseId}"]`);
  const panel = document.getElementById(`${caseId}-panel`);
  return { article, toggle, panel };
}

function setCaseState(caseId, shouldOpen, options = {}) {
  const { article, toggle, panel } = getCaseParts(caseId);
  if (!article || !toggle || !panel) return;

  if (shouldOpen && options.closeOthers !== false) {
    caseToggles.forEach((otherToggle) => {
      const otherId = otherToggle.dataset.caseToggle;
      if (otherId && otherId !== caseId) setCaseState(otherId, false, { closeOthers: false });
    });
  }

  toggle.setAttribute("aria-expanded", String(shouldOpen));
  toggle.querySelector("span").textContent = shouldOpen ? "收起案例" : "展开案例";
  panel.hidden = !shouldOpen;
  article.classList.toggle("is-open", shouldOpen);

  caseTriggers
    .filter((trigger) => trigger.dataset.caseTrigger === caseId)
    .forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(shouldOpen));
      trigger.classList.toggle("is-active", shouldOpen);
    });

  renderReaderState();

  if (options.scrollToCase) {
    window.requestAnimationFrame(() => article.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
}

caseToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const caseId = toggle.dataset.caseToggle;
    if (!caseId) return;
    const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";
    if (shouldOpen) markReaderVisited("work");
    setCaseState(caseId, shouldOpen);
  });
});

caseTriggers.forEach((trigger) => {
  const caseId = trigger.dataset.caseTrigger;
  if (caseId) {
    trigger.setAttribute("aria-controls", `${caseId}-panel`);
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("click", (event) => {
    if (!caseId) return;
    event.preventDefault();
    markReaderVisited(trigger.dataset.readerId || "work");
    setCaseState(caseId, true, { scrollToCase: true });
    history.replaceState(null, "", `#${caseId}`);
  });
});

document.querySelectorAll("[data-section-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const targetId = trigger.dataset.sectionTrigger;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;
    event.preventDefault();
    markReaderVisited(trigger.dataset.readerId || targetId);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${targetId}`);
  });
});

document.querySelectorAll("[data-details-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const targetId = trigger.dataset.detailsTrigger;
    const target = targetId ? document.getElementById(targetId) : null;
    const details = target?.querySelector("details");
    if (!target || !details) return;
    event.preventDefault();
    markReaderVisited(trigger.dataset.readerId || targetId);
    details.open = true;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${targetId}`);
  });
});

caseCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const caseId = button.dataset.caseClose;
    if (!caseId) return;
    setCaseState(caseId, false, { closeOthers: false });
    document.getElementById(caseId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${caseId}`);
  });
});

const surpriseCopy = document.querySelector("[data-surprise-copy]");
const surpriseButton = document.querySelector("[data-surprise-button]");
const surpriseIndex = document.querySelector("[data-surprise-index]");
const surpriseNotes = [
  "第一次参加一整天的全英学术会议，结束时我的脑子像刚跑完一场半马。",
  "佛罗伦萨飞伦敦的航班取消后，我临时改道米兰和里斯本，最后还追回了 250 欧元补偿。",
  "第一次直播时，我以为妈妈只是来捧在线人数；她却真的下单了，因为办公用品刚好用得上。",
  "我花在删掉 AI 套话上的时间，有时比让它生成初稿还久。",
  "我可以公开超过 100 斤的长期改变，但现在的体重不公开——这是我的小秘密。"
];
let currentSurprise = 0;

surpriseButton?.addEventListener("click", () => {
  if (!surpriseCopy) return;
  let next = currentSurprise;
  while (next === currentSurprise) next = Math.floor(Math.random() * surpriseNotes.length);

  surpriseCopy.classList.add("is-changing");
  window.setTimeout(() => {
    currentSurprise = next;
    surpriseCopy.textContent = surpriseNotes[currentSurprise];
    if (surpriseIndex) surpriseIndex.textContent = String(currentSurprise + 1).padStart(2, "0");
    surpriseCopy.classList.remove("is-changing");
  }, 130);
});

const initialCaseId = window.location.hash.slice(1);
if (["case-ai", "case-medical", "case-tob", "case-partner"].includes(initialCaseId)) {
  markReaderVisited("work");
  setCaseState(initialCaseId, true, { closeOthers: false });
}

if (initialCaseId === "myself") {
  const personalDetails = document.querySelector("#myself details");
  if (personalDetails) personalDetails.open = true;
}

renderReaderState();

const guestbookForm = document.querySelector("[data-guestbook-form]");
const messageDialog = document.querySelector("[data-message-dialog]");
const messageList = document.querySelector("[data-message-list]");
const messageEmpty = document.querySelector("[data-message-empty]");
const messageCount = document.querySelector("[data-message-count]");
const guestbookStatus = document.querySelector("[data-guestbook-status]");
const guestbookNote = document.querySelector("[data-guestbook-note]");
const openMessagesButtons = [...document.querySelectorAll("[data-open-messages]")];
const closeMessagesButton = document.querySelector("[data-close-messages]");
const guestbookSubmitButton = guestbookForm?.querySelector('button[type="submit"]');
const messageStageCopy = document.querySelector("[data-message-stage-copy]");
const messageStageName = document.querySelector("[data-message-stage-name]");
const messageStageTime = document.querySelector("[data-message-stage-time]");
const guestbookStorageKey = "sia-portfolio-guestbook-v1";
const guestbookCooldownKey = "sia-portfolio-guestbook-last-submit";
const guestbookConfig = window.SIA_GUESTBOOK_CONFIG || {};
const guestbookTable = guestbookConfig.table || "guestbook_messages";
const hasCloudGuestbook = Boolean(
  /^https:\/\/.+\.supabase\.co\/?$/i.test(guestbookConfig.supabaseUrl || "") &&
    guestbookConfig.supabasePublishableKey
);
let guestbookMessages = [];
let featuredMessageIndex = 0;
let guestbookRotationTimer = 0;

function getLocalGuestbookMessages() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(guestbookStorageKey) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (_error) {
    return [];
  }
}

function saveLocalGuestbookMessages(messages) {
  try {
    window.localStorage.setItem(guestbookStorageKey, JSON.stringify(messages.slice(-30)));
    return true;
  } catch (_error) {
    return false;
  }
}

function normalizeGuestbookMessage(entry) {
  return {
    id: entry.id || "",
    name: entry.name || "一位路过的读者",
    message: entry.message || "",
    createdAt: entry.created_at || entry.createdAt || new Date().toISOString()
  };
}

function getCloudHeaders(extraHeaders = {}) {
  const headers = {
    apikey: guestbookConfig.supabasePublishableKey,
    ...extraHeaders
  };

  // Legacy anon keys are JWTs and may also be accepted as bearer tokens.
  if ((guestbookConfig.supabasePublishableKey || "").split(".").length === 3) {
    headers.Authorization = `Bearer ${guestbookConfig.supabasePublishableKey}`;
  }
  return headers;
}

function getGuestbookEndpoint(query = "") {
  const base = String(guestbookConfig.supabaseUrl || "").replace(/\/$/, "");
  return `${base}/rest/v1/${guestbookTable}${query}`;
}

function formatMessageDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderFeaturedMessage() {
  window.clearInterval(guestbookRotationTimer);
  if (!guestbookMessages.length) {
    if (messageStageCopy) messageStageCopy.textContent = "留言簿还在等第一句话。";
    if (messageStageName) messageStageName.textContent = "Sia 的访客";
    if (messageStageTime) messageStageTime.textContent = "";
    return;
  }

  featuredMessageIndex %= guestbookMessages.length;
  const entry = guestbookMessages[featuredMessageIndex];
  if (messageStageCopy) messageStageCopy.textContent = entry.message;
  if (messageStageName) messageStageName.textContent = entry.name;
  if (messageStageTime) {
    messageStageTime.dateTime = entry.createdAt;
    messageStageTime.textContent = formatMessageDate(entry.createdAt);
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (guestbookMessages.length > 1 && !reduceMotion) {
    guestbookRotationTimer = window.setInterval(() => {
      featuredMessageIndex = (featuredMessageIndex + 1) % guestbookMessages.length;
      const nextEntry = guestbookMessages[featuredMessageIndex];
      if (messageStageCopy) messageStageCopy.textContent = nextEntry.message;
      if (messageStageName) messageStageName.textContent = nextEntry.name;
      if (messageStageTime) {
        messageStageTime.dateTime = nextEntry.createdAt;
        messageStageTime.textContent = formatMessageDate(nextEntry.createdAt);
      }
    }, 5600);
  }
}

function renderGuestbookMessages() {
  const messages = guestbookMessages.slice();
  if (messageCount) messageCount.textContent = String(messages.length);
  if (messageEmpty) messageEmpty.hidden = messages.length > 0;
  renderFeaturedMessage();
  if (!messageList) return;

  messageList.replaceChildren();
  messages.forEach((entry, index) => {
    const article = document.createElement("article");
    const meta = document.createElement("p");
    const name = document.createElement("strong");
    const time = document.createElement("time");
    const copy = document.createElement("p");

    name.textContent = entry.name || "一位路过的读者";
    time.dateTime = entry.createdAt || "";
    time.textContent = formatMessageDate(entry.createdAt);
    meta.append(name, time);
    copy.textContent = entry.message || "";
    article.style.setProperty("--note-index", String(index + 1));
    article.append(meta, copy);
    messageList.append(article);
  });
}

async function loadGuestbookMessages({ announce = false } = {}) {
  if (!hasCloudGuestbook) {
    guestbookMessages = getLocalGuestbookMessages().map(normalizeGuestbookMessage).reverse();
    renderGuestbookMessages();
    if (guestbookNote) {
      guestbookNote.textContent = "本地预览模式：留言只保存在当前浏览器。完成发布配置后，会自动切换为共享留言簿。";
    }
    return;
  }

  if (guestbookNote) {
    guestbookNote.textContent = "这是一本公开留言簿。提交后，你的称呼和留言会先由 Sia 确认，随后可能展示给下一位路过这里的人并长期保留；请勿填写联系方式或敏感信息。如需撤回，可通过页面邮箱联系我。";
  }

  try {
    const query = "?select=id,name,message,created_at&is_visible=eq.true&order=created_at.desc&limit=30";
    const response = await fetch(getGuestbookEndpoint(query), {
      headers: getCloudHeaders({ Accept: "application/json" })
    });
    if (!response.ok) throw new Error(`Guestbook read failed: ${response.status}`);
    const data = await response.json();
    guestbookMessages = Array.isArray(data) ? data.map(normalizeGuestbookMessage) : [];
    renderGuestbookMessages();
    if (announce && guestbookStatus) guestbookStatus.textContent = "留言簿已刷新。";
  } catch (error) {
    console.error(error);
    guestbookMessages = [];
    renderGuestbookMessages();
    if (guestbookStatus) guestbookStatus.textContent = "留言簿暂时没有连接上，请稍后再试。";
  }
}

async function openMessageDialog() {
  if (hasCloudGuestbook) await loadGuestbookMessages();
  if (!messageDialog) return;
  if (typeof messageDialog.showModal === "function") messageDialog.showModal();
  else messageDialog.setAttribute("open", "");
}

openMessagesButtons.forEach((button) => button.addEventListener("click", openMessageDialog));
closeMessagesButton?.addEventListener("click", () => {
  if (typeof messageDialog?.close === "function") messageDialog.close();
  else messageDialog?.removeAttribute("open");
});

messageDialog?.addEventListener("click", (event) => {
  if (event.target === messageDialog && typeof messageDialog.close === "function") messageDialog.close();
});

guestbookForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(guestbookForm);
  if (String(formData.get("website") || "").trim()) {
    guestbookForm.reset();
    return;
  }
  const name = String(formData.get("guestName") || "").trim() || "一位路过的读者";
  const message = String(formData.get("guestMessage") || "").trim();
  if (!message) return;

  if (!hasCloudGuestbook) {
    const messages = getLocalGuestbookMessages();
    messages.push({ name: name.slice(0, 24), message: message.slice(0, 240), createdAt: new Date().toISOString() });
    const saved = saveLocalGuestbookMessages(messages);
    if (guestbookStatus) {
      guestbookStatus.textContent = saved
        ? "已放进这台设备的留言簿。弹窗已经为你打开。"
        : "浏览器没有允许本地保存，但你仍可以复制这句话发送给我。";
    }
    if (saved) guestbookForm.reset();
    await loadGuestbookMessages();
    openMessageDialog();
    return;
  }

  const lastSubmit = Number(window.localStorage.getItem(guestbookCooldownKey) || 0);
  const secondsSinceLastSubmit = (Date.now() - lastSubmit) / 1000;
  if (secondsSinceLastSubmit < 30) {
    if (guestbookStatus) guestbookStatus.textContent = `请稍等 ${Math.ceil(30 - secondsSinceLastSubmit)} 秒再留下一句。`;
    return;
  }

  if (guestbookSubmitButton) guestbookSubmitButton.disabled = true;
  if (guestbookStatus) guestbookStatus.textContent = "正在把这句话送进留言簿……";

  try {
    const response = await fetch(getGuestbookEndpoint(), {
      method: "POST",
      headers: getCloudHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }),
      body: JSON.stringify({
        name: name.slice(0, 24),
        message: message.slice(0, 240)
      })
    });
    if (!response.ok) throw new Error(`Guestbook write failed: ${response.status}`);
    window.localStorage.setItem(guestbookCooldownKey, String(Date.now()));
    guestbookForm.reset();
    if (guestbookStatus) guestbookStatus.textContent = "收到啦。Sia 简单确认后，这句话就会出现在公开留言簿里。";
  } catch (error) {
    console.error(error);
    if (guestbookStatus) guestbookStatus.textContent = "这句话暂时没有送达，请稍后再试，或直接给我发邮件。";
  } finally {
    if (guestbookSubmitButton) guestbookSubmitButton.disabled = false;
  }
});

loadGuestbookMessages();

const routeLinks = [...document.querySelectorAll("[data-route-link]")];
const routeTargets = routeLinks
  .map((link) => ({ link, target: document.getElementById(link.dataset.routeLink) }))
  .filter((item) => item.target);
let currentRouteId = "";
let routeFrame = 0;

function updateReadingRoute() {
  routeFrame = 0;
  const readingLine = window.scrollY + window.innerHeight * 0.32;
  let current = routeTargets[0];

  routeTargets.forEach((item) => {
    const top = item.target.getBoundingClientRect().top + window.scrollY;
    if (top <= readingLine) current = item;
  });

  const nextRouteId = current?.link.dataset.routeLink || "";
  if (nextRouteId && nextRouteId !== currentRouteId) {
    currentRouteId = nextRouteId;
    routeLinks.forEach((link) => {
      const isCurrent = link.dataset.routeLink === currentRouteId;
      link.classList.toggle("is-current", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (readerLinks.some((link) => link.dataset.readerId === currentRouteId)) {
      markReaderVisited(currentRouteId);
    }
  }
}

function requestRouteUpdate() {
  if (routeFrame) return;
  routeFrame = window.requestAnimationFrame(updateReadingRoute);
}

routeLinks.forEach((link) => {
  link.addEventListener("click", () => {
    currentRouteId = link.dataset.routeLink || "";
    routeLinks.forEach((item) => item.classList.toggle("is-current", item === link));
  });
});

window.addEventListener("scroll", requestRouteUpdate, { passive: true });
window.addEventListener("resize", requestRouteUpdate);
updateReadingRoute();

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
