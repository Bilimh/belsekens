// situation.js

import { createBlockType } from "./baseBlock.js";

const situationConfig = {
  // Valeurs par défaut
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
  
  // Layout personnalisé
  layout: "custom",
  
  // Champs éditables
  editableFields: ["title", "content", "imageCaption"],
  
  // Upload d'image
  enableImageUpload: true,
  imageWidth: 270,
  imageHeight: 180,
  
  // Styles personnalisés
  customStyles: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden"
  },
  
  autoStack: true,
  
  // HTML personnalisé
  customHtml: (data) => {
    const hasImage = data.imageUrl && data.imageUrl !== "";
    
    // ✅ Extraire le texte si content est un objet
    let contentText = data.content;
    if (typeof contentText === 'object' && contentText !== null) {
      contentText = contentText.text || contentText.content || situationConfig.defaultContent;
    }
    if (!contentText || contentText === '') {
      contentText = situationConfig.defaultContent;
    }
    
    return `
      <div class="situation-activite_header">
        <p class="situation-activite_header_title" data-field="title">
          ${data.title}
        </p>
      </div>
      <div class="situation-context-container">
        <div class="situation-article">
          ${hasImage ? `
            <div class="situation-image-wrapper" style="float: right; width: ${270}px; margin: 0 0 10px 15px;">
              <img src="${data.imageUrl}" alt="${data.imageCaption || 'Image'}" style="width: 100%; height: ${180}px; object-fit: cover; border-radius: 6px;">
              ${data.imageCaption ? `<div class="situation-image-caption" style="font-size: 11px; color: #666; text-align: center; margin-top: 5px;" data-field="imageCaption" contenteditable="true">${data.imageCaption}</div>` : ''}
            </div>
          ` : `
            <div class="situation-image-upload-area" data-action="upload-image" style="float: right; width: 270px; height: 180px; background: #f0f0f0; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; margin: 0 0 10px 15px;">
              <i class="fas fa-camera" style="font-size: 24px; color: #666; margin-bottom: 5px;"></i>
              <span style="color: #666; font-size: 11px; text-align: center;">Cliquer pour ajouter une image</span>
            </div>
          `}
          <div class="situation-text" style="border: 2px solid #E0C4F4; border-radius: 5px; margin-top: 5px; line-height: 1.3rem;">
            <div style="padding: 10px;" data-field="content" contenteditable="true">
              ${contentText}
            </div>
          </div>
          <div style="clear: both;"></div>
        </div>
      </div>
    `;
  },
  
  // Styles CSS personnalisés
  customCSS: `
    .situation-activite_header_title {
      font-size: 1.5rem;
      line-height: 1.75rem;
      color: #53195D;
      font-family: 'Noto Sans', sans-serif;
      font-weight: bold;
      margin-bottom: 7.5px;
      padding: 0 5px;
    }
    
    .situation-article {
      width: 100%;
      margin: auto;
    }
    
    .situation-text ul, .situation-text ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    
    .situation-text li {
      margin: 5px 0;
    }
    
    .situation-image-upload-area:hover {
      background: #e8e8e8 !important;
      border: 2px dashed #53195D;
    }
    
    .situation-image-wrapper {
      transition: all 0.2s ease;
    }
    
    .situation-image-wrapper img {
      transition: transform 0.2s ease;
    }
    
    .situation-image-wrapper img:hover {
      transform: scale(1.02);
    }
    
    .situation-image-caption {
      cursor: text;
    }
    
    .situation-image-caption:hover {
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
    }
  `
};

// Crée le bloc situation
const situationBlock = createBlockType("situation", situationConfig);

// Exporte les fonctions
export const createSituationData = situationBlock.createData;
export const renderSituation = situationBlock.render;
export const attachSituationEvents = situationBlock.attachEvents;
export const addSituation = situationBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde
export function serializeSituation(blockEl) {
  const titleEl = blockEl.querySelector('[data-field="title"]');
  const contentEl = blockEl.querySelector('[data-field="content"]');
  const imageCaptionEl = blockEl.querySelector('[data-field="imageCaption"]');
  const imageEl = blockEl.querySelector('img');
  
  return {
    title: titleEl ? titleEl.innerHTML : '',
    content: contentEl ? contentEl.innerHTML : '',
    imageUrl: imageEl ? imageEl.src : null,
    imageCaption: imageCaptionEl ? imageCaptionEl.innerHTML : ''
  };
}