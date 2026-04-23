// js/editor/pageNavigation.js

import { PageManager } from './pages.js';

export function initPageNavigation() {
  // Créer la barre de navigation si elle n'existe pas
  let navBar = document.getElementById('page-navigation');
  if (!navBar) {
    navBar = document.createElement('div');
    navBar.id = 'page-navigation';
    navBar.className = 'page-navigation-bar';
    
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      toolbar.insertAdjacentElement('afterend', navBar);
    } else {
      document.body.insertBefore(navBar, document.getElementById('editor-workspace'));
    }
  }
  
  // Styles pour la navigation
  const style = document.createElement('style');
  style.textContent = `
    .page-navigation-bar {
      background: #f8f9fa;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 20px;
      display: flex;
      justify-content: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .page-nav {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 6px 16px;
      border-radius: 40px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .page-nav-btn {
      background: #e2e8f0;
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    
    .page-nav-btn:hover:not(:disabled) {
      background: #cbd5e1;
      transform: scale(1.02);
    }
    
    .page-nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .add-page-btn {
      background: #28a745;
      color: white;
    }
    
    .add-page-btn:hover {
      background: #1e7e34;
    }
    
    .page-info {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      min-width: 60px;
      text-align: center;
    }
    
    .page-current {
      color: #0d6efd;
      font-size: 18px;
    }
    
    .page-sep {
      margin: 0 4px;
    }
    
    /* Style A4 */
    .a4-page {
      width: 21cm;
      min-height: 29.7cm;
      background: white;
      margin: 20px auto;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      position: relative;
      page-break-after: avoid;
      padding: 20px;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}

// Fonction pour déplacer un bloc (à appeler depuis le menu contextuel)
export function setupBlockMoveToPage(blockId, blockEl) {
  const pages = PageManager.pages;
  if (pages.length <= 1) return;
  
  const menu = document.createElement('div');
  menu.className = 'move-to-page-menu';
  menu.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 5px 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  `;
  
  pages.forEach((page, idx) => {
    if (idx !== PageManager.currentPageIndex) {
      const item = document.createElement('div');
      item.textContent = `Page ${idx + 1}`;
      item.style.cssText = `
        padding: 8px 20px;
        cursor: pointer;
        transition: background 0.2s;
      `;
      item.onmouseover = () => item.style.background = '#f0f0f0';
      item.onmouseout = () => item.style.background = 'white';
      item.onclick = async () => {
        await PageManager.moveBlockToPage(blockId, idx);
        menu.remove();
      };
      menu.appendChild(item);
    }
  });
  
  const rect = blockEl.getBoundingClientRect();
  menu.style.top = `${rect.top + window.scrollY}px`;
  menu.style.left = `${rect.left + rect.width}px`;
  document.body.appendChild(menu);
  
  // Fermer au clic extérieur
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}