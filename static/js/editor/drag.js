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
  let rafId = null;  // ✅ Pour requestAnimationFrame

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = parseFloat(blockEl.style.left) || 0;
    startTop = parseFloat(blockEl.style.top) || 0;

    blockEl.style.zIndex = "1000";

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
    // ✅ Ignorer les clics sur les boutons
    const clickedButton = e.target.closest('button');
    if (clickedButton) {
      return;
    }
    
    const clickedEditable = e.target.closest('[contenteditable="true"]');
    const clickedResizeHandle = e.target.closest(".resize-handle");
    const clickedDeleteBtn = e.target.closest(".delete-btn");
    const clickedDragHandle = e.target.closest(".drag-handle");
    const clickedTableCell = e.target.closest(".table-cell");

    if (clickedTableCell) {
      return;
    }

    if (clickedEditable || clickedResizeHandle || clickedDeleteBtn || clickedDragHandle) {
      return;
    }

    if (e.button !== 0) return;

    if (!blockEl.classList.contains("selected")) {
      return;
    }

    startDrag(e);
  });

  // ✅ Version optimisée avec requestAnimationFrame
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      
      const minLeft = 10;
      const maxLeft = workspace.clientWidth - blockEl.offsetWidth - 10;
      const minTop = 10;
      const maxTop = Math.max(workspace.clientHeight, workspace.scrollHeight) - blockEl.offsetHeight - 10;

      if (newLeft < minLeft) newLeft = minLeft;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < minTop) newTop = minTop;
      if (newTop > maxTop) newTop = maxTop;

      blockEl.style.left = `${newLeft}px`;
      blockEl.style.top = `${newTop}px`;
      
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

    if (dragHandle) {
      dragHandle.style.cursor = "grab";
    }

    const blockId = blockEl.dataset.id;
    const left = parseInt(blockEl.style.left, 10);
    const top = parseInt(blockEl.style.top, 10);

    if (!isNaN(left) && !isNaN(top)) {
      updateBlockPosition(blockId, left, top);
    }
  });
}