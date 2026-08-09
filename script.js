"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuToggle?.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  siteNav?.classList.toggle("is-open", !expanded);
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  });
});

const routeLinks = [...document.querySelectorAll("[data-route-link]")];
const routeTargets = routeLinks
  .map((link) => ({ link, target: document.getElementById(link.dataset.routeLink) }))
  .filter((item) => item.target);

function updateRoute() {
  const line = window.scrollY + window.innerHeight * 0.34;
  let current = routeTargets[0];
  routeTargets.forEach((item) => {
    if (item.target.offsetTop <= line) current = item;
  });
  routeLinks.forEach((link) => {
    const active = link === current?.link;
    link.classList.toggle("is-current", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

let routeFrame = 0;
window.addEventListener("scroll", () => {
  if (routeFrame) return;
  routeFrame = window.requestAnimationFrame(() => {
    routeFrame = 0;
    updateRoute();
  });
}, { passive: true });
window.addEventListener("resize", updateRoute);
updateRoute();

const surpriseNotes = [
  "第一次参加一整天的全英学术会议，结束时脑子像跑完半马。",
  "佛罗伦萨航班取消后，我临时改道米兰和里斯本，后来还追回了250欧元补偿。",
  "第一次直播时，我以为妈妈只来捧在线人数；她却真的因为需要而下单。",
  "我花在删AI套话、核对参照系和补来源上的时间，有时比生成初稿还久。",
  "我公开100+斤的长期改变，但现在的体重保密——这是我的小秘密。",
];
const surpriseCard = document.querySelector("[data-surprise-card]");
const surpriseNumber = document.querySelector("[data-surprise-number]");
const surpriseCopy = document.querySelector("[data-surprise-copy]");
let surpriseIndex = 0;

surpriseCard?.addEventListener("click", () => {
  const nextOffset = Math.floor(Math.random() * (surpriseNotes.length - 1)) + 1;
  surpriseIndex = (surpriseIndex + nextOffset) % surpriseNotes.length;
  if (surpriseNumber) surpriseNumber.textContent = `${String(surpriseIndex + 1).padStart(2, "0")} / ${String(surpriseNotes.length).padStart(2, "0")}`;
  if (surpriseCopy) surpriseCopy.textContent = surpriseNotes[surpriseIndex];
  surpriseCard.animate?.(
    [{ transform: "rotate(-1deg) scale(.985)", opacity: .68 }, { transform: "rotate(1deg) scale(1)", opacity: 1 }],
    { duration: reduceMotion ? 1 : 260, easing: "ease-out" },
  );
});

function openDialog(dialog) {
  if (!dialog) return;
  dialog.scrollTop = 0;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  document.body.classList.add("dialog-open");
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
  if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open");
}

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open");
  });
});

const longformDialog = document.querySelector("[data-longform-dialog]");
const formatFrame = document.querySelector("[data-format-frame]");
const formatPictures = [...document.querySelectorAll("[data-format-picture]")];
const formatCaption = document.querySelector("[data-format-caption]");
const longformPictures = [...document.querySelectorAll("[data-longform-picture]")];
let currentLongformView = "current";
const longformViews = {
  earlier: {
    mobileAvifSrcset: "assets/optimized/cerave-longform-earlier-640.avif 640w",
    caption: "<span>EARLIER FORMAT</span>从指南和完整专业信息开始，适合系统阅读，但在社交信息流里需要读者先投入较多注意力。",
  },
  current: {
    mobileAvifSrcset: "assets/optimized/cerave-longform-640.avif 640w",
    caption: "<span>CURRENT APPROACH</span>从患者在门诊会怎么问开始，先建立共鸣，再解释研究设计、指标变化与日常沟通。",
  },
};

const mobileImageWarmers = new Set();
let mobileImageWarmupStarted = false;

function warmImageCandidate({ srcset, sizes = "100vw", priority = "auto" }) {
  if (!srcset) return;
  const image = new Image();
  const firstCandidate = srcset.split(",")[0]?.trim().split(/\s+/)[0];
  image.decoding = "async";
  image.fetchPriority = priority;
  image.sizes = sizes;
  image.srcset = srcset;
  if (firstCandidate) image.src = firstCandidate;
  const release = () => mobileImageWarmers.delete(image);
  image.addEventListener("load", release, { once: true });
  image.addEventListener("error", release, { once: true });
  mobileImageWarmers.add(image);
}

function warmMobileImageCache() {
  if (mobileImageWarmupStarted || !window.matchMedia("(max-width: 860px)").matches) return;
  mobileImageWarmupStarted = true;

  document.querySelectorAll('img[loading="lazy"]').forEach((image, index) => {
    image.loading = "eager";
    image.fetchPriority = index < 2 ? "high" : "auto";
  });

  const candidates = [
    { srcset: longformViews.current.mobileAvifSrcset, sizes: "100vw", priority: "high" },
    { srcset: longformViews.earlier.mobileAvifSrcset, sizes: "100vw", priority: "high" },
  ];

  document.querySelectorAll("picture").forEach((picture) => {
    const source = [...picture.querySelectorAll('source[type="image/avif"]')]
      .find((item) => !item.media || window.matchMedia(item.media).matches);
    const image = picture.querySelector("img");
    if (!source) return;
    if (!image || image.fetchPriority === "high") return;
    candidates.push({
      srcset: source.srcset,
      sizes: source.sizes || image.sizes || "100vw",
      priority: candidates.length < 4 ? "high" : "auto",
    });
  });

  const seen = new Set();
  candidates.forEach((candidate) => {
    const key = candidate.srcset;
    if (seen.has(key)) return;
    seen.add(key);
    warmImageCandidate(candidate);
  });
}

