// delete.js

import { removeBlockFromState } from "./editorState.js";
import { renumberQuestions } from "./question.js";

export function makeDeletable(blockEl) {
  const deleteBtn = blockEl.querySelector(".delete-btn");
  if (!deleteBtn) return;

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const blockId = blockEl.dataset.id;
    const isQuestion = blockEl.classList.contains('question-block');
    
    console.log("🗑️ Suppression bloc:", blockId);
    
    // Supprimer du DOM
    blockEl.remove();
    
    // Supprimer de l'état
    removeBlockFromState(blockId);
    
    // Si c'est une question, réorganiser les numéros
    if (isQuestion) {
      renumberQuestions();
    }
    
    // Déclencher l'auto-save
    if (window.triggerAutoSave) {
      setTimeout(() => window.triggerAutoSave(), 50);
    }
  });
}