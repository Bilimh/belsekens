// text.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";
import { renderLatexInElement } from "../katex/latexRenderer.js";

const textConfig = {
  defaultTitle: "Texte",
  defaultContent: "Ajouter du texte ou du LaTeX...",

  defaultWidth: 600,
  defaultHeight: 20,
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
    .text-container {
      width: 100%;
      background: transparent;
      cursor: pointer;
    }

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
      min-height: 120px;
    }

    .text-preview:hover {
      border-color: #6f42c1;
      background: #fcfaff;
    }

    .text-editor {
      display: none;
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      border: 2px solid #6f42c1;
    }

    .text-container.is-editing .text-preview {
      display: none;
    }

    .text-container.is-editing .text-editor {
      display: block;
    }

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
      white-space: pre-wrap;
      word-break: break-word;
      font-family: monospace;
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

/* Forcer la taille du LaTeX dans le preview */
.text-preview.latex-enabled .katex,
.text-preview .katex {
  font-size: 1.1em !important;
}

.text-preview.latex-enabled .katex-display,
.text-preview .katex-display {
  font-size: 1.2em !important;
  margin: 1em 0;
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
      // ✅ Récupérer le code BRUT depuis l'éditeur
      const rawContent = sourceEl.innerHTML;
      
      // Stocker le code brut
      blockData.content = rawContent;
      updateBlockContent(blockData.id, { content: rawContent });

      // Afficher le rendu LaTeX dans le preview
      previewEl.innerHTML = rawContent;
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

      // ✅ Mettre le code BRUT dans l'éditeur
      let rawContent = blockData.content;
      if (typeof rawContent === 'object' && rawContent !== null) {
        rawContent = rawContent.text || rawContent.content || "";
      }
      
      sourceEl.innerHTML = rawContent || "";

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
        const content = sourceEl.innerHTML;
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
          container.classList.remove("is-editing");
          if (originalHeight) {
            blockEl.style.height = originalHeight + "px";
            blockEl.style.minHeight = "";
            originalHeight = null;
          }
        }
      });
    }

    // Initialisation
    let rawContent = blockData.content;
    if (typeof rawContent === 'object' && rawContent !== null) {
      rawContent = rawContent.text || rawContent.content || "";
    }
    
    previewEl.innerHTML = rawContent || "";
    renderLatexInElement(previewEl);
    sourceEl.innerHTML = rawContent || "";
  }
};

const textBlock = createBlockType("text", textConfig);

export const createTextData = textBlock.createData;
export const renderText = textBlock.render;
export const attachTextEvents = textBlock.attachEvents;
export const addText = textBlock.add;

export function serializeText(blockEl) {
  // ✅ Lire le code BRUT depuis le source
  const sourceEl = blockEl.querySelector(".text-source");
  const previewEl = blockEl.querySelector(".text-preview");
  
  let content = "";
  if (sourceEl && sourceEl.innerHTML) {
    content = sourceEl.innerHTML;
  } else if (previewEl) {
    content = previewEl.innerHTML;
  }
  
  return content;
}