const leadImage = document.querySelector('img[fetchpriority="high"]');
const beginMobileImageWarmup = () => window.setTimeout(warmMobileImageCache, 0);
if (leadImage?.complete) beginMobileImageWarmup();
else leadImage?.addEventListener("load", beginMobileImageWarmup, { once: true });
window.addEventListener("load", beginMobileImageWarmup, { once: true });

function setLongformView(view) {
  const next = longformViews[view] || longformViews.current;
  currentLongformView = longformViews[view] ? view : "current";
  formatPictures.forEach((picture) => {
    const active = picture.dataset.formatPicture === currentLongformView;
    picture.hidden = !active;
    picture.setAttribute("aria-hidden", String(!active));
  });
  if (formatFrame) formatFrame.scrollTop = 0;
  if (formatCaption) formatCaption.innerHTML = next.caption;
  longformPictures.forEach((picture) => {
    const active = picture.dataset.longformPicture === currentLongformView;
    picture.hidden = !active;
    picture.setAttribute("aria-hidden", String(!active));
  });
  document.querySelectorAll("[data-format-view], [data-longform-view]").forEach((button) => {
    const active = button.dataset.formatView === currentLongformView || button.dataset.longformView === currentLongformView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

document.querySelectorAll("[data-format-view], [data-longform-view]").forEach((button) => {
  button.addEventListener("click", () => setLongformView(button.dataset.formatView || button.dataset.longformView));
});
document.querySelector("[data-open-longform]")?.addEventListener("click", () => {
  setLongformView(currentLongformView);
  openDialog(longformDialog);
});
document.querySelector("[data-close-longform]")?.addEventListener("click", () => closeDialog(longformDialog));

// Clinical Evidence Mini Lab: all data below is sourced from the independent public mini dataset.
const evidenceData = window.SIA_EVIDENCE_DATA || { studies: [], guidelines: [], glossary: [], questions: [] };
const labTabs = [...document.querySelectorAll("[data-lab-tab]")];
const labPanels = [...document.querySelectorAll("[data-lab-panel]")];
const modeButtons = [...document.querySelectorAll("[data-evidence-mode]")];
const compareTray = document.querySelector("[data-compare-tray]");
const compareCount = document.querySelector("[data-compare-count]");
const labToast = document.querySelector("[data-lab-toast]");
const evidenceDialog = document.querySelector("[data-evidence-dialog]");
const evidenceDialogContent = document.querySelector("[data-evidence-dialog-content]");
let evidenceMode = "full";
let activeLabTab = "studies";
let selectedEvidence = [];
let selectedKind = "";
let qaMode = "qa";
let faqExpanded = false;
let toastTimer = 0;

function allEvidence() {
  return [...evidenceData.studies, ...evidenceData.guidelines];
}

function findEvidence(id) {
  return allEvidence().find((item) => item.id === id);
}

function showToast(message) {
  if (!labToast) return;
  window.clearTimeout(toastTimer);
  labToast.textContent = message;
  toastTimer = window.setTimeout(() => { labToast.textContent = ""; }, 3200);
}

function setLabTab(tabName, { focus = false } = {}) {
  activeLabTab = tabName;
  labTabs.forEach((button) => {
    const active = button.dataset.labTab === tabName;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    if (active && focus) button.focus();
  });
  labPanels.forEach((panel) => { panel.hidden = panel.dataset.labPanel !== tabName; });
  renderActiveLabPanel();
}

labTabs.forEach((button) => button.addEventListener("click", () => {
  setLabTab(button.dataset.labTab);
  button.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
}));

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    evidenceMode = button.dataset.evidenceMode;
    modeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderActiveLabPanel();
  });
});

function evidenceFacts(item) {
  if (item.kind === "study") {
    return [
      `<span><b>人群</b>${item.population}</span>`,
      `<span><b>比较</b>${item.control}</span>`,
      `<span><b>周期</b>${item.duration}</span>`,
    ].join("");
  }
  return [
    `<span><b>类型</b>${item.badge}</span>`,
    `<span><b>人群</b>${item.population}</span>`,
    `<span><b>来源</b>${item.source}</span>`,
  ].join("");
}

function evidenceCard(item) {
  const selected = selectedEvidence.includes(item.id);
  const summary = evidenceMode === "quick"
    ? item.quick
    : item.kind === "study"
      ? `${item.design}。${item.intervention}；${item.control}。${item.endpoints}。`
      : `${item.focus}。${item.quick}`;
  return `
    <article class="evidence-card">
      <div class="evidence-card__meta"><span>${item.badge}</span><span>${item.year}</span></div>
      <h5>${item.title}</h5>
      <p class="evidence-card__summary">${summary}</p>
      <div class="evidence-card__signal">
        <span>${item.kind === "study" ? "一眼看结果" : "一眼看重点"}</span>
        <strong>${item.cardResult || item.quick}</strong>
        <small>${item.cardNote || ""}</small>
      </div>
      <div class="evidence-card__facts">${evidenceFacts(item)}</div>
      <p class="evidence-card__boundary"><strong>这项研究能说明什么：</strong>${item.boundary}</p>
      <div class="evidence-card__actions">
        <button type="button" data-view-evidence="${item.id}">${evidenceMode === "quick" ? "30秒读懂" : "展开完整证据"}</button>
        <button type="button" data-toggle-compare="${item.id}" class="${selected ? "is-selected" : ""}">${selected ? "已加入对比 ✓" : "加入对比"}</button>
      </div>
    </article>`;
}

