import { serializeBlock } from "./blockRegistry.js";
import { addSituation } from "./situation.js";
import { addProblematic } from "./problematic.js";
import { addText } from "./text.js";
import { addImage } from "./image.js";
import { addVideo } from "./video.js";
import { addAudio } from "./audio.js"
import { addQuestion } from "./question.js";
import { addSpaceAnswer } from "./spaceAnswer.js";
import { addTable } from "./table.js";
import { addGraph } from "./graph.js";
import { addQcm } from "./qcm.js";
//import { addMindmap } from "./mindmap.js";
import { addMindmap } from "./mindmap/index.js";

import { makeDraggable } from "./drag.js";
import { makeDeletable } from "./delete.js";
import { makeResizable } from "./resize.js";
import { editorState, syncBlocksFromDOM } from "./editorState.js";
import { renderDocument } from "./documentRenderer.js";
import { setupBlockSelection, setupGlobalUnselect } from "./selection.js";

// ✅ SUPPRIMER cette ligne fixe
// const workspace = document.querySelector('.page-content');

const addSituationBtn = document.getElementById("add-situation-btn");
const addProblematicBtn = document.getElementById("add-problematic-btn");
const addTextBtn = document.getElementById("add-text-btn");
const addImageBtn = document.getElementById("add-image-btn");
const addQuestionBtn = document.getElementById("add-question-btn");
const addSpaceAnswerBtn = document.getElementById("add-spaceanswer-btn");
const addTableBtn = document.getElementById("add-table-btn");
const addGraphBtn = document.getElementById("add-graph-btn");
const addQcmBtn = document.getElementById("add-qcm-btn");
const addVideoBtn = document.getElementById("add-video-btn");
const addAudioBtn = document.getElementById("add-audio-btn");
const addMindmapBtn = document.getElementById("add-mindmap-btn");

const saveDocumentBtn = document.getElementById("save-document-btn");

setupGlobalUnselect();

const documentId = window.BELSEKENS_DOCUMENT_ID;

const initialDataElement = document.getElementById("initial-document-data");
const initialDocument = initialDataElement
  ? JSON.parse(initialDataElement.textContent)
  : { blocks: [] };

// ✅ Rendu initial CORRIGÉ - utiliser pages-container
setTimeout(() => {
  const container = document.getElementById('pages-container');
  if (container && initialDocument) {
    renderDocument(initialDocument, container);
  }
}, 100);

// Variables pour l'auto-save
let autoSaveTimer = null;
let isSaving = false;
let hasUnsavedChanges = false;

// Sauvegarde du titre original
const originalTitle = document.title;

function updatePageTitle() {
  if (hasUnsavedChanges) {
    if (!document.title.includes('• Non sauvegardé')) {
      document.title = originalTitle + ' • Non sauvegardé';
    }
  } else {
    document.title = originalTitle;
  }
}

async function saveDocument() {
  if (isSaving) return;

  isSaving = true;

  // ✅ Récupérer la structure complète des pages depuis le DOM
  const pages = [];
  const pageItems = document.querySelectorAll('#pages-container .page-item');
  
  pageItems.forEach((page, idx) => {
    const pageNumber = parseInt(page.dataset.pageNumber) || (idx + 1);
    const pageContent = page.querySelector('.page-content');
    const blocks = [];
    
    if (pageContent) {
      pageContent.querySelectorAll('.block').forEach(block => {
        // Récupérer le contenu selon le type
        let content = {};
        const blockType = block.dataset.type;
        
        if (blockType === 'situation' || blockType === 'problematic' || blockType === 'text') {
          const contentEl = block.querySelector('[data-field="content"]');
          content = contentEl ? contentEl.innerHTML : '';
        } else if (blockType === 'image') {
          const img = block.querySelector('img');
          content = { src: img?.src || '', alt: img?.alt || '' };
        } else if (blockType === 'graph') {
          content = { type: 'bar' };
        } else if (blockType === 'qcm') {
          content = {};
        } else {
          content = {};
        }
        
        blocks.push({
          id: block.dataset.id,
          type: blockType,
          position: {
            left: parseInt(block.style.left) || 40,
            top: parseInt(block.style.top) || 40
          },
          size: {
            width: block.offsetWidth,
            height: block.offsetHeight
          },
          content: serializeBlock(block)
        });
      });
    }
    
    pages.push({
      pageNumber: pageNumber,
      blocks: blocks
    });
  });

  // ✅ Structure complète avec pages
  const syncedState = { pages: pages };

  const cheminDossier = window.BELSEKENS_CHEMIN_DOSSIER;
  const fichierSlug = window.BELSEKENS_FICHIER_SLUG;
  const url = `/api/save/${cheminDossier}/fichier/${fichierSlug}/`;

  //console.log("📤 Sauvegarde:", pages.length, "pages");
  //console.log("📦 Pages:", pages.map(p => `${p.pageNumber}: ${p.blocks.length} blocs`));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie('csrftoken')
      },
      body: JSON.stringify(syncedState)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      hasUnsavedChanges = false;
      updatePageTitle();
      //console.log("✅ Document sauvegardé avec", pages.length, "pages");
      showAutoSaveNotification();
    } else {
      console.error("❌ Erreur:", result.error);
      showErrorNotification("Erreur lors de la sauvegarde");
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
    showErrorNotification("Erreur réseau");
  } finally {
    isSaving = false;
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function showAutoSaveNotification() {
  const existingNotif = document.querySelector('.auto-save-notification');
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement('div');
  notification.className = 'auto-save-notification success';
  notification.innerHTML = '<i class="fas fa-check-circle"></i> Sauvegardé';
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function showErrorNotification(message) {
  const existingNotif = document.querySelector('.auto-save-notification');
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement('div');
  notification.className = 'auto-save-notification error';
  notification.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ✅ addBlock CORRIGÉE - utilise le workspace passé en paramètre
function addBlock(blockAddFunction, targetWorkspace, blockName) {
  let workspace = targetWorkspace;

  if (!workspace && typeof window.getCurrentPageContent === 'function') {
    workspace = window.getCurrentPageContent();
  }

  if (!workspace) {
    const activeElement = document.activeElement;
    const activePage = activeElement?.closest('.page-content');
    if (activePage) workspace = activePage;
  }

  if (!workspace) {
    const pages = document.querySelectorAll('.page-content');
    if (pages.length > 0) workspace = pages[pages.length - 1];
  }

  if (!workspace) {
    console.error("❌ Aucune page active");
    window.showToast("Veuillez sélectionner une page", "error");
    return null;
  }

  const blockEl = blockAddFunction(workspace, {});

  if (blockEl) {
    const currentPage = workspace.closest('.page-item');
    if (currentPage) {
      blockEl.dataset.page = currentPage.dataset.pageNumber;
    }

    setupBlockSelection(blockEl, workspace);
    makeDraggable(blockEl, workspace);
    makeDeletable(blockEl);
    makeResizable(blockEl);

    //console.log(`✅ ${blockName} ajouté`);
    triggerAutoSave();
  }

  return blockEl;
}

function triggerAutoSave() {
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
    updatePageTitle();
  }

  if (autoSaveTimer) clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(() => {
    if (hasUnsavedChanges && !isSaving) saveDocument();
  }, 3000);
}

function setupAutoSaveDetection() {
  document.addEventListener('input', (e) => {
    if (e.target.closest('[contenteditable="true"]')) triggerAutoSave();
  });

  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('.block')) triggerAutoSave();
  });

  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('.resize-handle')) triggerAutoSave();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) setTimeout(() => triggerAutoSave(), 100);
  });

  const allAddButtons = [addSituationBtn, addProblematicBtn, addTextBtn, addImageBtn,
    addQuestionBtn, addSpaceAnswerBtn, addTableBtn, addGraphBtn, addQcmBtn,addVideoBtn,addAudioBtn,addMindmapBtn].filter(btn => btn);
  allAddButtons.forEach(btn => {
    if (btn) btn.addEventListener('click', () => setTimeout(() => triggerAutoSave(), 100));
  });
}

