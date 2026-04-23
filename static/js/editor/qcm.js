// qcm.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";
import { renderLatexInElement } from "../katex/latexRenderer.js";

const defaultQcmContent = {
  question: "Votre question ici...",
  choices: ["Choix 1", "Choix 2", "Choix 3"],
  layout: "column"
};

const qcmConfig = {
  defaultTitle: "QCM",
  defaultContent: defaultQcmContent,

  defaultWidth: 700,
  defaultHeight: 220,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-list-check",
  iconColor: "#0d6efd",
  className: "qcm-block",
  autoStack: true,

  fields: [],

  customHtml: () => {
    return `
      <div class="qcm-container">
        <div class="qcm-preview">
          <div class="qcm-question-preview latex-enabled"></div>
          <div class="qcm-choices-preview"></div>
        </div>

        <div class="qcm-editor">
          <div class="qcm-editor-section">
            <label class="qcm-label">📝 Énoncé</label>
            <div class="qcm-question-source" contenteditable="true"></div>
          </div>

          <div class="qcm-editor-section">
            <div class="qcm-editor-header">
              <label class="qcm-label">📋 Choix</label>
              <div class="qcm-editor-buttons">
                <button class="btn-add-choice" type="button">
                  <i class="fas fa-plus"></i> Ajouter
                </button>
                <button class="btn-remove-choice" type="button">
                  <i class="fas fa-minus"></i> Supprimer
                </button>
              </div>
            </div>
            <div class="qcm-layout-buttons">
              <button class="btn-layout-column" data-layout="column">
                <i class="fas fa-list"></i> Colonne
              </button>
              <button class="btn-layout-row" data-layout="row">
                <i class="fas fa-grip-horizontal"></i> Ligne
              </button>
            </div>
            <div class="qcm-choices-editor"></div>
          </div>
        </div>
      </div>
    `;
  },

  customCSS: `
    .qcm-container {
      width: 100%;
      background: transparent;
      cursor: pointer;
    }

    .qcm-preview {
      background: transparent;
      border-radius: 12px;
      padding: 16px 20px;
      border: none;
      transition: all 0.2s ease;
    }

    .qcm-preview:hover {
      border-color: #0d6efd;
      background: transparent;
    }

    .qcm-question-preview {
      font-weight: 600;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      color: #1e293b;
    }

    .qcm-choices-preview.column {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .qcm-choices-preview.row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 20px;
    }

    .qcm-choices-preview.row .qcm-choice-preview {
      flex: 1;
      min-width: 180px;
    }

    .qcm-choice-preview {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 6px 0;
    }

    .qcm-choice-marker {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      background: #f1f5f9;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #0d6efd;
    }

    .qcm-choice-text {
      flex: 1;
      font-size: 15px;
      line-height: 1.5;
      color: #334155;
    }

    .qcm-editor {
      display: none;
      background: transparent;
      border-radius: 12px;
      padding: 16px 20px;
      border: 2px solid #0d6efd;
    }

    .qcm-container.is-editing {
      cursor: text;
    }

    .qcm-container.is-editing .qcm-preview {
      display: none;
    }

    .qcm-container.is-editing .qcm-editor {
      display: block;
    }

    .qcm-editor-section {
      margin-bottom: 20px;
    }

    .qcm-editor-section:last-child {
      margin-bottom: 0;
    }

    .qcm-editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .qcm-label {
      font-size: 12px;
      font-weight: 600;
      color: #0d6efd;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .qcm-editor-buttons {
      display: flex;
      gap: 8px;
    }

    .qcm-editor-buttons button {
      border: none;
      cursor: pointer;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: white;
      transition: all 0.2s;
    }

    .btn-add-choice {
      background: #198754;
    }

    .btn-add-choice:hover {
      background: #157347;
    }

    .btn-remove-choice {
      background: #dc3545;
    }

    .btn-remove-choice:hover {
      background: #bb2d3b;
    }

    .qcm-layout-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .qcm-layout-buttons button {
      border: 1px solid #cbd5e1;
      background: #fff;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      color: #334155;
    }

    .qcm-layout-buttons button.active {
      background: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }

    .qcm-question-source,
    .qcm-choice-source {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      font-size: 15px;
      line-height: 1.5;
      color: #1e293b;
      outline: none;
      cursor: text;
      transition: all 0.2s;
    }

    .qcm-question-source {
      font-weight: 600;
      min-height: 80px;
    }

    .qcm-question-source:focus,
    .qcm-choice-source:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 3px rgba(13,110,253,0.1);
    }

    .qcm-question-source:empty:before,
    .qcm-choice-source:empty:before {
      content: attr(data-placeholder);
      color: #94a3b8;
      font-style: italic;
      font-weight: normal;
    }

    .qcm-choices-editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .qcm-choice-editor-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .qcm-choice-editor-row .qcm-choice-source {
      flex: 1;
      min-height: 50px;
    }

    .latex-enabled .katex {
      font-size: 1em !important;
    }

    .latex-enabled .katex-display {
      margin: 0.5em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
  `,

  customEvents: (blockEl, blockData) => {
    const container = blockEl.querySelector(".qcm-container");
    const previewEl = blockEl.querySelector(".qcm-preview");
    const editorEl = blockEl.querySelector(".qcm-editor");
    const choicesPreviewEl = blockEl.querySelector(".qcm-choices-preview");

    const questionSourceEl = blockEl.querySelector(".qcm-question-source");
    const questionPreviewEl = blockEl.querySelector(".qcm-question-preview");
    const choicesEditorEl = blockEl.querySelector(".qcm-choices-editor");

    const addChoiceBtn = blockEl.querySelector(".btn-add-choice");
    const removeChoiceBtn = blockEl.querySelector(".btn-remove-choice");
    const btnLayoutColumn = blockEl.querySelector(".btn-layout-column");
    const btnLayoutRow = blockEl.querySelector(".btn-layout-row");

    let tempContent = normalizeQcmContent(blockData.content);

    if (questionSourceEl) {
      questionSourceEl.setAttribute("data-placeholder", "Écrivez votre question ici...");
    }

    function setLayout(layout) {
      tempContent.layout = layout;
      saveToState();
      
      if (layout === "row") {
        choicesPreviewEl.classList.add("row");
        choicesPreviewEl.classList.remove("column");
        if (btnLayoutRow) btnLayoutRow.classList.add("active");
        if (btnLayoutColumn) btnLayoutColumn.classList.remove("active");
      } else {
        choicesPreviewEl.classList.add("column");
        choicesPreviewEl.classList.remove("row");
        if (btnLayoutColumn) btnLayoutColumn.classList.add("active");
        if (btnLayoutRow) btnLayoutRow.classList.remove("active");
      }
      
      renderPreviewFromState();
    }

    function selectBlock() {
      document.querySelectorAll(".block").forEach(block => {
        block.classList.remove("selected");
      });
      blockEl.classList.add("selected");
    }

    function cloneDeep(obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    function normalizeEditableHtml(html) {
      if (!html || html === "<br>" || html === "&nbsp;" || html === "<div><br></div>") {
        return "";
      }
      return html;
    }

    function placeCursorAtEnd(el) {
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function getSafeContent() {
      return normalizeQcmContent(blockData.content);
    }

    function saveToState() {
      blockData.content = cloneDeep(tempContent);
      updateBlockContent(blockData.id, { content: cloneDeep(tempContent) });
      if (window.triggerAutoSave) window.triggerAutoSave();
    }

    function renderPreviewFromState() {
      const content = getSafeContent();
      if (questionPreviewEl) questionPreviewEl.innerHTML = content.question || "";

      if (choicesPreviewEl) {
        choicesPreviewEl.innerHTML = content.choices.map((choice, idx) => `
          <div class="qcm-choice-preview">
            <div class="qcm-choice-marker">${String.fromCharCode(65 + idx)}</div>
            <div class="qcm-choice-text">${choice || ""}</div>
          </div>
        `).join("");

        if (content.layout === "row") {
          choicesPreviewEl.classList.add("row");
          choicesPreviewEl.classList.remove("column");
        } else {
          choicesPreviewEl.classList.add("column");
          choicesPreviewEl.classList.remove("row");
        }
      }

      if (questionPreviewEl) renderLatexInElement(questionPreviewEl);
      if (choicesPreviewEl) {
        choicesPreviewEl.querySelectorAll(".qcm-choice-text").forEach(el => {
          renderLatexInElement(el);
        });
      }
    }

    function renderChoicesEditor() {
      if (!choicesEditorEl) return;
      choicesEditorEl.innerHTML = "";

      tempContent.choices.forEach((choice, index) => {
        const row = document.createElement("div");
        row.className = "qcm-choice-editor-row";
        row.innerHTML = `
          <div class="qcm-choice-marker">${String.fromCharCode(65 + index)}</div>
          <div class="qcm-choice-source" contenteditable="true" data-index="${index}" data-placeholder="Choix ${String.fromCharCode(65 + index)}...">${choice || "<br>"}</div>
        `;
        choicesEditorEl.appendChild(row);
      });

      choicesEditorEl.querySelectorAll(".qcm-choice-source").forEach(choiceEl => {
        const idx = parseInt(choiceEl.dataset.index);
        choiceEl.setAttribute("data-placeholder", `Choix ${String.fromCharCode(65 + idx)}...`);
        
        choiceEl.addEventListener("click", (e) => {
          e.stopPropagation();
          selectBlock();
        });

        choiceEl.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });

        choiceEl.addEventListener("input", () => {
          const index = Number(choiceEl.dataset.index);
          tempContent.choices[index] = normalizeEditableHtml(choiceEl.innerHTML);
          saveToState();
        });
      });
    }

    function fillEditorFromState() {
      tempContent = cloneDeep(getSafeContent());
      if (questionSourceEl) questionSourceEl.innerHTML = tempContent.question || "<br>";
      renderChoicesEditor();
      
      if (tempContent.layout === "row") {
        if (btnLayoutRow) btnLayoutRow.classList.add("active");
        if (btnLayoutColumn) btnLayoutColumn.classList.remove("active");
      } else {
        if (btnLayoutColumn) btnLayoutColumn.classList.add("active");
        if (btnLayoutRow) btnLayoutRow.classList.remove("active");
      }
    }

    function openEditMode() {
      selectBlock();
      fillEditorFromState();
      container.classList.add("is-editing");
      if (questionSourceEl) {
        questionSourceEl.focus();
        placeCursorAtEnd(questionSourceEl);
      }
    }

    function closeEditMode() {
      saveToState();
      container.classList.remove("is-editing");
      renderPreviewFromState();
    }

    if (!container.hasAttribute("data-events-attached")) {
      container.setAttribute("data-events-attached", "true");

      container.addEventListener("click", (e) => {
        e.stopPropagation();
        selectBlock();
      });

      container.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        openEditMode();
      });

      if (previewEl) previewEl.addEventListener("mousedown", (e) => e.stopPropagation());
      if (editorEl) editorEl.addEventListener("mousedown", (e) => e.stopPropagation());

      if (questionSourceEl) {
        questionSourceEl.addEventListener("click", (e) => {
          e.stopPropagation();
          selectBlock();
        });

        questionSourceEl.addEventListener("input", () => {
          tempContent.question = normalizeEditableHtml(questionSourceEl.innerHTML);
          saveToState();
        });

        questionSourceEl.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            container.classList.remove("is-editing");
            renderPreviewFromState();
          }
        });
      }

      if (btnLayoutColumn) {
        btnLayoutColumn.addEventListener("click", (e) => {
          e.stopPropagation();
          setLayout("column");
        });
      }

      if (btnLayoutRow) {
        btnLayoutRow.addEventListener("click", (e) => {
          e.stopPropagation();
          setLayout("row");
        });
      }

      if (addChoiceBtn) {
        addChoiceBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          tempContent.choices.push("");
          saveToState();
          renderChoicesEditor();
          const newChoice = choicesEditorEl?.querySelector(".qcm-choice-source:last-child");
          if (newChoice) {
            newChoice.focus();
            placeCursorAtEnd(newChoice);
          }
        });
      }

      if (removeChoiceBtn) {
        removeChoiceBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (tempContent.choices.length > 1) {
            tempContent.choices.pop();
            saveToState();
            renderChoicesEditor();
          }
        });
      }

      if (editorEl) {
        editorEl.addEventListener("focusout", () => {
          setTimeout(() => {
            if (editorEl && !editorEl.contains(document.activeElement)) {
              closeEditMode();
            }
          }, 0);
        });
      }
    }

    if (!blockData.content) {
      blockData.content = cloneDeep(defaultQcmContent);
      updateBlockContent(blockData.id, { content: cloneDeep(defaultQcmContent) });
    }

    renderPreviewFromState();
  }
};

