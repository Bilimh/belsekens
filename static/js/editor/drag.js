// drag.js

import { updateBlockPosition } from "./editorState.js";

export function makeDraggable(blockEl, workspace) {
  if (!workspace) {
    console.error("❌ makeDraggable: workspace est null");
    return;
  }
  
  const dragHandle = blockEl.querySelector(".drag-handle");

  let isDragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startLeft = 0;
  let startTop = 0;
  let rafId = null;
  
  // ✅ Nouvelles variables pour le drag inter-pages
  let originalPage = null;
  let currentPage = null;
  let originalWorkspace = workspace;

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = parseFloat(blockEl.style.left) || 0;
    startTop = parseFloat(blockEl.style.top) || 0;
    
    // ✅ Mémoriser la page d'origine
    originalPage = blockEl.parentElement.closest('.page-item');
    currentPage = originalPage;
    originalWorkspace = workspace;

    blockEl.style.zIndex = "1000";
    blockEl.style.opacity = "0.8";  // ✅ Feedback visuel

    if (dragHandle) {
      dragHandle.style.cursor = "grabbing";
    }
  }

  // Déplacement avec la poignée
  if (dragHandle) {
    dragHandle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      startDrag(e);
    });
  }

  // Déplacement avec clic gauche sur le bloc seulement s'il est sélectionné
  blockEl.addEventListener("mousedown", (e) => {
    const clickedButton = e.target.closest('button');
    if (clickedButton) return;
    
    const clickedEditable = e.target.closest('[contenteditable="true"]');
    const clickedResizeHandle = e.target.closest(".resize-handle");
    const clickedDeleteBtn = e.target.closest(".delete-btn");
    const clickedDragHandle = e.target.closest(".drag-handle");
    const clickedTableCell = e.target.closest(".table-cell");

    if (clickedTableCell) return;
    if (clickedEditable || clickedResizeHandle || clickedDeleteBtn || clickedDragHandle) return;
    if (e.button !== 0) return;
    if (!blockEl.classList.contains("selected")) return;

    startDrag(e);
  });

  // ✅ Détecter la page sous la souris
  function getPageUnderCursor(clientX, clientY) {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (let el of elements) {
      const page = el.closest('.page-item');
      if (page && page !== currentPage) return page;
    }
    return null;
  }

  // ✅ Déplacer le bloc vers une nouvelle page
  function moveBlockToPage(targetPage, mouseX, mouseY) {
    if (!targetPage) return false;
    
    const targetWorkspace = targetPage.querySelector('.page-content');
    if (!targetWorkspace) return false;
    
    // Calculer la position relative dans la nouvelle page
    const targetRect = targetWorkspace.getBoundingClientRect();
    let newLeft = mouseX - targetRect.left - (blockEl.offsetWidth / 2);
    let newTop = mouseY - targetRect.top - (blockEl.offsetHeight / 2);
    
    // Contraintes dans la nouvelle page
    const minLeft = 10;
    const maxLeft = targetWorkspace.clientWidth - blockEl.offsetWidth - 10;
    const minTop = 10;
    const maxTop = Math.max(targetWorkspace.clientHeight, targetWorkspace.scrollHeight) - blockEl.offsetHeight - 10;
    
    newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
    newTop = Math.min(maxTop, Math.max(minTop, newTop));
    
    // Déplacer le bloc
    blockEl.remove();
    targetWorkspace.appendChild(blockEl);
    blockEl.style.left = `${newLeft}px`;
    blockEl.style.top = `${newTop}px`;
    
    // Mettre à jour les références
    currentPage = targetPage;
    blockEl.dataset.page = targetPage.dataset.pageNumber;
    
    // Mettre à jour startLeft/startTop pour la suite du drag
    startLeft = newLeft;
    startTop = newTop;
    startMouseX = mouseX;
    startMouseY = mouseY;
    
    console.log(`🔄 Bloc déplacé vers la page ${targetPage.dataset.pageNumber}`);
    return true;
  }

  // Drag avec requestAnimationFrame et changement de page
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      
      // Contraintes dans la page courante
      const currentWorkspace = currentPage?.querySelector('.page-content');
      if (currentWorkspace) {
        const minLeft = 10;
        const maxLeft = currentWorkspace.clientWidth - blockEl.offsetWidth - 10;
        const minTop = 10;
        const maxTop = Math.max(currentWorkspace.clientHeight, currentWorkspace.scrollHeight) - blockEl.offsetHeight - 10;

        newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
        newTop = Math.min(maxTop, Math.max(minTop, newTop));
      }

      blockEl.style.left = `${newLeft}px`;
      blockEl.style.top = `${newTop}px`;
      
      // ✅ Vérifier si on change de page
      const targetPage = getPageUnderCursor(e.clientX, e.clientY);
      if (targetPage) {
        moveBlockToPage(targetPage, e.clientX, e.clientY);
      }
      
      rafId = null;
    });
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    isDragging = false;
    blockEl.style.zIndex = "1";
    blockEl.style.opacity = "1";  // ✅ Restaurer l'opacité

    if (dragHandle) {
      dragHandle.style.cursor = "grab";
    }

    const blockId = blockEl.dataset.id;
    const left = parseInt(blockEl.style.left, 10);
    const top = parseInt(blockEl.style.top, 10);
    const newPageNumber = currentPage?.dataset.pageNumber;
    const oldPageNumber = originalPage?.dataset.pageNumber;

    if (!isNaN(left) && !isNaN(top)) {
      updateBlockPosition(blockId, left, top);
      
      // ✅ Si la page a changé, journaliser
      if (newPageNumber !== oldPageNumber) {
        console.log(`📄 Bloc ${blockId} déplacé de la page ${oldPageNumber} vers la page ${newPageNumber}`);
        // L'auto-save enregistrera automatiquement
        if (window.triggerAutoSave) {
          setTimeout(() => window.triggerAutoSave(), 50);
        }
      }
    }
    
    originalPage = null;
    currentPage = null;
  });
}