if (saveDocumentBtn) {
  saveDocumentBtn.addEventListener("click", async () => {
    await saveDocument();
    if (!hasUnsavedChanges) {
      const notification = document.createElement('div');
      notification.className = 'auto-save-notification success';
      notification.innerHTML = '<i class="fas fa-save"></i> Document sauvegardé !';
      document.body.appendChild(notification);
      setTimeout(() => notification.classList.add('show'), 10);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }
  });
}

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges && !isSaving) {
    saveDocument();
  }
});

setInterval(() => {
  if (hasUnsavedChanges && !isSaving) saveDocument();
}, 30000);

setupAutoSaveDetection();

// ✅ ÉVÉNEMENTS CORRIGÉS - obtiennent la page active à chaque clic
function getActiveWorkspace() {
  return window.getCurrentPageContent?.() || document.querySelector('.page-content:last-child');
}

if (addSituationBtn) {
  addSituationBtn.addEventListener("click", () => {
    addBlock(addSituation, getActiveWorkspace(), "Situation");
  });
}

if (addProblematicBtn) {
  addProblematicBtn.addEventListener("click", () => {
    addBlock(addProblematic, getActiveWorkspace(), "Problématique");
  });
}

if (addTextBtn) {
  addTextBtn.addEventListener("click", () => {
    addBlock(addText, getActiveWorkspace(), "Texte");
  });
}

if (addImageBtn) {
  addImageBtn.addEventListener("click", () => {
    addBlock(addImage, getActiveWorkspace(), "Image");
  });
}

if (addQuestionBtn) {
  addQuestionBtn.addEventListener("click", () => {
    addBlock(addQuestion, getActiveWorkspace(), "Question");
  });
}

if (addSpaceAnswerBtn) {
  addSpaceAnswerBtn.addEventListener("click", () => {
    addBlock(addSpaceAnswer, getActiveWorkspace(), "Espace de réponse");
  });
}

if (addTableBtn) {
  addTableBtn.addEventListener("click", () => {
    addBlock(addTable, getActiveWorkspace(), "Tableau");
  });
}

if (addGraphBtn) {
  addGraphBtn.addEventListener("click", () => {
    addBlock(addGraph, getActiveWorkspace(), "Graphe");
  });
}

if (addQcmBtn) {
  addQcmBtn.addEventListener("click", () => {
    addBlock(addQcm, getActiveWorkspace(), "Qcm");
  });
}
if (addVideoBtn) {
  addVideoBtn.addEventListener("click", () => {
    addBlock(addVideo, getActiveWorkspace(), "Vidéo");
  });
}
if (addAudioBtn) {
  addAudioBtn.addEventListener("click", () => {
    addBlock(addAudio, getActiveWorkspace(), "Audio");
  });
}
if (addMindmapBtn) {
  addMindmapBtn.addEventListener("click", () => {
    addBlock(addMindmap, getActiveWorkspace(), "Carte mentale");
  });
}

setTimeout(() => {
  if (editorState.blocks.length > 0 && !hasUnsavedChanges) saveDocument();
}, 1000);

if (typeof window !== 'undefined') {
  window.debug = {
    saveDocument,
    triggerAutoSave,
    getState: () => editorState,
    syncBlocks: () => syncBlocksFromDOM()
  };
}