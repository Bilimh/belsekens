// problematic.js

import { createBlockType } from "./baseBlock.js";

const problematicConfig = {
  defaultTitle: "Problématique",
  defaultContent: `Si la progression se répète de la même manière, au bout de combien de semaines Moussa aura-t-il franchi la barre des 1200 abonnés ?`,
  
  defaultWidth: 500,
  defaultHeight: 40,
  defaultLeft: 40,
  defaultTop: 40,
  
  icon: "fas fa-question-circle",
  iconColor: "#53195D",
  className: "problematic-block",
  autoStack: true,
  
  editableFields: ["content"],
  
  customHtml: (data) => {
    // ✅ Extraire le texte si content est un objet
    let contentText = data.content;
    if (typeof contentText === 'object' && contentText !== null) {
      contentText = contentText.text || contentText.content || problematicConfig.defaultContent;
    }
    if (!contentText || contentText === '') {
      contentText = problematicConfig.defaultContent;
    }
    
    return `
      <div class="problematique">
        <i class="fas fa-question-circle"></i> Problématique
      </div>
      <div class="problematique-content" data-field="content" contenteditable="true">
        ${contentText}
      </div>
    `;
  },
  
  customCSS: `
    .problematique {
      position: absolute;
      width: fit-content;
      padding: 5px;
      background: #53195D;
      color: #f9f9f9;
      top: -40px;
      left: 0px;
      border-radius: 15px;
    }
    
    .problematique-content {
      margin-top: 0px;
      font-style: italic;
      font-size: 16px;
      line-height: 1.4;
      min-height: 50px;
      padding-top: 5px;
      background-color: #E0C4F4;
      padding: 15px;
      position: relative;
    }
    .activity-problematic {
      background-color: #E0C4F4;
      padding: 15px;
      position: relative;
    }
  `
};

// Exporte les fonctions nécessaires
const problematicBlock = createBlockType("problematic", problematicConfig);

export const createProblematicData = problematicBlock.createData;
export const renderProblematic = problematicBlock.render;
export const attachProblematicEvents = problematicBlock.attachEvents;
export const addProblematic = problematicBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde
export function serializeProblematic(blockEl) {
  const contentEl = blockEl.querySelector('[data-field="content"]');
  return contentEl ? contentEl.innerHTML : '';
}