function renderCards(kind) {
  const panel = document.querySelector(`[data-lab-panel="${kind}"]`);
  if (!panel) return;
  const items = kind === "studies" ? evidenceData.studies : evidenceData.guidelines;
  panel.innerHTML = `
    <div class="lab-panel__heading">
      <h5>${kind === "studies" ? "研究文献库" : "指南与综述"}</h5>
      <p>${kind === "studies" ? "两篇临床研究可以查看图表、数据与参照系，也可以加入同类对比。" : "当前收录一份指南和一份专家共识；可以比较它们的适用对象、关注层级与管理建议。"}</p>
    </div>
    <div class="evidence-card-grid">${items.map(evidenceCard).join("")}</div>`;
  panel.querySelectorAll("[data-view-evidence]").forEach((button) => {
    button.addEventListener("click", () => openEvidenceDetails(button.dataset.viewEvidence));
  });
  panel.querySelectorAll("[data-toggle-compare]").forEach((button) => {
    button.addEventListener("click", () => toggleCompare(button.dataset.toggleCompare));
  });
}

function toggleCompare(id) {
  const item = findEvidence(id);
  if (!item) return;
  if (selectedEvidence.includes(id)) {
    selectedEvidence = selectedEvidence.filter((selectedId) => selectedId !== id);
    if (!selectedEvidence.length) selectedKind = "";
  } else {
    if (selectedKind && selectedKind !== item.kind) {
      showToast("临床研究和指南不能放进同一张对比表。请先清空当前选择。");
      return;
    }
    if (selectedEvidence.length >= 2) {
      showToast("一次最多对比两份同类资料。先移除一项再添加。");
      return;
    }
    selectedKind = item.kind;
    selectedEvidence.push(id);
  }
  updateCompareTray();
  renderActiveLabPanel();
}

function updateCompareTray() {
  if (!compareTray || !compareCount) return;
  compareTray.hidden = selectedEvidence.length === 0;
  compareCount.textContent = String(selectedEvidence.length);
}

document.querySelector("[data-clear-compare]")?.addEventListener("click", () => {
  selectedEvidence = [];
  selectedKind = "";
  updateCompareTray();
  renderActiveLabPanel();
});

