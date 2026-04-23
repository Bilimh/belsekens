// spaceAnswer.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

const spaceAnswerConfig = {
  defaultTitle: "Espace réponse",
  defaultContent: [],

  defaultWidth: 600,
  defaultHeight: 50,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-edit",
  iconColor: "#28a745",
  className: "space-answer-block",
  autoStack: true,

  editableFields: ["content"],

  customHtml: (data) => {
    let linesContent = [];

    // ✅ Normaliser le contenu si c'est un objet
    let rawContent = data.content;
    if (typeof rawContent === 'object' && rawContent !== null && !Array.isArray(rawContent)) {
      rawContent = rawContent.lines || rawContent.content || [];
    }

    if (Array.isArray(rawContent)) {
      linesContent = rawContent;
    } else if (typeof rawContent === "string") {
      try {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed)) {
          linesContent = parsed;
        } else {
          linesContent = [rawContent];
        }
      } catch {
        linesContent = [rawContent];
      }
    } else {
      linesContent = [""];
    }

    if (linesContent.length === 0) {
      linesContent = [""];
    }

    let linesHtml = "";
    for (let i = 0; i < linesContent.length; i++) {
      const content = linesContent[i] || "";
      linesHtml += `
        <div class="answer-line" data-line-index="${i}" contenteditable="true">
          ${content || "<br>"}
        </div>
      `;
    }

    return `
      <div class="space-answer-container">
        <div class="answer-lines-container">
          ${linesHtml}
        </div>
        <div class="space-answer-controls">
          <button class="btn-add-line" title="Ajouter une ligne">
            <i class="fas fa-plus"></i> Ligne
          </button>
          <button class="btn-remove-line" title="Supprimer une ligne">
            <i class="fas fa-minus"></i> Ligne
          </button>
        </div>
      </div>
    `;
  },

  customCSS: `
    .space-answer-container {
      width: 100%;
      background: transparent;
      padding: 5px;
    }

    .answer-line {
      min-height: 40px;
      border-bottom: 2px dotted #666;
      padding: 8px 5px;
      margin-bottom: 8px;
      outline: none;
      cursor: text;
      line-height: 1.5;
      font-size: 14px;
      color: #333;
      background: #fefefe;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .answer-line:hover {
      border-bottom-color: #28a745;
      background: #f9fff9;
    }

    .answer-line:focus {
      border-bottom-color: #28a745;
      border-bottom-style: solid;
      background: #f0fff4;
      outline: none;
    }

    .answer-line:empty:before {
      content: "Écrivez votre réponse ici...";
      color: #aaa;
      font-style: italic;
      font-size: 13px;
    }

    .space-answer-controls {
      display: none;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-start;
    }

    .space-answer-container:hover .space-answer-controls {
      display: flex;
    }

    .space-answer-controls button {
      border: none;
      cursor: pointer;
      padding: 5px 12px;
      border-radius: 5px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-add-line {
      background: #28a745;
      color: white;
    }

    .btn-add-line:hover {
      background: #1e7e34;
      transform: scale(1.02);
    }

    .btn-remove-line {
      background: #dc3545;
      color: white;
    }

    .btn-remove-line:hover {
      background: #c82333;
      transform: scale(1.02);
    }
  `,

  customEvents: (blockEl, blockData) => {
    const container = blockEl.querySelector(".answer-lines-container");
    const addBtn = blockEl.querySelector(".btn-add-line");
    const removeBtn = blockEl.querySelector(".btn-remove-line");

    function normalizeContent(html) {
      if (
        html === "&nbsp;" ||
        html === "<br>" ||
        html === "" ||
        html === "<div><br></div>"
      ) {
        return "";
      }
      return html;
    }

    function saveAllLines() {
      const lines = container.querySelectorAll(".answer-line");
      const linesContent = [];

      lines.forEach((line, index) => {
        let content = normalizeContent(line.innerHTML.trim());
        linesContent.push(content);
        line.setAttribute("data-line-index", index);
      });

      blockData.content = [...linesContent];
      updateBlockContent(blockData.id, { content: [...linesContent] });

      if (window.triggerAutoSave) {
        window.triggerAutoSave();
      }
    }

    function saveLine(lineElement) {
      const index = parseInt(lineElement.getAttribute("data-line-index"), 10);
      let content = normalizeContent(lineElement.innerHTML.trim());

      const lines = Array.isArray(blockData.content) ? [...blockData.content] : [];
      lines[index] = content;

      blockData.content = [...lines];
      updateBlockContent(blockData.id, { content: [...lines] });

      if (window.triggerAutoSave) {
        window.triggerAutoSave();
      }
    }

    function setupLineEvents(line) {
      if (line.hasAttribute("data-events-attached")) return;
      line.setAttribute("data-events-attached", "true");

      line.addEventListener("input", () => {
        saveLine(line);
      });

      line.addEventListener("blur", () => {
        saveLine(line);
      });
    }

    function initAllLines() {
      const existingLines = container.querySelectorAll(".answer-line");
      existingLines.forEach((line, idx) => {
        line.setAttribute("data-line-index", idx);
        setupLineEvents(line);
      });
    }

    if (addBtn) {
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newAddBtn, addBtn);

      newAddBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const newLine = document.createElement("div");
        newLine.className = "answer-line";
        newLine.setAttribute("contenteditable", "true");
        newLine.innerHTML = "<br>";

        container.appendChild(newLine);
        saveAllLines();
        setupLineEvents(newLine);
        newLine.focus();
      });
    }

    if (removeBtn) {
      const newRemoveBtn = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);

      newRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const lines = container.querySelectorAll(".answer-line");
        if (lines.length > 1) {
          lines[lines.length - 1].remove();
          saveAllLines();
        }
      });
    }

    initAllLines();

    if (!blockData.content || blockData.content.length === 0) {
      saveAllLines();
    }
  }
};

const spaceAnswerBlock = createBlockType("spaceAnswer", spaceAnswerConfig);

export const createSpaceAnswerData = spaceAnswerBlock.createData;
export const renderSpaceAnswer = spaceAnswerBlock.render;
export const attachSpaceAnswerEvents = spaceAnswerBlock.attachEvents;
export const addSpaceAnswer = spaceAnswerBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde
export function serializeSpaceAnswer(blockEl) {
  const container = blockEl.querySelector(".answer-lines-container");
  const lines = [];
  
  if (container) {
    const lineElements = container.querySelectorAll(".answer-line");
    lineElements.forEach(line => {
      let content = line.innerHTML;
      // Nettoyer le contenu vide
      if (content === "<br>" || content === "&nbsp;" || content === "") {
        lines.push("");
      } else {
        lines.push(content);
      }
    });
  }
  
  return { lines: lines };
}