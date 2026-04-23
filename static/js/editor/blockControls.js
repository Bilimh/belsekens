export function attachBlockControls(blockEl) {
    const hasInner = blockEl.querySelector(".block-inner");
    if (!hasInner) {
      const children = Array.from(blockEl.children);
      const inner = document.createElement("div");
      inner.className = "block-inner";
      
      children.forEach(child => {
        if (!child.classList?.contains('block-tool') && 
            !child.classList?.contains('resize-handle')) {
          inner.appendChild(child);
        }
      });
      
      blockEl.insertBefore(inner, blockEl.firstChild);
    }
  
    if (!blockEl.querySelector(".delete-btn")) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn block-tool";
      deleteBtn.type = "button";
      deleteBtn.title = "Supprimer";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      blockEl.appendChild(deleteBtn);
    }
  
    if (!blockEl.querySelector(".drag-handle")) {
      const dragHandle = document.createElement("div");
      dragHandle.className = "drag-handle block-tool";
      dragHandle.title = "Déplacer";
      dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
      blockEl.appendChild(dragHandle);
    }
  
    const resizeHandles = [
      "resize-top-left",
      "resize-top-right", 
      "resize-bottom-left",
      "resize-bottom-right",
      "resize-middle-left",
      "resize-middle-right",
      "resize-middle-top",
      "resize-middle-bottom"
    ];
  
    resizeHandles.forEach((className) => {
      if (!blockEl.querySelector(`.${className}`)) {
        const handle = document.createElement("div");
        handle.className = `resize-handle ${className}`;
        blockEl.appendChild(handle);
      }
    });
  }