document.querySelectorAll("[data-open-compare]").forEach((button) => {
  button.addEventListener("click", () => {
    setLabTab("compare");
    document.querySelector("[data-lab-panel=\"compare\"]")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

function compareRows(items) {
  if (selectedKind === "study") {
    const rows = [
      ["资料", "title"], ["年份", "year"], ["研究问题", "researchQuestion"], ["资料载体", "documentType"],
      ["研究中心", "center"], ["样本量", "sampleSize"], ["研究人群", "population"], ["年龄", "age"],
      ["入选条件", "inclusion"], ["排除条件", "exclusion"], ["研究设计", "design"], ["盲法", "blind"],
      ["干预", "intervention"], ["对照", "control"], ["观察周期", "duration"], ["评估时间点", "timepoints"],
      ["主要终点", "endpoints"], ["一眼看结果", "cardResult"], ["完整结论", "quick"], ["安全性", "safety"],
      ["研究局限", "limitations"], ["结果适用范围", "boundary"], ["来源", "source"],
    ];
    return evidenceMode === "quick" ? rows.filter((_, index) => [0, 2, 5, 6, 10, 13, 14, 17, 21].includes(index)) : rows;
  }
  const rows = [
    ["资料", "title"], ["年份", "year"], ["文件类型", "documentType"], ["发布机构", "publisher"],
    ["适用对象", "population"], ["关注范围", "focus"], ["形成方式", "methodology"], ["基础护理", "basicCare"],
    ["患者教育", "patientEducation"], ["保湿剂角色", "moisturizerRole"], ["使用与治疗时机", "timing"], ["联合管理", "combinedTreatment"],
    ["长期管理", "longTerm"], ["证据与推荐", "evidenceGrade"], ["一眼看重点", "cardResult"], ["共同注意事项", "boundary"],
    ["仍需注意", "evidenceGaps"], ["来源", "source"],
  ];
  return evidenceMode === "quick" ? rows.filter((_, index) => [0, 2, 4, 5, 9, 12, 14, 15].includes(index)) : rows;
}

function renderCompare() {
  const panel = document.querySelector('[data-lab-panel="compare"]');
  if (!panel) return;
  const items = selectedEvidence.map(findEvidence).filter(Boolean);
  if (items.length < 2) {
    panel.innerHTML = `<div class="compare-empty"><h5>先选择两份同类资料</h5><p>研究文献与指南都可以加入对比，但两种类型不会混在同一张表里。当前已选择${items.length}项。</p><button type="button" class="button button--outline" data-compare-back>去选择资料</button></div>`;
    panel.querySelector("[data-compare-back]")?.addEventListener("click", () => setLabTab(selectedKind === "guideline" ? "guidelines" : "studies", { focus: true }));
    return;
  }
  const rows = compareRows(items);
  panel.innerHTML = `
    <div class="lab-panel__heading"><h5>${selectedKind === "study" ? "临床研究对比" : "指南 / 共识对比"}</h5><p>并列比较研究设计、适用对象，以及每项资料能回答什么问题；不进行跨研究疗效排名。</p></div>
    <div class="compare-table-wrap"><table class="compare-table"><tbody>
      ${rows.map(([label, key]) => `<tr><th>${label}</th>${items.map((item) => `<td>${item[key] || "—"}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div>`;
}

function renderGlossary() {
  const panel = document.querySelector('[data-lab-panel="glossary"]');
  if (!panel) return;
  panel.innerHTML = `
    <div class="lab-panel__heading"><h5>术语词典</h5><p>从TEWL到PASI：先弄清指标测量什么，再看它回答不了什么。</p></div>
    <input class="glossary-search" type="search" data-glossary-search placeholder="搜索：TEWL、基线、组间比较……" aria-label="搜索术语" />
    <div class="glossary-grid" data-glossary-grid>${glossaryMarkup(evidenceData.glossary)}</div>`;
  panel.querySelector("[data-glossary-search]")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const filtered = evidenceData.glossary.filter(([term, description]) => `${term} ${description}`.toLowerCase().includes(query));
    panel.querySelector("[data-glossary-grid]").innerHTML = glossaryMarkup(filtered);
  });
}

function glossaryMarkup(items) {
  if (!items.length) return '<article><h5>没有匹配项</h5><p>试试更短的关键词。</p></article>';
  return items.map(([term, description]) => {
    const displayDescription = evidenceMode === "quick" ? `${description.split(/[。；]/)[0]}。` : description;
    return `<article><h5>${term}</h5><p>${displayDescription}</p></article>`;
  }).join("");
}

function renderQA() {
  const panel = document.querySelector('[data-lab-panel="qa"]');
  if (!panel) return;
  const questions = faqExpanded ? evidenceData.questions : evidenceData.questions.slice(0, 6);
  panel.innerHTML = `
    <div class="lab-panel__heading"><h5>检索与问答</h5><p>自由输入，但回答范围只限于上面的四份资料。相近问法会匹配到预先核对的答案；超出范围时会明确停下。</p></div>
    <div class="qa-box">
      <div class="qa-mode" role="group" aria-label="检索模式"><button type="button" data-qa-mode="qa" class="${qaMode === "qa" ? "is-active" : ""}">问一个问题</button><button type="button" data-qa-mode="search" class="${qaMode === "search" ? "is-active" : ""}">检索资料</button></div>
      <form class="qa-form" data-qa-form><input type="search" name="query" placeholder="例如：TEWL20的22%下降是和谁比较？" aria-label="输入检索或问答内容" /><button type="submit">${qaMode === "qa" ? "提问" : "检索"}</button></form>
      <div class="qa-result" data-qa-result hidden></div>
      <div class="faq-list"><h5>常见问题</h5><div class="faq-buttons">${questions.map((item, index) => `<button type="button" data-faq-index="${evidenceData.questions.indexOf(item)}">${item.question}</button>`).join("")}</div><button type="button" class="faq-list__more" data-toggle-faq>${faqExpanded ? "收起部分问题" : `查看更多（共${evidenceData.questions.length}个）`}</button></div>
    </div>`;
  panel.querySelectorAll("[data-qa-mode]").forEach((button) => button.addEventListener("click", () => { qaMode = button.dataset.qaMode; renderQA(); }));
  panel.querySelector("[data-qa-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("query").trim();
    answerQuery(query);
  });
  panel.querySelectorAll("[data-faq-index]").forEach((button) => button.addEventListener("click", () => {
    const item = evidenceData.questions[Number(button.dataset.faqIndex)];
    const input = panel.querySelector("[name=query]");
    if (input) input.value = item.question;
    renderQAResult(item.question, item.answer, item.sources);
  }));
  panel.querySelector("[data-toggle-faq]")?.addEventListener("click", () => { faqExpanded = !faqExpanded; renderQA(); });
}

function scoreQuestion(query, item) {
  const normalized = query.toLowerCase();
  let score = 0;
  item.keywords.forEach((keyword) => { if (normalized.includes(keyword.toLowerCase())) score += keyword.length + 2; });
  item.question.split(/[，。？\s]/).filter((word) => word.length >= 2).forEach((word) => { if (normalized.includes(word.toLowerCase())) score += 1; });
  return score;
}

function answerQuery(query) {
  if (!query) return;
  if (qaMode === "search") {
    const matches = allEvidence().filter((item) => `${item.title} ${item.shortTitle} ${item.quick} ${item.boundary}`.toLowerCase().includes(query.toLowerCase()));
    if (matches.length) {
      renderQAResult(query, matches.map((item) => `<strong>${item.shortTitle}</strong>：${item.quick}`).join("<br><br>"), matches.map((item) => item.source));
    } else {
      renderQAResult(query, "这四份资料中没有找到直接匹配。可以换用更短的词，例如“TEWL”“第28天”“保湿剂”或“个体化”。", ["检索范围：四份公开资料"]);
    }
    return;
  }
  const ranked = evidenceData.questions.map((item) => ({ item, score: scoreQuestion(query, item) })).sort((a, b) => b.score - a.score);
  if (!ranked[0] || ranked[0].score < 2) {
    renderQAResult(query, "现有四份资料不足以可靠回答这个问题，也不能用于个体化诊断、治疗或产品推荐。你可以试试问研究人群、比较对象、时间点、TEWL，或指南与共识的差异。", ["本页四份公开资料"]);
    return;
  }
  renderQAResult(query, ranked[0].item.answer, ranked[0].item.sources);
}

function renderQAResult(question, answer, sources) {
  const result = document.querySelector("[data-qa-result]");
  if (!result) return;
  result.hidden = false;
  result.innerHTML = `<h5>${escapeHtml(question)}</h5><p>${answer}</p><small><strong>依据：</strong>${sources.join(" · ")}</small>`;
}

function renderActiveLabPanel() {
  if (activeLabTab === "studies" || activeLabTab === "guidelines") renderCards(activeLabTab);
  if (activeLabTab === "compare") renderCompare();
  if (activeLabTab === "glossary") renderGlossary();
  if (activeLabTab === "qa") renderQA();
}

function detailRow(label, value) {
  return `<div class="evidence-data-row"><dt>${label}</dt><dd>${value || "—"}</dd></div>`;
}

function evidenceSource(item) {
  return item.sourceUrl
    ? `<a class="source-link" href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">查看公开来源 ↗</a>`
    : `<p class="source-link">公开来源：${item.source}</p>`;
}

function renderStudyDetail(item) {
  const audienceRows = evidenceMode === "quick"
    ? [
      ["研究人群", item.population],
      ["样本", item.sampleSize],
      ["入选条件", item.inclusion],
    ]
    : [
      ["研究人群", item.population],
      ["样本与分组", item.sampleSize],
      ["完成情况", item.completion],
      ["年龄", item.age],
      ["入选条件", item.inclusion],
      ["排除条件", item.exclusion],
    ];
  const designRows = evidenceMode === "quick"
    ? [
      ["研究设计", item.design],
      ["观察周期", item.duration],
      ["主要观察", item.endpoints],
    ]
    : [
      ["研究设计", item.design],
      ["盲法", item.blind],
      ["研究中心", item.center],
      ["观察周期", item.duration],
      ["评估时间点", item.timepoints],
      ["观察指标", item.endpoints],
    ];
  const designContext = item.sections?.[2]?.[1] || item.researchQuestion;
  return `
    <section class="study-overview" id="study-overview">
      <header class="evidence-section-heading"><p>01 / STUDY PROFILE</p><h3>研究了谁，又是怎么研究的？</h3><span>${item.researchQuestion}</span></header>
      <div class="study-overview__columns">
        <article class="study-profile-panel">
          <div class="study-profile-panel__title"><span>01</span><div><small>PARTICIPANTS</small><h4>研究对象</h4></div></div>
          <dl>${audienceRows.filter(([, value]) => value).map(([label, value]) => detailRow(label, value)).join("")}</dl>
        </article>
        <article class="study-profile-panel">
          <div class="study-profile-panel__title"><span>02</span><div><small>DESIGN</small><h4>研究设计</h4></div></div>
          <dl>${designRows.filter(([, value]) => value).map(([label, value]) => detailRow(label, value)).join("")}</dl>
        </article>
      </div>
      <div class="study-comparison" aria-label="干预与参照">
        <header><span>03</span><div><small>INTERVENTION & REFERENCE</small><h4>干预与参照</h4></div></header>
        <div class="study-comparison__groups">
          <article><small>研究处理</small><p>${item.intervention}</p></article>
          <i aria-hidden="true">VS</i>
          <article><small>参照处理</small><p>${item.control}</p></article>
        </div>
        <p class="study-comparison__note"><strong>先把比较对象说清：</strong>${designContext}</p>
      </div>
    </section>
    <section class="evidence-results" id="study-results">
      <header class="evidence-section-heading"><p>02 / KEY RESULTS</p><h3>关键结果：变化发生在哪个时间点？</h3><span>${item.cardNote || item.quick}</span></header>
      <div class="charts-grid">${item.charts.map((chart, index) => renderChart(chart, index)).join("")}</div>
    </section>
    <section class="evidence-interpretation" id="study-boundary">
      <header class="evidence-section-heading"><p>03 / INTERPRETATION</p><h3>这些结果，究竟说明了什么？</h3></header>
      <div>
        <article><span>它支持什么</span><p>${item.quick}</p></article>
        <article><span>需要同时看到</span><p>${item.boundary}</p></article>
        <article><span>安全性与局限</span><p>${item.safety}</p><p>${item.limitations}</p></article>
      </div>
    </section>`;
}

function renderGuidelineDetail(item) {
  const framework = evidenceMode === "quick" ? item.sections.slice(1, 4) : item.sections.slice(1, -1);
  const recommendations = item.statements.map(([topic, statement, source], index) => `
    <article>
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div><small>${topic}</small><p>${statement}</p><em>${source}</em></div>
    </article>`).join("");
  return `
    <section class="guideline-overview" id="guideline-overview">
      <header class="evidence-section-heading"><p>01 / DOCUMENT PROFILE</p><h3>这份文件在回答什么？</h3><span>${item.focus}</span></header>
      <div class="guideline-overview__columns">
        <aside class="guideline-passport">
          <dl>
            ${detailRow("文件类型", item.documentType)}
            ${detailRow("发布机构", item.publisher)}
            ${detailRow("适用对象", item.population)}
            ${detailRow("形成方式", item.methodology)}
            ${detailRow("来源", item.source)}
          </dl>
          <div><small>3分钟先抓住这些</small><p>${item.quick}</p></div>
        </aside>
        <div class="guideline-framework">
          <h4>按管理场景继续读</h4>
          ${framework.map(([title, copy], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><h5>${title}</h5><p>${copy}</p></div></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="guideline-recommendations" id="guideline-recommendations">
      <header class="evidence-section-heading"><p>02 / STRUCTURED READING</p><h3>具体建议与原文位置</h3><span>建议、证据等级和页码放在一起看，避免只记住一句结论。</span></header>
      <div>${recommendations}</div>
    </section>
    <section class="evidence-interpretation" id="guideline-boundary">
      <header class="evidence-section-heading"><p>03 / SCOPE</p><h3>适用范围与仍需注意的地方</h3></header>
      <div>
        <article><span>基础护理</span><p>${item.basicCare}</p></article>
        <article><span>长期管理</span><p>${item.longTerm}</p></article>
        <article><span>能回答什么，不能回答什么</span><p>${item.boundary}</p><p>${item.evidenceGaps}</p></article>
      </div>
    </section>`;
}

function openEvidenceDetails(id) {
  const item = findEvidence(id);
  if (!item || !evidenceDialogContent) return;
  evidenceDialogContent.innerHTML = `
    <article class="evidence-detail evidence-detail--${item.kind}">
      <header class="evidence-detail__header">
        <p class="evidence-detail__meta">${item.badge} · ${item.year} · ${evidenceMode === "quick" ? "快速理解" : "完整证据"}</p>
        <h2 id="evidence-dialog-title">${item.title}</h2>
        <div class="evidence-detail__passport">
          <span><b>资料类型</b>${item.documentType}</span>
          <span><b>来源</b>${item.source}</span>
          <span><b>${item.kind === "study" ? "研究问题" : "适用对象"}</b>${item.kind === "study" ? item.researchQuestion : item.population}</span>
        </div>
        <div class="evidence-detail__takeaway"><span>${item.kind === "study" ? "30秒要点" : "3分钟先抓住这些"}</span><p>${item.quick}</p></div>
      </header>
      ${item.kind === "study" ? renderStudyDetail(item) : renderGuidelineDetail(item)}
      <footer class="evidence-detail__footer">
        <button type="button" data-close-evidence-secondary>返回${item.kind === "study" ? "研究文献库" : "指南与综述"} ←</button>
        ${evidenceSource(item)}
      </footer>
    </article>`;
  evidenceDialogContent.querySelector("[data-close-evidence-secondary]")?.addEventListener("click", () => closeDialog(evidenceDialog));
  openDialog(evidenceDialog);
}

document.querySelector("[data-close-evidence]")?.addEventListener("click", () => closeDialog(evidenceDialog));

function renderChart(chart, index = 0) {
  const svg = chart.chartType === "bar" ? barChartSvg(chart) : lineChartSvg(chart);
  const rows = chart.points.map((point) => `<tr><td>${point.time}</td><td>${point.test}</td><td>${point.control}</td><td>${point.p}</td></tr>`).join("");
  return `<article class="chart-card">
    <div class="chart-card__signal"><span>${chart.title}</span><strong>${chart.signal}</strong><p>${chart.delta}</p><small>${chart.interpretation}</small></div>
    ${evidenceMode === "full" ? `<div class="chart-card__visual"><p>${chart.metric}</p>${svg}<div class="chart-legend"><span><i style="background:#5d8f24"></i>${chart.testLabel}</span><span><i style="background:#0069a8"></i>${chart.controlLabel}</span></div></div>` : ""}
    <details>
      <summary>${evidenceMode === "full" ? "查看完整数值与统计说明" : "查看图表与完整数值"} <b aria-hidden="true">＋</b></summary>
      <div class="chart-card__deep-dive">${evidenceMode === "quick" ? `<div class="chart-card__visual"><p>${chart.metric}</p>${svg}<div class="chart-legend"><span><i style="background:#5d8f24"></i>${chart.testLabel}</span><span><i style="background:#0069a8"></i>${chart.controlLabel}</span></div></div>` : ""}<div class="compare-table-wrap"><table class="chart-data-table"><thead><tr><th>时间</th><th>${chart.testLabel}</th><th>${chart.controlLabel}</th><th>统计说明</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    </details>
  </article>`;
}

function lineChartSvg(chart) {
  const width = 620, height = 320, padX = 56, padY = 34;
  const values = chart.points.flatMap((point) => [point.test, point.control]);
  const maxValue = Math.max(...values) * 1.12 || 1;
  const x = (index) => padX + (index * (width - padX * 2)) / Math.max(1, chart.points.length - 1);
  const y = (value) => height - padY - (value / maxValue) * (height - padY * 2);
  const testPoints = chart.points.map((point, index) => `${x(index)},${y(point.test)}`).join(" ");
  const controlPoints = chart.points.map((point, index) => `${x(index)},${y(point.control)}`).join(" ");
  const grid = [0, .25, .5, .75, 1].map((portion) => `<line x1="${padX}" y1="${y(maxValue * portion)}" x2="${width - padX}" y2="${y(maxValue * portion)}" stroke="#d8e6ed"/><text x="${padX - 9}" y="${y(maxValue * portion) + 4}" text-anchor="end" font-size="10" fill="#607b8b">${(maxValue * portion).toFixed(maxValue < 3 ? 1 : 0)}</text>`).join("");
  const labels = chart.points.map((point, index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#526c7c">${point.time}</text>`).join("");
  const testDots = chart.points.map((point, index) => `<circle cx="${x(index)}" cy="${y(point.test)}" r="5" fill="#fff" stroke="#5d8f24" stroke-width="4"/>`).join("");
  const controlDots = chart.points.map((point, index) => `<circle cx="${x(index)}" cy="${y(point.control)}" r="5" fill="#fff" stroke="#0069a8" stroke-width="4"/>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${chart.title}折线图">${grid}<polyline points="${testPoints}" fill="none" stroke="#5d8f24" stroke-width="4"/>${testDots}<polyline points="${controlPoints}" fill="none" stroke="#0069a8" stroke-width="4"/>${controlDots}${labels}</svg>`;
}

function barChartSvg(chart) {
  const width = 620, height = 320, padX = 56, padY = 38;
  const maxValue = Math.max(...chart.points.flatMap((point) => [point.test, point.control])) * 1.2 || 1;
  const plotWidth = width - padX * 2;
  const groupWidth = plotWidth / chart.points.length;
  const barWidth = Math.min(64, groupWidth * .25);
  const y = (value) => height - padY - (value / maxValue) * (height - padY * 2);
  const grid = [0, .25, .5, .75, 1].map((portion) => `<line x1="${padX}" y1="${y(maxValue * portion)}" x2="${width - padX}" y2="${y(maxValue * portion)}" stroke="#d8e6ed"/><text x="${padX - 9}" y="${y(maxValue * portion) + 4}" text-anchor="end" font-size="10" fill="#607b8b">${(maxValue * portion).toFixed(0)}</text>`).join("");
  const bars = chart.points.map((point, index) => {
    const center = padX + groupWidth * (index + .5);
    const testY = y(point.test), controlY = y(point.control);
    return `<rect x="${center - barWidth - 3}" y="${testY}" width="${barWidth}" height="${height - padY - testY}" fill="#5d8f24"/><rect x="${center + 3}" y="${controlY}" width="${barWidth}" height="${height - padY - controlY}" fill="#0069a8"/><text x="${center - barWidth / 2 - 3}" y="${testY - 6}" text-anchor="middle" font-size="10" fill="#466e1f">${point.test}</text><text x="${center + barWidth / 2 + 3}" y="${controlY - 6}" text-anchor="middle" font-size="10" fill="#0069a8">${point.control}</text><text x="${center}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#526c7c">${point.time}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${chart.title}柱状图">${grid}${bars}</svg>`;
}

renderActiveLabPanel();
updateCompareTray();

// Guestbook: preserve the existing Supabase-backed public message flow.
const guestbookForm = document.querySelector("[data-guestbook-form]");
const messageDialog = document.querySelector("[data-message-dialog]");
const messageList = document.querySelector("[data-message-list]");
const messageEmpty = document.querySelector("[data-message-empty]");
const messageCount = document.querySelector("[data-message-count]");
const guestbookStatus = document.querySelector("[data-guestbook-status]");
const guestbookNote = document.querySelector("[data-guestbook-note]");
const guestbookSubmitButton = guestbookForm?.querySelector('button[type="submit"]');
const messageStageCopy = document.querySelector("[data-message-stage-copy]");
const messageStageName = document.querySelector("[data-message-stage-name]");
const messageStageTime = document.querySelector("[data-message-stage-time]");
const guestbookStorageKey = "sia-portfolio-guestbook-v1";
const guestbookCooldownKey = "sia-portfolio-guestbook-last-submit";
const guestbookConfig = window.SIA_GUESTBOOK_CONFIG || {};
const guestbookTable = guestbookConfig.table || "guestbook_messages";
const hasCloudGuestbook = Boolean(/^https:\/\/.+\.supabase\.co\/?$/i.test(guestbookConfig.supabaseUrl || "") && guestbookConfig.supabasePublishableKey);
let guestbookMessages = [];
let featuredMessageIndex = 0;
let guestbookRotationTimer = 0;

function getLocalMessages() {
  try { const stored = JSON.parse(window.localStorage.getItem(guestbookStorageKey) || "[]"); return Array.isArray(stored) ? stored : []; }
  catch (_error) { return []; }
}

function saveLocalMessages(messages) {
  try { window.localStorage.setItem(guestbookStorageKey, JSON.stringify(messages.slice(-30))); return true; }
  catch (_error) { return false; }
}

function normalizeMessage(entry) {
  return { id: entry.id || "", name: entry.name || "一位路过的读者", message: entry.message || "", createdAt: entry.created_at || entry.createdAt || new Date().toISOString() };
}

function cloudHeaders(extra = {}) {
  const headers = { apikey: guestbookConfig.supabasePublishableKey, ...extra };
  if ((guestbookConfig.supabasePublishableKey || "").split(".").length === 3) headers.Authorization = `Bearer ${guestbookConfig.supabasePublishableKey}`;
  return headers;
}

function guestbookEndpoint(query = "") {
  return `${String(guestbookConfig.supabaseUrl || "").replace(/\/$/, "")}/rest/v1/${guestbookTable}${query}`;
}

function formatMessageDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function renderFeaturedMessage() {
  window.clearInterval(guestbookRotationTimer);
  if (!guestbookMessages.length) {
    if (messageStageCopy) messageStageCopy.textContent = "留言簿还在等第一句话。";
    if (messageStageName) messageStageName.textContent = "Sia的访客";
    if (messageStageTime) messageStageTime.textContent = "";
    return;
  }
  const render = () => {
    const entry = guestbookMessages[featuredMessageIndex % guestbookMessages.length];
    if (messageStageCopy) messageStageCopy.textContent = entry.message;
    if (messageStageName) messageStageName.textContent = entry.name;
    if (messageStageTime) { messageStageTime.dateTime = entry.createdAt; messageStageTime.textContent = formatMessageDate(entry.createdAt); }
  };
  render();
  if (guestbookMessages.length > 1 && !reduceMotion) guestbookRotationTimer = window.setInterval(() => { featuredMessageIndex = (featuredMessageIndex + 1) % guestbookMessages.length; render(); }, 5600);
}

function renderMessages() {
  if (messageCount) messageCount.textContent = String(guestbookMessages.length);
  if (messageEmpty) messageEmpty.hidden = guestbookMessages.length > 0;
  renderFeaturedMessage();
  if (!messageList) return;
  messageList.replaceChildren();
  guestbookMessages.forEach((entry) => {
    const article = document.createElement("article");
    const meta = document.createElement("p");
    const name = document.createElement("strong");
    const time = document.createElement("time");
    const copy = document.createElement("p");
    name.textContent = entry.name;
    time.dateTime = entry.createdAt;
    time.textContent = formatMessageDate(entry.createdAt);
    copy.textContent = entry.message;
    meta.append(name, time);
    article.append(meta, copy);
    messageList.append(article);
  });
}

async function loadMessages() {
  if (!hasCloudGuestbook) {
    guestbookMessages = getLocalMessages().map(normalizeMessage).reverse();
    if (guestbookNote) guestbookNote.textContent = "本地预览模式：留言只保存在当前浏览器；发布后的页面会连接共享留言簿。";
    renderMessages();
    return;
  }
  if (guestbookNote) guestbookNote.textContent = "这是公开留言簿：提交后，你的称呼和留言可能经Sia确认后展示并长期保留。请勿填写联系方式或敏感信息；如需撤回，可通过页面邮箱联系。";
  try {
    const response = await fetch(guestbookEndpoint("?select=id,name,message,created_at&is_visible=eq.true&order=created_at.desc&limit=30"), { headers: cloudHeaders({ Accept: "application/json" }) });
    if (!response.ok) throw new Error(`Guestbook read failed: ${response.status}`);
    guestbookMessages = (await response.json()).map(normalizeMessage);
    renderMessages();
  } catch (error) {
    console.error(error);
    if (guestbookStatus) guestbookStatus.textContent = "留言簿暂时没有连接上，请稍后再试。";
  }
}

document.querySelectorAll("[data-open-messages]").forEach((button) => button.addEventListener("click", async () => { await loadMessages(); openDialog(messageDialog); }));
document.querySelector("[data-close-messages]")?.addEventListener("click", () => closeDialog(messageDialog));

guestbookForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(guestbookForm);
  if (String(formData.get("website") || "").trim()) { guestbookForm.reset(); return; }
  const name = (String(formData.get("guestName") || "").trim() || "一位路过的读者").slice(0, 24);
  const message = String(formData.get("guestMessage") || "").trim().slice(0, 240);
  if (!message) return;
  if (!hasCloudGuestbook) {
    const messages = getLocalMessages();
    messages.push({ name, message, createdAt: new Date().toISOString() });
    const saved = saveLocalMessages(messages);
    if (guestbookStatus) guestbookStatus.textContent = saved ? "已放进这台设备的留言簿。" : "浏览器没有允许本地保存。";
    if (saved) guestbookForm.reset();
    await loadMessages();
    return;
  }
  const lastSubmit = Number(window.localStorage.getItem(guestbookCooldownKey) || 0);
  const elapsed = (Date.now() - lastSubmit) / 1000;
  if (elapsed < 30) { if (guestbookStatus) guestbookStatus.textContent = `请稍等${Math.ceil(30 - elapsed)}秒再留下一句。`; return; }
  if (guestbookSubmitButton) guestbookSubmitButton.disabled = true;
  if (guestbookStatus) guestbookStatus.textContent = "正在把这句话送进留言簿……";
  try {
    const response = await fetch(guestbookEndpoint(), { method: "POST", headers: cloudHeaders({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify({ name, message }) });
    if (!response.ok) throw new Error(`Guestbook write failed: ${response.status}`);
    window.localStorage.setItem(guestbookCooldownKey, String(Date.now()));
    guestbookForm.reset();
    if (guestbookStatus) guestbookStatus.textContent = "收到啦。Sia确认后，这句话就会出现在公开留言簿里。";
  } catch (error) {
    console.error(error);
    if (guestbookStatus) guestbookStatus.textContent = "这句话暂时没有送达，请稍后再试，或直接给我发邮件。";
  } finally {
    if (guestbookSubmitButton) guestbookSubmitButton.disabled = false;
  }
});

loadMessages();

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
