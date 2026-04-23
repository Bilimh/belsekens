// js/editor/pages.js

import { setBlocks } from "./editorState.js";
import { renderBlock } from "./blockRegistry.js";
import { makeDraggable } from "./drag.js";
import { makeResizable } from "./resize.js";
import { setupBlockSelection } from "./selection.js";

export const PageManager = {
  currentPageIndex: 0,
  pages: [],
  blocksByPage: new Map(),
  fichierId: null,

  // Helper notification simple
  notify(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    // Optionnel: afficher une notification simple
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  },

  // Récupérer les pages depuis Django
  async getPages(fichierId) {
    const response = await fetch(`/api/fichiers/${fichierId}/pages/`);
    if (!response.ok) throw new Error('Erreur chargement pages');
    return response.json();
  },

  // Créer une page
  async createPageAPI(fichierId, data) {
    const response = await fetch(`/api/fichiers/${fichierId}/pages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur création page');
    return response.json();
  },

  // Mettre à jour une page
  async updatePageAPI(pageId, data) {
    const response = await fetch(`/api/pages/${pageId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur mise à jour page');
    return response.json();
  },

  // Supprimer une page
  async deletePageAPI(pageId) {
    const response = await fetch(`/api/pages/${pageId}/`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erreur suppression page');
    return true;
  },

  // Récupérer les blocs d'une page
  async getBlocs(pageId) {
    const response = await fetch(`/api/pages/${pageId}/blocs/`);
    if (!response.ok) throw new Error('Erreur chargement blocs');
    return response.json();
  },

  async init(fichierId) {
    this.fichierId = fichierId;
    try {
      const pagesData = await this.getPages(fichierId);
      if (pagesData.length === 0) {
        await this.createPage(0);
      } else {
        this.pages = pagesData;
        for (const page of pagesData) {
          const blocks = await this.getBlocs(page.id);
          this.blocksByPage.set(page.id, blocks);
        }
        this.currentPageIndex = 0;
        this.renderCurrentPage();
      }
      this.updatePageNavigation();
    } catch (error) {
      console.error('Erreur initialisation pages:', error);
      await this.createPage(0);
    }
  },

  async createPage(position = null) {
    const pageNum = position !== null ? position : this.pages.length;
    const newPage = await this.createPageAPI(this.fichierId, {
      titre: `Page ${pageNum + 1}`,
      numero: pageNum
    });
    
    this.pages.splice(pageNum, 0, newPage);
    this.blocksByPage.set(newPage.id, []);
    
    for (let i = pageNum + 1; i < this.pages.length; i++) {
      this.pages[i].numero = i;
      this.pages[i].titre = `Page ${i + 1}`;
      await this.updatePageAPI(this.pages[i].id, {
        titre: this.pages[i].titre,
        numero: i
      });
    }
    
    this.updatePageNavigation();
    return newPage;
  },

  async deletePage(pageIndex) {
    if (this.pages.length <= 1) {
      this.notify('Impossible de supprimer la dernière page', 'error');
      return false;
    }
    
    const pageToDelete = this.pages[pageIndex];
    await this.deletePageAPI(pageToDelete.id);
    this.blocksByPage.delete(pageToDelete.id);
    this.pages.splice(pageIndex, 1);
    
    for (let i = 0; i < this.pages.length; i++) {
      this.pages[i].numero = i;
      this.pages[i].titre = `Page ${i + 1}`;
      await this.updatePageAPI(this.pages[i].id, {
        titre: this.pages[i].titre,
        numero: i
      });
    }
    
    if (this.currentPageIndex >= this.pages.length) {
      this.currentPageIndex = this.pages.length - 1;
    }
    
    this.renderCurrentPage();
    this.updatePageNavigation();
    return true;
  },

  goToPage(index) {
    if (index >= 0 && index < this.pages.length) {
      this.currentPageIndex = index;
      this.renderCurrentPage();
      this.updatePageNavigation();
    }
  },

  nextPage() {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.goToPage(this.currentPageIndex + 1);
    } else {
      this.createPage(this.pages.length);
      this.goToPage(this.currentPageIndex + 1);
    }
  },

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex - 1);
    }
  },

  renderCurrentPage() {
    const workspace = document.getElementById('editor-workspace');
    if (!workspace) return;
    
    const currentPage = this.pages[this.currentPageIndex];
    const blocks = this.blocksByPage.get(currentPage.id) || [];
    
    setBlocks(blocks);
    
    workspace.innerHTML = `
      <div class="page-container" data-page-id="${currentPage.id}" data-page-index="${this.currentPageIndex}">
        <div class="page-content a4-page">
          ${blocks.map(block => renderBlock(block)).join('')}
        </div>
      </div>
    `;
    
    this.attachEventsToBlocks();
  },

  attachEventsToBlocks() {
    const workspace = document.getElementById('editor-workspace');
    const currentPage = this.pages[this.currentPageIndex];
    const blocks = this.blocksByPage.get(currentPage.id) || [];
    
    blocks.forEach(block => {
      const blockEl = document.getElementById(`bloc-${block.id}`);
      if (blockEl) {
        makeDraggable(blockEl, workspace);
        makeResizable(blockEl);
        setupBlockSelection(blockEl, workspace);
      }
    });
  },

  updatePageNavigation() {
    let navContainer = document.getElementById('page-navigation');
    
    if (!navContainer) {
      navContainer = document.createElement('div');
      navContainer.id = 'page-navigation';
      navContainer.className = 'page-navigation-bar';
      const toolbar = document.querySelector('.editor-toolbar');
      if (toolbar) {
        toolbar.insertAdjacentElement('afterend', navContainer);
      } else {
        document.body.insertBefore(navContainer, document.getElementById('editor-workspace'));
      }
    }
    
    const totalPages = this.pages.length;
    const currentNum = this.currentPageIndex + 1;
    
    navContainer.innerHTML = `
      <div class="page-nav">
        <button class="page-nav-btn prev-page" ${this.currentPageIndex === 0 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i> Précédent
        </button>
        
        <div class="page-info">
          <span class="page-current">${currentNum}</span>
          <span class="page-sep">/</span>
          <span class="page-total">${totalPages}</span>
        </div>
        
        <button class="page-nav-btn next-page">
          Suivant <i class="fas fa-chevron-right"></i>
        </button>
        
        <button class="page-nav-btn add-page-btn" title="Ajouter une page">
          <i class="fas fa-plus"></i> Page
        </button>
      </div>
    `;
    
    // Styles
    if (!document.getElementById('page-nav-styles')) {
      const style = document.createElement('style');
      style.id = 'page-nav-styles';
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
        .a4-page {
          width: 21cm;
          min-height: 29.7cm;
          background: white;
          margin: 20px auto;
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
          position: relative;
          padding: 20px;
          box-sizing: border-box;
        }
      `;
      document.head.appendChild(style);
    }
    
    navContainer.querySelector('.prev-page')?.addEventListener('click', () => this.prevPage());
    navContainer.querySelector('.next-page')?.addEventListener('click', () => this.nextPage());
    navContainer.querySelector('.add-page-btn')?.addEventListener('click', () => {
      this.createPage(this.pages.length);
      this.goToPage(this.pages.length - 1);
    });
  },

  checkPageOverflow() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return false;
    
    const scrollHeight = pageContent.scrollHeight;
    const clientHeight = pageContent.clientHeight;
    
    if (scrollHeight > clientHeight + 50) {
      this.notify('Cette page est pleine. Ajoutez une nouvelle page.', 'warning');
      return true;
    }
    return false;
  },

  addBlockToCurrentPage(blockData) {
    const currentPage = this.pages[this.currentPageIndex];
    const blocks = this.blocksByPage.get(currentPage.id) || [];
    blocks.push(blockData);
    this.blocksByPage.set(currentPage.id, blocks);
    setBlocks(blocks);
  }
};