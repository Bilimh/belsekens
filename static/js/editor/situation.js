// situation.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";
import { renderLatexInElement } from "../katex/latexRenderer.js";

const situationConfig = {
  defaultTitle: "SITUATION: Les abonnés d'une page Instagram",
  defaultContent: `Moussa, 18 ans, lance sa propre marque de vêtements streetwear.
Pour se faire connaître, il ouvre une page Instagram et commence à publier ses créations.
Son objectif est clair : atteindre 1200 abonnés afin de pouvoir contacter une grande boutique locale et proposer ses modèles.

Pour se projeter, il imagine une progression régulière du nombre d'abonnés :
• La 1ère semaine, il a 50 abonnés.
• La 2e semaine, il en compte 150.
• La 3e semaine, il en compte 250.
Et ainsi de suite, semaine après semaine...`,

  defaultWidth: 700,
  defaultHeight: 400,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-lightbulb",
  iconColor: "#53195D",
  className: "situation-block",
  autoStack: true,

  editableFields: ["title", "content", "imageCaption"],

  enableImageUpload: true,
  imageWidth: 270,
  imageHeight: 180,

  customHtml: () => {
    return `
      <div class="situation-container">
        <div class="situation-header">
          <div class="situation-title" data-field="title" contenteditable="true">Situation</div>
        </div>
        
        <div class="situation-content">
          <div class="situation-image-area" data-action="upload-image" 
               style="float: right; width: 270px; min-height: 180px; background: #f0f0f0; border-radius: 6px; margin: 0 0 10px 15px;">
          </div>
          
          <div class="situation-preview latex-enabled"></div>
          
          <div class="situation-editor">
            <div class="situation-source" contenteditable="true"></div>
          </div>
        </div>
        
        <div style="clear: both;"></div>
      </div>
    `;
  },

  customCSS: `
    .situation-container {
      width: 100%;
      background: transparent;
      cursor: pointer;
    }

    .situation-header {
      margin-bottom: 15px;
    }

    .situation-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #53195D;
      padding: 5px;
      border-bottom: 2px solid #E0C4F4;
      outline: none;
    }

    .situation-title:empty:before {
      content: "Titre de la situation";
      color: #94a3b8;
      font-style: italic;
    }

    .situation-preview {
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      border: 1px solid #E0C4F4;
      transition: all 0.2s ease;
      font-size: 16px;
      line-height: 1.6;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 150px;
    }

    .situation-preview:hover {
      border-color: #53195D;
      background: #fcfaff;
    }

 .situation-preview.latex-enabled .katex,
.situation-preview .katex {
  font-size: 1.1em !important;
}
    .situation-preview.latex-enabled .katex-display,
.situation-preview .katex-display {
  font-size: 1.2em !important;
}

    .situation-editor {
      display: none;
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      border: 2px solid #53195D;
    }

    .situation-container.is-editing .situation-preview {
      display: none;
    }

    .situation-container.is-editing .situation-editor {
      display: block;
    }

    .situation-source {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      font-size: 16px;
      line-height: 1.6;
      color: #1e293b;
      outline: none;
      cursor: text;
      min-height: 150px;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: monospace;
    }

    .situation-source:focus {
      border-color: #53195D;
      box-shadow: 0 0 0 3px rgba(83,25,93,0.1);
    }

    .situation-source:empty:before {
      content: "Décrivez la situation ici... (LaTeX supporté : $...$ ou $$...$$)";
      color: #94a3b8;
      font-style: italic;
    }
  `,

  customEvents: (blockEl, blockData) => {
    const container = blockEl.querySelector(".situation-container");
    const previewEl = blockEl.querySelector(".situation-preview");
    const sourceEl = blockEl.querySelector(".situation-source");
    const titleEl = blockEl.querySelector(".situation-title");
    
    let originalHeight = null;

    function normalizeContent(html) {
      if (!html || html === "<br>" || html === "&nbsp;" || html === "<div><br></div>") {
        return "";
      }
      return html;
    }

    // ✅ Sauvegarde : stocker le code BRUT, afficher le rendu
    function saveContent() {
      // Récupérer le code brut depuis l'éditeur
      const rawContent = sourceEl.innerHTML;
      
      // Stocker le code brut
      blockData.content = rawContent;
      updateBlockContent(blockData.id, { content: rawContent });

      // Afficher le rendu LaTeX dans le preview
      previewEl.innerHTML = rawContent;
      renderLatexInElement(previewEl);
    }

    function saveTitle() {
      if (titleEl) {
        const title = normalizeContent(titleEl.innerHTML);
        blockData.title = title || "Situation";
        updateBlockContent(blockData.id, { title: blockData.title });
      }
    }

    function selectBlock() {
      document.querySelectorAll(".block").forEach(block => {
        block.classList.remove("selected");
      });
      blockEl.classList.add("selected");
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
      
      const range = document.createRange();
      range.selectNodeContents(sourceEl);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function closeEditMode() {
      saveContent();
      saveTitle();
      container.classList.remove("is-editing");

      if (originalHeight) {
        blockEl.style.height = originalHeight + "px";
        blockEl.style.minHeight = "";
        originalHeight = null;
      }
    }

    // Initialisation
    let rawContent = blockData.content;
    if (typeof rawContent === 'object' && rawContent !== null) {
      rawContent = rawContent.text || rawContent.content || "";
    }
    
    // Preview : rendu LaTeX
    previewEl.innerHTML = rawContent || "";
    renderLatexInElement(previewEl);
    
    // Source : code brut
    sourceEl.innerHTML = rawContent || "";
    
    if (titleEl && !titleEl.innerHTML.trim()) {
      titleEl.innerHTML = blockData.title || "Situation";
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

      if (titleEl) {
        titleEl.addEventListener("blur", () => {
          saveTitle();
          if (window.triggerAutoSave) window.triggerAutoSave();
        });
      }
    }
  }
};

const situationBlock = createBlockType("situation", situationConfig);

export const createSituationData = situationBlock.createData;
export const renderSituation = situationBlock.render;
export const attachSituationEvents = situationBlock.attachEvents;
export const addSituation = situationBlock.add;

export function serializeSituation(blockEl) {
  const titleEl = blockEl.querySelector(".situation-title");
  // ✅ Lire le code BRUT depuis le source
  const sourceEl = blockEl.querySelector(".situation-source");
  const imageEl = blockEl.querySelector('img');
  const imageCaptionEl = blockEl.querySelector('[data-field="imageCaption"]');
  
  let content = "";
  if (sourceEl && sourceEl.innerHTML) {
    content = sourceEl.innerHTML;
  }
  
  return {
    title: titleEl ? titleEl.innerHTML : '',
    content: content,
    imageUrl: imageEl ? imageEl.src : null,
    imageCaption: imageCaptionEl ? imageCaptionEl.innerHTML : ''
  };
}