function normalizeQcmContent(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      question: typeof raw.question === "string" ? raw.question : defaultQcmContent.question,
      choices: Array.isArray(raw.choices) && raw.choices.length
        ? raw.choices.map(choice => typeof choice === "string" ? choice : "")
        : [...defaultQcmContent.choices],
      layout: raw.layout === "row" ? "row" : "column"
    };
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeQcmContent(parsed);
    } catch {
      return {
        question: raw,
        choices: [...defaultQcmContent.choices],
        layout: "column"
      };
    }
  }

  return {
    question: defaultQcmContent.question,
    choices: [...defaultQcmContent.choices],
    layout: "column"
  };
}

const qcmBlock = createBlockType("qcm", qcmConfig);

export const createQcmData = qcmBlock.createData;
export const renderQcm = qcmBlock.render;
export const attachQcmEvents = qcmBlock.attachEvents;
export const addQcm = qcmBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde
export function serializeQcm(blockEl) {
  const container = blockEl.querySelector(".qcm-container");
  const questionPreviewEl = blockEl.querySelector(".qcm-question-preview");
  const choicesPreviewEl = blockEl.querySelector(".qcm-choices-preview");
  
  // Récupérer la question
  let question = "";
  if (questionPreviewEl) {
    question = questionPreviewEl.innerHTML;
  }
  
  // Récupérer les choix
  const choices = [];
  if (choicesPreviewEl) {
    const choiceElements = choicesPreviewEl.querySelectorAll(".qcm-choice-text");
    choiceElements.forEach(el => {
      choices.push(el.innerHTML);
    });
  }
  
  // Récupérer le layout
  let layout = "column";
  if (choicesPreviewEl) {
    if (choicesPreviewEl.classList.contains("row")) {
      layout = "row";
    }
  }
  
  return {
    question: question,
    choices: choices,
    layout: layout
  };
}