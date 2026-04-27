// documentRenderer.js

import { setBlocks } from "./editorState.js";
import { renderBlock } from "./blockRegistry.js";
import { makeDraggable } from "./drag.js";
import { makeDeletable } from "./delete.js";
import { makeResizable } from "./resize.js";
import { setupBlockSelection } from "./selection.js";

export function renderDocument(documentData, container) {
  const pages = documentData.pages || [];
  const blocks = documentData.blocks || [];
  
  if (pages.length > 0) {
    renderMultiPage(pages);
  } 
  else if (blocks.length > 0) {
    let workspace = container;
    if (!workspace || workspace.id === 'pages-container') {
      workspace = document.querySelector('.page-content');
    }
    if (workspace) {
      renderSinglePage(blocks, workspace);
    }
  }
}

function renderMultiPage(pages) {
  const container = document.getElementById('pages-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  pages.forEach((page, idx) => {
    const pageNumber = page.pageNumber || (idx + 1);
    const pageBlocks = page.blocks || [];
    
    // Créer la page
    const pageId = Date.now() + '-' + pageNumber;
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-item';
    pageDiv.id = `page-${pageId}`;
    pageDiv.dataset.pageNumber = pageNumber;
    pageDiv.innerHTML = `
      <div class="page-header">
        <span class="page-number">Page ${pageNumber}</span>
        <button class="btn-delete-page" data-page="${pageNumber}">
          <i class="fas fa-trash-alt"></i> Supprimer
        </button>
      </div>
      <div class="page-content" id="page-content-${pageId}" style="position: relative; min-height: 500px;"></div>
    `;
    
    //Clic sur l'onglet → page active + bordure verte
    pageDiv.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-page')) return;
        if (typeof window.setActivePage === 'function') {
            window.setActivePage(pageNumber);
        }
    });
    container.appendChild(pageDiv);
    
    const pageContent = pageDiv.querySelector('.page-content');
    if (!pageContent) return;
    
    // Ajouter les blocs
    pageBlocks.forEach(blockData => {
      // ✅ Normalisation complète des données
      let renderData = { ...blockData };
      
      // ✅ Pour les blocs situation, extraire correctement les données
      if (blockData.type === 'situation' && blockData.content && typeof blockData.content === 'object') {
        renderData.title = blockData.content.title || blockData.title;
        renderData.content = blockData.content.content || blockData.content;
        renderData.imageUrl = blockData.content.imageUrl || null;
        renderData.imageCaption = blockData.content.imageCaption || "";
      }
      // Pour les autres blocs avec content objet
      else if (blockData.content && typeof blockData.content === 'object') {
        if (blockData.content.text) {
          renderData.content = blockData.content.text;
        }
        if (blockData.content.questionNumber) {
          renderData.questionNumber = blockData.content.questionNumber;
        }
        if (blockData.content.content) {
          renderData.content = blockData.content.content;
        }
      }
      
      // Si questionNumber est dans blockData directement
      if (blockData.questionNumber) {
        renderData.questionNumber = blockData.questionNumber;
      }
      
      //console.log("🔵 RENDERER - blockData normalisé:", renderData);
      
      const blockEl = renderBlock(renderData);
      if (!blockEl) return;

      if (blockData.type === 'situation' && blockData.imageUrl) {
        // Attendre que le bloc soit dans le DOM
        setTimeout(() => {
          const placeholder = blockEl.querySelector('[data-action="upload-image"]');
          if (placeholder && blockData.imageUrl) {
            // Appeler setupImageUpload via le bloc
            const blockInstance = situationBlock;
            if (blockInstance && blockInstance.setupImageUpload) {
              blockInstance.setupImageUpload(blockEl, blockData);
            }
          }
        }, 10);
      }

      blockEl.dataset.page = pageNumber;
      
      // Appliquer position et taille
      if (blockData.position) {
        blockEl.style.left = `${blockData.position.left}px`;
        blockEl.style.top = `${blockData.position.top}px`;
      }
      if (blockData.size) {
        blockEl.style.width = `${blockData.size.width}px`;
        blockEl.style.minHeight = `${blockData.size.height}px`;
      }
      
      pageContent.appendChild(blockEl);
      setupBlockSelection(blockEl, pageContent);
      makeDraggable(blockEl, pageContent);
      makeDeletable(blockEl);
      makeResizable(blockEl);
    });
  });
  
  // Ajouter le bouton "Ajouter une page"
  const addBtnContainer = document.createElement('div');
  addBtnContainer.className = 'add-page-container';
  addBtnContainer.innerHTML = `
    <button class="btn-add-page" id="add-new-page-btn">
      <i class="fas fa-plus"></i> Ajouter une page
    </button>
  `;
  container.appendChild(addBtnContainer);
  
  const addBtn = document.getElementById('add-new-page-btn');
  if (addBtn && typeof window.addPage === 'function') {
    addBtn.addEventListener('click', window.addPage);
  }
  
  // Attacher événements suppression
  document.querySelectorAll('.btn-delete-page').forEach(btn => {
    btn.removeEventListener('click', handleDelete);
    btn.addEventListener('click', handleDelete);
  });
  if (typeof window.updatePageTabs === 'function') {
    setTimeout(() => {
        window.updatePageTabs();
        console.log('✅ Onglets mis à jour depuis renderMultiPage');
    }, 50);
}
}

function renderSinglePage(blocks, workspace) {
  if (!workspace) return;
  
  workspace.innerHTML = "";
  setBlocks(blocks);
  
  blocks.forEach((blockData) => {
    let renderData = { ...blockData };
    
    if (blockData.type === 'situation' && blockData.content && typeof blockData.content === 'object') {
      renderData.title = blockData.content.title || blockData.title;
      renderData.content = blockData.content.content || blockData.content;
      renderData.imageUrl = blockData.content.imageUrl || null;
      renderData.imageCaption = blockData.content.imageCaption || "";
    }
    else if (blockData.content && typeof blockData.content === 'object') {
      if (blockData.content.text) renderData.content = blockData.content.text;
      else if (blockData.content.content) renderData.content = blockData.content.content;
      if (blockData.content.questionNumber) {
        renderData.questionNumber = blockData.content.questionNumber;
      }
    }
    
    if (blockData.questionNumber) {
      renderData.questionNumber = blockData.questionNumber;
    }
    
    const blockEl = renderBlock(renderData);
    if (!blockEl) return;
    
    if (blockData.position) {
      blockEl.style.left = `${blockData.position.left}px`;
      blockEl.style.top = `${blockData.position.top}px`;
    }
    if (blockData.size) {
      blockEl.style.width = `${blockData.size.width}px`;
      blockEl.style.minHeight = `${blockData.size.height}px`;
    }
    
    workspace.appendChild(blockEl);
    setupBlockSelection(blockEl, workspace);
    makeDraggable(blockEl, workspace);
    makeDeletable(blockEl);
    makeResizable(blockEl);
  });
}

function handleDelete(e) {
  e.stopPropagation();
  const pageNumber = parseInt(e.currentTarget.getAttribute('data-page'));
  if (typeof window.deletePage === 'function') {
    window.deletePage(pageNumber, e.currentTarget);
  }
}