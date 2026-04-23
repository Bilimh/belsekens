// selection.js
export function setupBlockSelection(blockEl, workspace) {
    blockEl.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Retire la classe selected de tous les blocs
      document.querySelectorAll('.block').forEach(block => {
        block.classList.remove('selected');
      });
      
      // Ajoute la classe selected au bloc cliqué
      blockEl.classList.add('selected');
    });
  }
  
  export function setupGlobalUnselect() {
    document.addEventListener("click", (e) => {
      // Si on clique pas sur un bloc, on désélectionne tout
      if (!e.target.closest('.block')) {
        document.querySelectorAll('.block').forEach(block => {
          block.classList.remove('selected');
        });
      }
    });
  }