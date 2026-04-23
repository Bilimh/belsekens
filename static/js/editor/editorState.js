// editorState.js

export const editorState = {
  blocks: []
};

export function setBlocks(blocks) {
  editorState.blocks = blocks;
  console.log('État initialisé:', editorState.blocks);
}

export function addBlockToState(blockData) {
  editorState.blocks.push(blockData);
  console.log('Bloc ajouté à l\'état:', blockData);
}

export function removeBlockFromState(blockId) {
  // Convertir en nombre si c'est une chaîne
  const id = typeof blockId === 'string' ? parseInt(blockId) : blockId;
  const before = editorState.blocks.length;
  editorState.blocks = editorState.blocks.filter((block) => block.id !== id);
  console.log(`Bloc ${blockId} supprimé (${before} -> ${editorState.blocks.length})`);
}

export function updateBlockPosition(blockId, left, top) {
  const block = editorState.blocks.find((b) => b.id === blockId);
  if (!block) return;
  
  block.position = { left, top };
  console.log(`Position mise à jour pour ${blockId}:`, block.position);
}

export function updateBlockContent(blockId, updates) {
  const block = editorState.blocks.find((b) => b.id === blockId);
  if (!block) return;
  
  Object.assign(block, updates);
  console.log(`Contenu mis à jour pour ${blockId}:`, block);
}

export function updateBlockSize(blockId, width, height) {
  const block = editorState.blocks.find((b) => b.id === blockId);
  if (!block) return;
  
  block.size = { width, height };
  console.log(`Taille mise à jour pour ${blockId}:`, block.size);
}

// editorState.js - modifier la fonction syncBlocksFromDOM

export function syncBlocksFromDOM() {
  const blocks = document.querySelectorAll('.block');
  const domBlockIds = new Set();
  
  blocks.forEach(blockEl => {
    const blockId = blockEl.dataset.id;
    domBlockIds.add(blockId);
    
    let block = editorState.blocks.find(b => b.id === blockId);
    
    // Si le bloc n'existe pas dans l'état, on le crée
    if (!block) {
      block = { id: blockId };
      editorState.blocks.push(block);
    }
    
    // Synchronise la position
    const left = parseInt(blockEl.style.left);
    const top = parseInt(blockEl.style.top);
    if (!isNaN(left) && !isNaN(top)) {
      block.position = { left, top };
    }
    
    // Synchronise la taille
    const width = blockEl.offsetWidth;
    const height = blockEl.offsetHeight;
    if (width && height) {
      block.size = { width, height };
    }
    
    // Synchronise le type
    block.type = blockEl.classList[1]?.replace('-block', '') || 'unknown';
    
    // ✅ Pour les questions, préserver le numéro du DOM
    if (block.type === 'question') {
      const numberSpan = blockEl.querySelector('.question-number');
      if (numberSpan) {
        const questionNumber = parseInt(numberSpan.textContent);
        if (!isNaN(questionNumber)) {
          block.questionNumber = questionNumber;
        }
      }
    }
    
    // Synchronise le contenu pour les blocs situation
    if (block.type === 'situation') {
      const titleEl = blockEl.querySelector('[data-field="title"]');
      const contentEl = blockEl.querySelector('[data-field="content"]');
      
      if (titleEl) block.title = titleEl.textContent.trim();
      if (contentEl) block.content = contentEl.textContent.trim();
    }
  });
  
  // Supprimer les blocs qui ne sont plus dans le DOM
  editorState.blocks = editorState.blocks.filter(block => domBlockIds.has(String(block.id)));
  
  console.log('État synchronisé depuis le DOM:', editorState.blocks);
  return editorState;
}
// Exposer globalement pour delete.js
window.removeBlockFromState = removeBlockFromState;