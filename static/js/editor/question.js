// question.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

const questionConfig = {
  defaultTitle: "Question",
  defaultContent: "Votre question ici...",
  
  defaultWidth: 600,
  defaultHeight: 32,
  defaultLeft: 40,
  defaultTop: 40,
  
  icon: "fas fa-question-circle",
  iconColor: "#3b82f6",
  className: "question-block",
  autoStack: true,
  
  editableFields: ["content"],
  
  customHtml: (data) => {
    const questionNumber = data.questionNumber || 1;
    const contentText = data.content || questionConfig.defaultContent;
    
    return `
      <div class="question-header">
        <span class="question-number">${questionNumber}</span>
        <div class="question-text" data-field="content" contenteditable="true">
          ${contentText}
        </div>
      </div>
    `;
  },
  
  customCSS: `
    .question-number {
      flex-shrink: 0;
      width: 25px;
      height: 25px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
     
      font-size: 15px;
      margin-top: 3px;
      margin-left: -10px;
    }
    
    .question-text {
      flex: 1;
      font-size: 16px;
      line-height: 1.4;
      padding: 5px;
      word-wrap: break-word;
    }
    
    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 1px;
    }
    
  .question-block {
    background: transparent;
    padding: 0 !important;
  }
  `
};

const questionBlock = createBlockType("question", questionConfig);

export const createQuestionData = questionBlock.createData;
export const attachQuestionEvents = questionBlock.attachEvents;

// ✅ Sérialisation pour la sauvegarde
export function serializeQuestion(blockEl) {
  const questionTextEl = blockEl.querySelector('[data-field="content"]');
  const numberSpan = blockEl.querySelector('.question-number');
  
  return {
    text: questionTextEl ? questionTextEl.innerHTML : '',
    questionNumber: numberSpan ? parseInt(numberSpan.textContent) : 1
  };
}

// ✅ Rendu principal - corrigé
export const renderQuestion = (blockData) => {
  let contentText = questionConfig.defaultContent;
  let questionNumber = 1;
  
  // Extraire depuis blockData.questionNumber (priorité)
  if (blockData.questionNumber) {
    questionNumber = blockData.questionNumber;
  }
  // Extraire depuis blockData.content (qui peut être un objet)
  else if (blockData.content && typeof blockData.content === 'object') {
    contentText = blockData.content.text || questionConfig.defaultContent;
    questionNumber = blockData.content.questionNumber || 1;
  }
  // Extraire depuis blockData.content (chaîne)
  else if (typeof blockData.content === 'string') {
    contentText = blockData.content;
  }
  
  const normalizedData = {
    ...blockData,
    content: contentText,
    questionNumber: questionNumber
  };
  
  return questionBlock.render(normalizedData, false);
};

// Calcule le prochain numéro disponible
function getNextQuestionNumber() {
  const questions = document.querySelectorAll('.question-block');
  
  if (questions.length === 0) return 1;
  
  const existingNumbers = [];
  questions.forEach(question => {
    const numberSpan = question.querySelector('.question-number');
    if (numberSpan) {
      const num = parseInt(numberSpan.textContent);
      if (!isNaN(num)) existingNumbers.push(num);
    }
  });
  
  for (let i = 1; i <= existingNumbers.length + 1; i++) {
    if (!existingNumbers.includes(i)) return i;
  }
  
  return existingNumbers.length + 1;
}

// Réorganise tous les numéros des questions
export function renumberQuestions() {
  const questions = document.querySelectorAll('.question-block');
  
  questions.forEach((question, index) => {
    const newNumber = index + 1;
    const numberSpan = question.querySelector('.question-number');
    if (numberSpan) numberSpan.textContent = newNumber;
    
    const blockId = question.dataset.id;
    updateBlockContent(blockId, { questionNumber: newNumber });
  });
  
  if (window.triggerAutoSave) {
    setTimeout(() => window.triggerAutoSave(), 100);
  }
}

// Ajoute une question
export const addQuestion = (workspace) => {
  const nextNumber = getNextQuestionNumber();
  return questionBlock.add(workspace, { questionNumber: nextNumber });
};