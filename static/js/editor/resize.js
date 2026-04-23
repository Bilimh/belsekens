// resize.js

import { updateBlockSize, updateBlockPosition } from "./editorState.js";

export function makeResizable(blockEl) {
  // Ajouter les handles de redimensionnement s'ils n'existent pas
  if (!blockEl.querySelector('.resize-handle')) {
    addResizeHandles(blockEl);
  }
  
  const handles = blockEl.querySelectorAll(".resize-handle");
  if (!handles.length) return;

  // ✅ Détecter si c'est un bloc tableau
  const isTableBlock = blockEl.classList.contains('table-block');

  handles.forEach(handle => {
    handle.removeEventListener('mousedown', handleMouseDown);
    
    function handleMouseDown(e) {
      e.stopPropagation();
      e.preventDefault();

      let isResizing = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = blockEl.offsetWidth;
      const startHeight = blockEl.offsetHeight;
      const startLeft = blockEl.offsetLeft;
      const startTop = blockEl.offsetTop;

      const workspace = blockEl.parentElement;
      if (!workspace) return;
      
      const workspaceRect = workspace.getBoundingClientRect();
      
      const paddingLeft = parseInt(getComputedStyle(workspace).paddingLeft) || 0;
      const paddingTop = parseInt(getComputedStyle(workspace).paddingTop) || 0;
      const paddingRight = parseInt(getComputedStyle(workspace).paddingRight) || 0;
      const paddingBottom = parseInt(getComputedStyle(workspace).paddingBottom) || 0;
      
      const maxWidth = workspaceRect.width - 20;
      const maxHeight = workspaceRect.height - 20;
      const minWidth = 200;
      const minHeight = 100;

      const handleType = handle.classList[1];

      function onMouseMove(moveEvent) {
        if (!isResizing) return;

        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        switch (handleType) {
          case 'resize-bottom-right':
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
            break;
          case 'resize-bottom-left':
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
            newLeft = startLeft + dx;
            break;
          case 'resize-top-right':
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
            newTop = startTop + dy;
            break;
          case 'resize-top-left':
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;
            newLeft = startLeft + dx;
            newTop = startTop + dy;
            break;
          case 'resize-middle-right':
            newWidth = startWidth + dx;
            break;
          case 'resize-middle-left':
            newWidth = startWidth - dx;
            newLeft = startLeft + dx;
            break;
          case 'resize-middle-bottom':
            newHeight = startHeight + dy;
            break;
          case 'resize-middle-top':
            newHeight = startHeight - dy;
            newTop = startTop + dy;
            break;
        }

        // Contraintes de largeur
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;

        // Contraintes de hauteur
        if (newHeight < minHeight) newHeight = minHeight;
        if (newHeight > maxHeight) newHeight = maxHeight;

        // ✅ Pour les blocs tableau, ne pas modifier la position
        if (!isTableBlock) {
          // Contraintes de position
          if (newLeft < paddingLeft) newLeft = paddingLeft;
          if (newLeft + newWidth > workspaceRect.width - paddingRight) {
            newLeft = workspaceRect.width - newWidth - paddingRight;
          }
          if (newTop < paddingTop) newTop = paddingTop;
          if (newTop + newHeight > workspaceRect.height - paddingBottom) {
            newTop = workspaceRect.height - newHeight - paddingBottom;
          }
          
          // Application des nouvelles positions (uniquement pour les blocs non-tableau)
          blockEl.style.left = `${newLeft}px`;
          blockEl.style.top = `${newTop}px`;
        }

        // Application des nouvelles dimensions (pour tous les blocs)
        blockEl.style.width = `${newWidth}px`;
        blockEl.style.minHeight = `${newHeight}px`;
        blockEl.style.height = `${newHeight}px`;
      }

      function onMouseUp() {
        if (!isResizing) return;
        
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const blockId = blockEl.dataset.id;
        if (blockId) {
          updateBlockSize(blockId, blockEl.offsetWidth, blockEl.offsetHeight);

          // ✅ Pour les blocs non-tableau, mettre à jour la position
          if (!isTableBlock) {
            const newLeft = parseInt(blockEl.style.left);
            const newTop = parseInt(blockEl.style.top);
            if (newLeft !== startLeft || newTop !== startTop) {
              updateBlockPosition(blockId, newLeft, newTop);
            }
          }
        }
        
        if (window.triggerAutoSave) {
          window.triggerAutoSave();
        }
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    
    handle.addEventListener('mousedown', handleMouseDown);
    handle._mouseDownHandler = handleMouseDown;
  });
}

// Fonction pour ajouter les handles de redimensionnement
function addResizeHandles(blockEl) {
  const handles = [
    { class: 'resize-handle resize-top-left', position: 'top-left' },
    { class: 'resize-handle resize-top-right', position: 'top-right' },
    { class: 'resize-handle resize-bottom-left', position: 'bottom-left' },
    { class: 'resize-handle resize-bottom-right', position: 'bottom-right' },
    { class: 'resize-handle resize-middle-left', position: 'middle-left' },
    { class: 'resize-handle resize-middle-right', position: 'middle-right' },
    { class: 'resize-handle resize-middle-top', position: 'middle-top' },
    { class: 'resize-handle resize-middle-bottom', position: 'middle-bottom' }
  ];
  
  handles.forEach(handle => {
    const handleEl = document.createElement('div');
    handleEl.className = handle.class;
    blockEl.appendChild(handleEl);
  });
}