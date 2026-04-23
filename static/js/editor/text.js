// text.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";
import { renderLatexInElement } from "../katex/latexRenderer.js";

const textConfig = {
  defaultTitle: "Texte",
  defaultContent: "Ajouter du texte ou du LaTeX...",

  defaultWidth: 600,
  defaultHeight: 40,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-font",
  iconColor: "#6f42c1",
  className: "text-block",
  autoStack: true,

  editableFields: ["content"],

  customHtml: () => {
    return `
      <div class="text-container">
        <div class="text-preview latex-enabled"></div>
        <div class="text-editor">
          <div class="text-source" contenteditable="true"></div>
        </div>
      </div>
    `;
  },

  customCSS: `
    /* Conteneur principal */
    .text-container {
      width: 100%;
      background: transparent;
      cursor: pointer;
    }

    /* ===== PREVIEW ===== */
    .text-preview {
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      font-size: 16px;
      line-height: 1.6;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .text-preview:hover {
      border-color: #6f42c1;
      background: #fcfaff;
    }

    /* ===== EDITOR ===== */
    .text-editor {
      display: none;
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      border: 2px solid #6f42c1;
    }

    .text-container.is-editing {
      cursor: text;
    }

    .text-container.is-editing .text-preview {
      display: none;
    }

    .text-container.is-editing .text-editor {
      display: block;
    }

    /* Source éditable - hauteur automatique */
    .text-source {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      font-size: 16px;
      line-height: 1.6;
      color: #1e293b;
      outline: none;
      cursor: text;
      min-height: 120px;
      transition: all 0.2s;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .text-source:focus {
      border-color: #6f42c1;
      box-shadow: 0 0 0 3px rgba(111,66,193,0.1);
    }

    .text-source:empty:before {
      content: "Écrivez votre texte ici... (LaTeX supporté : $...$ ou $$...$$)";
      color: #94a3b8;
      font-style: italic;
    }

    /* ===== KATEX - EXACTEMENT COMME QCM.JS ===== */
    .text-preview {
      font-size: 16px;
    }

    .text-preview .katex,
    .text-preview .katex *,
    .text-preview .katex .katex-html,
    .text-preview .katex .katex-math {
      font-size: 16px !important;
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
    const container = blockEl.querySelector(".text-container");
    const previewEl = blockEl.querySelector(".text-preview");
    const sourceEl = blockEl.querySelector(".text-source");
    
    let originalHeight = null;

    function normalizeContent(html) {
      if (!html || html === "<br>" || html === "&nbsp;" || html === "<div><br></div>") {
        return "";
      }
      return html;
    }

    function saveText() {
      const content = normalizeContent(sourceEl.innerHTML);
      blockData.content = content;
      updateBlockContent(blockData.id, { content });

      if (window.triggerAutoSave) {
        window.triggerAutoSave();
      }

      previewEl.innerHTML = content || "";
      renderLatexInElement(previewEl);
    }

    function selectBlock() {
      document.querySelectorAll(".block").forEach(block => {
        block.classList.remove("selected");
      });
      blockEl.classList.add("selected");
    }

    function placeCursorAtEnd(el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function updateBlockHeight() {
      blockEl.style.height = "auto";
      blockEl.style.minHeight = originalHeight + "px";
    }

    function openEditMode() {
      originalHeight = blockEl.offsetHeight;
      blockEl.style.minHeight = originalHeight + "px";
      blockEl.style.height = "auto";

      selectBlock();
      container.classList.add("is-editing");
      sourceEl.focus();
      placeCursorAtEnd(sourceEl);
      
      setTimeout(updateBlockHeight, 10);
    }

    function closeEditMode() {
      saveText();
      container.classList.remove("is-editing");

      if (originalHeight) {
        blockEl.style.height = originalHeight + "px";
        blockEl.style.minHeight = "";
        originalHeight = null;
      }
    }

    function adjustHeight() {
      if (container.classList.contains("is-editing")) {
        blockEl.style.height = "auto";
        blockEl.style.minHeight = originalHeight + "px";
      }
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

      previewEl.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      sourceEl.addEventListener("click", (e) => {
        e.stopPropagation();
        selectBlock();
      });

      sourceEl.addEventListener("input", () => {
        const content = normalizeContent(sourceEl.innerHTML);
        blockData.content = content;
        updateBlockContent(blockData.id, { content });
        adjustHeight();
      });

      sourceEl.addEventListener("blur", () => {
        closeEditMode();
      });

      sourceEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          sourceEl.innerHTML = blockData.content || "";
          container.classList.remove("is-editing");
          if (originalHeight) {
            blockEl.style.height = originalHeight + "px";
            blockEl.style.minHeight = "";
            originalHeight = null;
          }
        }
      });
    }

    // ✅ Extraire le texte si content est un objet
    let contentToShow = blockData.content;
    if (typeof contentToShow === 'object' && contentToShow !== null) {
      contentToShow = contentToShow.text || contentToShow.content || "";
    }
    
    previewEl.innerHTML = contentToShow || "";
    renderLatexInElement(previewEl);
    sourceEl.innerHTML = contentToShow || "";

    if (!blockData.content) {
      saveText();
    }
  }
};

const textBlock = createBlockType("text", textConfig);

export const createTextData = textBlock.createData;
export const renderText = textBlock.render;
export const attachTextEvents = textBlock.attachEvents;
export const addText = textBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde
export function serializeText(blockEl) {
  const container = blockEl.querySelector(".text-container");
  const previewEl = blockEl.querySelector(".text-preview");
  
  // Récupérer le contenu depuis le preview ou le source
  let content = "";
  if (previewEl) {
    content = previewEl.innerHTML;
  }
  
  // Si le preview est vide, essayer le source
  if (!content || content === "") {
    const sourceEl = blockEl.querySelector(".text-source");
    if (sourceEl) {
      content = sourceEl.innerHTML;
    }
  }
  
  return content;
}