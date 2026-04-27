// mindmap.js - Version avec hover et délai

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

const defaultMindmapContent = {
  nodes: []
};

const mindmapConfig = {
  defaultTitle: "Carte mentale",
  defaultContent: defaultMindmapContent,

  defaultWidth: 900,
  defaultHeight: 600,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-brain",
  iconColor: "#8b5cf6",
  className: "mindmap-block",
  autoStack: true,

  editableFields: ["title"],

  customHtml: () => {
    return `
      <div class="mindmap-container">
        <div class="mindmap-header">
          <div class="mindmap-title" data-field="title" contenteditable="true">Carte mentale</div>
          <div class="mindmap-toolbar">
            <button class="mindmap-center" title="Recentrer">🎯 Centre</button>
          </div>
        </div>
        <div class="mindmap-canvas-wrapper">
          <div class="mindmap-nodes-area" style="position: relative; width: 100%; min-height: 500px; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);">
            <canvas class="mindmap-connections" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
            <div class="mindmap-nodes-container" style="position: relative; min-height: 500px;"></div>
          </div>
        </div>
        <div class="mindmap-instruction">
          <span>✨ Survolez un nœud pour voir les boutons</span>
          <span>🎨 Glisser pour déplacer</span>
          <span>✏️ Double-clic pour éditer</span>
        </div>
      </div>
    `;
  },

  customCSS: `
    .mindmap-container {
      width: 100%;
      background: #fff;
      border-radius: 20px;
      border: 1px solid rgba(139, 92, 246, 0.2);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .mindmap-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 12px;
    }

    .mindmap-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      flex: 1;
      min-width: 180px;
      padding: 6px 12px;
      border-radius: 12px;
      transition: background 0.2s;
    }

    .mindmap-title:hover {
      background: #e2e8f0;
    }

    .mindmap-title:empty:before {
      content: "Titre de la carte mentale";
      color: #94a3b8;
      font-style: italic;
    }

    .mindmap-toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .mindmap-center {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 40px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .mindmap-center:hover {
      transform: translateY(-1px);
    }

    .mindmap-canvas-wrapper {
      position: relative;
      overflow: auto;
    }

    .mindmap-nodes-area {
      position: relative;
      min-height: 500px;
      overflow: visible;
    }

    .mindmap-nodes-container {
      position: relative;
      min-height: 500px;
      height: auto;
    }

    .mindmap-connections {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .mindmap-node {
      position: absolute;
      min-width: 140px;
      max-width: 280px;
      background: white;
      border-radius: 20px;
      padding: 12px 18px;
      cursor: move;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      z-index: 10;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .mindmap-node:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .mindmap-node.selected {
      box-shadow: 0 0 0 3px #8b5cf6, 0 4px 16px rgba(0,0,0,0.1);
    }

    .mindmap-node-content {
      font-size: 14px;
      line-height: 1.5;
      outline: none;
      cursor: pointer;
      user-select: none;
      word-wrap: break-word;
      white-space: pre-wrap;
      min-height: 40px;
    }

    .mindmap-node-content[contenteditable="true"] {
      cursor: text;
      user-select: auto;
    }

    .mindmap-node-actions {
      position: absolute;
      top: -32px;
      right: 0;
      display: none;
      gap: 6px;
      z-index: 20;
    }

    .mindmap-node-actions button {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .mindmap-add-child-btn {
      background: #10b981;
      color: white;
    }
    .mindmap-add-child-btn:hover { transform: scale(1.1); background: #059669; }

    .mindmap-delete-node-btn {
      background: #ef4444;
      color: white;
    }
    .mindmap-delete-node-btn:hover { transform: scale(1.1); background: #dc2626; }

    .mindmap-instruction {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding: 10px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      flex-wrap: wrap;
    }

    .mindmap-instruction span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  `,

  customEvents: (blockEl, blockData) => {
    const nodesContainer = blockEl.querySelector(".mindmap-nodes-container");
    const connectionsCanvas = blockEl.querySelector(".mindmap-connections");
    const titleEl = blockEl.querySelector(".mindmap-title");
    const centerBtn = blockEl.querySelector(".mindmap-center");
    
    let nodes = [];
    let selectedNodeId = null;
    let nextId = 1;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isDragging = false;
    let dragNode = null;
    let activeNodeElement = null;
    let hideTimeout = null;
    const HIDE_DELAY = 300;

    function adjustContainerHeight() {
      if (!nodesContainer) return;
      let maxBottom = 0;
      nodes.forEach(node => {
        const top = parseFloat(node.element.style.top) || 0;
        const height = node.element.offsetHeight;
        const bottom = top + height + 100;
        maxBottom = Math.max(maxBottom, bottom);
      });
      const minHeight = Math.max(500, maxBottom);
      nodesContainer.style.minHeight = minHeight + "px";
      nodesContainer.style.height = "auto";
      
      const area = blockEl.querySelector(".mindmap-nodes-area");
      if (area) {
        area.style.minHeight = minHeight + "px";
      }
    }

    function generateId() {
      return "node_" + Date.now() + "_" + (nextId++);
    }

    function getNodeColor(level) {
      const colors = {
        0: { bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", border: "#f59e0b" },
        1: { bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", border: "#10b981" },
        2: { bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", border: "#3b82f6" },
        3: { bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", border: "#8b5cf6" },
        4: { bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", border: "#ef4444" }
      };
      return colors[level] || colors[4];
    }

    function drawConnections() {
      const ctx = connectionsCanvas.getContext("2d");
      const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
      
      connectionsCanvas.width = areaRect.width;
      connectionsCanvas.height = areaRect.height;
      connectionsCanvas.style.width = areaRect.width + "px";
      connectionsCanvas.style.height = areaRect.height + "px";
      
      ctx.clearRect(0, 0, connectionsCanvas.width, connectionsCanvas.height);
      
      nodes.forEach(node => {
        if (node.parentId) {
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent && parent.element && node.element) {
            const parentRect = parent.element.getBoundingClientRect();
            const childRect = node.element.getBoundingClientRect();
            const areaRectLocal = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
            
            const startX = parentRect.left + parentRect.width / 2 - areaRectLocal.left;
            const startY = parentRect.top + parentRect.height / 2 - areaRectLocal.top;
            const endX = childRect.left + childRect.width / 2 - areaRectLocal.left;
            const endY = childRect.top + childRect.height / 2 - areaRectLocal.top;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            const cp1x = startX + (endX - startX) * 0.3;
            const cp1y = startY;
            const cp2x = endX - (endX - startX) * 0.3;
            const cp2y = endY;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });
    }
    function createNodeElement(parentId = null, text = "", level = 0, x = null, y = null) {
        const nodeId = generateId();
        const nodeDiv = document.createElement("div");
        nodeDiv.className = "mindmap-node";
        
        const colors = getNodeColor(level);
        nodeDiv.style.background = colors.bg;
        nodeDiv.style.border = `1px solid ${colors.border}`;
        
        let finalX, finalY;
        
        if (x !== null && !isNaN(x) && y !== null && !isNaN(y)) {
          finalX = x;
          finalY = y;
        } else if (parentId) {
          const parent = nodes.find(n => n.id === parentId);
          if (parent && parent.element) {
            const parentLeft = parseFloat(parent.element.style.left) || 0;
            const parentTop = parseFloat(parent.element.style.top) || 0;
            const parentWidth = parent.element.offsetWidth;
            finalX = parentLeft + parentWidth + 30;
            finalY = parentTop;
            const existingChildren = nodes.filter(n => n.parentId === parentId).length;
            finalY = parentTop - 40 + (existingChildren * 90);
          } else {
            const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
            finalX = (areaRect.width / 2) - 70;
            finalY = (areaRect.height / 2) - 40;
          }
        } else {
          const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
          finalX = (areaRect.width / 2) - 70;
          finalY = (areaRect.height / 2) - 40;
        }
        
        finalX = Math.max(20, Math.min(finalX, 2000));
        finalY = Math.max(20, Math.min(finalY, 1000));
        
        nodeDiv.style.left = finalX + "px";
        nodeDiv.style.top = finalY + "px";
        
        nodeDiv.setAttribute("data-id", nodeId);
        nodeDiv.setAttribute("data-level", level);
        if (parentId) nodeDiv.setAttribute("data-parent", parentId);
        
        nodeDiv.innerHTML = `
          <div class="mindmap-node-content">${escapeHtml(text) || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée")}</div>
          <div class="mindmap-node-actions">
            <button class="mindmap-add-child-btn" title="Ajouter un enfant">+</button>
            <button class="mindmap-delete-node-btn" title="Supprimer">×</button>
          </div>
        `;
        
        nodesContainer.appendChild(nodeDiv);
        
        const nodeData = {
          id: nodeId,
          element: nodeDiv,
          parentId: parentId,
          children: [],
          level: level,
          text: text || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée")
        };
        
        nodes.push(nodeData);
        
        const contentDiv = nodeDiv.querySelector(".mindmap-node-content");
        const addChildBtnNode = nodeDiv.querySelector(".mindmap-add-child-btn");
        const deleteNodeBtn = nodeDiv.querySelector(".mindmap-delete-node-btn");
        const actionsDiv = nodeDiv.querySelector(".mindmap-node-actions");
        
        // Édition au double-clic
        contentDiv.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          this.setAttribute('contenteditable', 'true');
          this.focus();
          this.style.cursor = 'text';
          this.style.userSelect = 'auto';
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(this);
          selection.removeAllRanges();
          selection.addRange(range);
        });
        
        contentDiv.addEventListener('blur', function() {
          this.setAttribute('contenteditable', 'false');
          this.style.cursor = 'pointer';
          nodeData.text = this.innerHTML;
          saveToState();
          drawConnections();
        });
        
        contentDiv.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
          }
          if (e.key === 'Escape') {
            this.blur();
          }
        });
        
        // Hover pour afficher les boutons avec délai
        let hideTimeout = null;
        let activeNodeElement = null;
        const HIDE_DELAY = 300;
        
        nodeDiv.addEventListener('mouseenter', function(e) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          
          if (activeNodeElement && activeNodeElement !== this) {
            const prevActions = activeNodeElement.querySelector('.mindmap-node-actions');
            if (prevActions) {
              prevActions.style.display = 'none';
            }
            activeNodeElement.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            activeNodeElement.style.transform = 'translateY(0)';
          }
          
          actionsDiv.style.display = 'flex';
          this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          this.style.transform = 'translateY(-1px)';
          
          activeNodeElement = this;
        });
        
        nodeDiv.addEventListener('mouseleave', function(e) {
          const relatedTarget = e.relatedTarget;
          if (relatedTarget && actionsDiv.contains(relatedTarget)) {
            return;
          }
          
          hideTimeout = setTimeout(() => {
            actionsDiv.style.display = 'none';
            this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            this.style.transform = 'translateY(0)';
            hideTimeout = null;
          }, HIDE_DELAY);
        });
        
        actionsDiv.addEventListener('mouseenter', function(e) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          this.style.display = 'flex';
        });
        
        actionsDiv.addEventListener('mouseleave', function(e) {
          const relatedTarget = e.relatedTarget;
          if (relatedTarget && nodeDiv.contains(relatedTarget)) {
            return;
          }
          
          hideTimeout = setTimeout(() => {
            this.style.display = 'none';
            nodeDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            nodeDiv.style.transform = 'translateY(0)';
            hideTimeout = null;
          }, HIDE_DELAY);
        });
        
        // Ajouter enfant
        addChildBtnNode.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          addChildNode(nodeId);
          
          setTimeout(() => {
            actionsDiv.style.display = 'none';
            nodeDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            nodeDiv.style.transform = 'translateY(0)';
          }, 1000);
        });
        
        // Supprimer
        deleteNodeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          deleteNode(nodeId);
        });
        
        // Drag
        nodeDiv.addEventListener("mousedown", (e) => {
          if (e.target.closest(".mindmap-node-actions")) return;
          e.stopPropagation();
          
          selectedNodeId = nodeId;
          document.querySelectorAll(".mindmap-node").forEach(n => n.classList.remove("selected"));
          nodeDiv.classList.add("selected");
          
          actionsDiv.style.display = "none";
          
          isDragging = true;
          dragNode = nodeData;
          const rect = nodeDiv.getBoundingClientRect();
          dragOffsetX = e.clientX - rect.left;
          dragOffsetY = e.clientY - rect.top;
          
          nodeDiv.style.zIndex = "100";
        });
        
        return nodeId;
      }


      function createNodeElementWithId(id, parentId = null, text = "", level = 0, x = null, y = null) {
        const nodeId = id;
        const nodeDiv = document.createElement("div");
        nodeDiv.className = "mindmap-node";
        
        const colors = getNodeColor(level);
        nodeDiv.style.background = colors.bg;
        nodeDiv.style.border = `1px solid ${colors.border}`;
        
        let finalX, finalY;
        
        if (x !== null && !isNaN(x) && y !== null && !isNaN(y)) {
          finalX = x;
          finalY = y;
        } else if (parentId) {
          const parent = nodes.find(n => n.id === parentId);
          if (parent && parent.element) {
            const parentLeft = parseFloat(parent.element.style.left) || 0;
            const parentTop = parseFloat(parent.element.style.top) || 0;
            const parentWidth = parent.element.offsetWidth;
            finalX = parentLeft + parentWidth + 30;
            finalY = parentTop;
            const existingChildren = nodes.filter(n => n.parentId === parentId).length;
            finalY = parentTop - 40 + (existingChildren * 90);
          } else {
            const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
            finalX = (areaRect.width / 2) - 70;
            finalY = (areaRect.height / 2) - 40;
          }
        } else {
          const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
          finalX = (areaRect.width / 2) - 70;
          finalY = (areaRect.height / 2) - 40;
        }
        
        finalX = Math.max(20, Math.min(finalX, 2000));
        finalY = Math.max(20, Math.min(finalY, 1000));
        
        nodeDiv.style.left = finalX + "px";
        nodeDiv.style.top = finalY + "px";
        
        nodeDiv.setAttribute("data-id", nodeId);
        nodeDiv.setAttribute("data-level", level);
        if (parentId) nodeDiv.setAttribute("data-parent", parentId);
        
        nodeDiv.innerHTML = `
          <div class="mindmap-node-content">${escapeHtml(text) || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée")}</div>
          <div class="mindmap-node-actions">
            <button class="mindmap-add-child-btn" title="Ajouter un enfant">+</button>
            <button class="mindmap-delete-node-btn" title="Supprimer">×</button>
          </div>
        `;
        
        nodesContainer.appendChild(nodeDiv);
        
        const nodeData = {
          id: nodeId,
          element: nodeDiv,
          parentId: parentId,
          children: [],
          level: level,
          text: text || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée")
        };
        
        nodes.push(nodeData);
        
        const contentDiv = nodeDiv.querySelector(".mindmap-node-content");
        const addChildBtnNode = nodeDiv.querySelector(".mindmap-add-child-btn");
        const deleteNodeBtn = nodeDiv.querySelector(".mindmap-delete-node-btn");
        const actionsDiv = nodeDiv.querySelector(".mindmap-node-actions");
        
        // Édition au double-clic
        contentDiv.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          this.setAttribute('contenteditable', 'true');
          this.focus();
          this.style.cursor = 'text';
          this.style.userSelect = 'auto';
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(this);
          selection.removeAllRanges();
          selection.addRange(range);
        });
        
        contentDiv.addEventListener('blur', function() {
          this.setAttribute('contenteditable', 'false');
          this.style.cursor = 'pointer';
          nodeData.text = this.innerHTML;
          saveToState();
          drawConnections();
        });
        
        contentDiv.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
          }
          if (e.key === 'Escape') {
            this.blur();
          }
        });
        
        // Hover pour afficher les boutons avec délai
        let hideTimeout = null;
        let activeNodeElement = null;
        const HIDE_DELAY = 300;
        
        nodeDiv.addEventListener('mouseenter', function(e) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          
          if (activeNodeElement && activeNodeElement !== this) {
            const prevActions = activeNodeElement.querySelector('.mindmap-node-actions');
            if (prevActions) {
              prevActions.style.display = 'none';
            }
            activeNodeElement.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            activeNodeElement.style.transform = 'translateY(0)';
          }
          
          actionsDiv.style.display = 'flex';
          this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          this.style.transform = 'translateY(-1px)';
          
          activeNodeElement = this;
        });
        
        nodeDiv.addEventListener('mouseleave', function(e) {
          const relatedTarget = e.relatedTarget;
          if (relatedTarget && actionsDiv.contains(relatedTarget)) {
            return;
          }
          
          hideTimeout = setTimeout(() => {
            actionsDiv.style.display = 'none';
            this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            this.style.transform = 'translateY(0)';
            hideTimeout = null;
          }, HIDE_DELAY);
        });
        
        actionsDiv.addEventListener('mouseenter', function(e) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          this.style.display = 'flex';
        });
        
        actionsDiv.addEventListener('mouseleave', function(e) {
          const relatedTarget = e.relatedTarget;
          if (relatedTarget && nodeDiv.contains(relatedTarget)) {
            return;
          }
          
          hideTimeout = setTimeout(() => {
            this.style.display = 'none';
            nodeDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            nodeDiv.style.transform = 'translateY(0)';
            hideTimeout = null;
          }, HIDE_DELAY);
        });
        
        // Ajouter enfant
        addChildBtnNode.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          addChildNode(nodeId);
          
          setTimeout(() => {
            actionsDiv.style.display = 'none';
            nodeDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            nodeDiv.style.transform = 'translateY(0)';
          }, 1000);
        });
        
        // Supprimer
        deleteNodeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          deleteNode(nodeId);
        });
        
        // Drag
        nodeDiv.addEventListener("mousedown", (e) => {
          if (e.target.closest(".mindmap-node-actions")) return;
          e.stopPropagation();
          
          selectedNodeId = nodeId;
          document.querySelectorAll(".mindmap-node").forEach(n => n.classList.remove("selected"));
          nodeDiv.classList.add("selected");
          
          actionsDiv.style.display = "none";
          
          isDragging = true;
          dragNode = nodeData;
          const rect = nodeDiv.getBoundingClientRect();
          dragOffsetX = e.clientX - rect.left;
          dragOffsetY = e.clientY - rect.top;
          
          nodeDiv.style.zIndex = "100";
        });
        
        return nodeId;
      }
      function addRootNode() {
        const level = 0;
        const text = "✨ Nouvelle idée";
        createNodeElement(null, text, level);
        saveToState();
        drawConnections();
        adjustContainerHeight();
      }
      
      function addChildNode(parentId) {
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;
        
        const level = Math.min(parent.level + 1, 4);
        const text = "🌱 Nouvel enfant";
        
        const parentLeft = parseFloat(parent.element.style.left) || 0;
        const parentTop = parseFloat(parent.element.style.top) || 0;
        const parentWidth = parent.element.offsetWidth;
        const parentHeight = parent.element.offsetHeight;
        
        let x = parentLeft + parentWidth + 30;
        let y = parentTop + (parentHeight / 2) - 30;
        
        const existingChildren = nodes.filter(n => n.parentId === parentId).length;
        if (existingChildren > 0) {
          y = parentTop - 40 + (existingChildren * 80);
        }
        
        x = Math.max(20, Math.min(x, 2000));
        y = Math.max(20, Math.min(y, 1500));
        
        const childId = createNodeElement(parentId, text, level, x, y);
        parent.children.push(childId);
        saveToState();
        drawConnections();
        adjustContainerHeight();
        
        setTimeout(() => {
          const childElement = nodes.find(n => n.id === childId)?.element;
          if (childElement) {
            childElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }

    function deleteNode(nodeId) {
      const toDelete = [nodeId];
      const findChildren = (id) => {
        const node = nodes.find(n => n.id === id);
        if (node) {
          node.children.forEach(childId => {
            toDelete.push(childId);
            findChildren(childId);
          });
        }
      };
      findChildren(nodeId);
      
      toDelete.forEach(id => {
        const node = nodes.find(n => n.id === id);
        if (node && node.element) node.element.remove();
      });
      
      nodes = nodes.filter(n => !toDelete.includes(n.id));
      
      nodes.forEach(node => {
        if (node.children) {
          node.children = node.children.filter(id => !toDelete.includes(id));
        }
      });
      
      if (selectedNodeId === nodeId) selectedNodeId = null;
      saveToState();
      drawConnections();
      adjustContainerHeight();
    }

    function centerView() {
      if (nodes.length === 0) return;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        const left = parseFloat(node.element.style.left) || 0;
        const top = parseFloat(node.element.style.top) || 0;
        const width = node.element.offsetWidth;
        const height = node.element.offsetHeight;
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + width);
        maxY = Math.max(maxY, top + height);
      });
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const areaRect = blockEl.querySelector(".mindmap-nodes-area").getBoundingClientRect();
      
      const targetLeft = (areaRect.width / 2) - (contentWidth / 2) - minX;
      const targetTop = (areaRect.height / 2) - (contentHeight / 2) - minY;
      
      nodes.forEach(node => {
        const left = parseFloat(node.element.style.left) || 0;
        const top = parseFloat(node.element.style.top) || 0;
        node.element.style.left = (left + targetLeft) + "px";
        node.element.style.top = (top + targetTop) + "px";
      });
      
      drawConnections();
      adjustContainerHeight();
    }

    function saveToState() {
      const nodesData = nodes.map(node => ({
        id: node.id,
        parentId: node.parentId,
        level: node.level,
        text: node.text,
        left: node.element.style.left,
        top: node.element.style.top
      }));
      console.log("💾 saveToState - nodesData:", nodesData);
      console.log("💾 blockData avant:", blockData.content);
      blockData.content = { nodes: nodesData };
      console.log("💾 blockData après:", blockData.content);
      updateBlockContent(blockData.id, { content: { nodes: nodesData } });
    }

    function loadFromState() {
        console.log("📂 loadFromState - blockData.content:", blockData.content);
        
        // Nettoyer les anciens nœuds
        nodes.forEach(node => {
          if (node.element && node.element.parentNode) {
            node.element.remove();
          }
        });
        nodes = [];
        selectedNodeId = null;
        
        if (blockData.content && blockData.content.nodes && blockData.content.nodes.length > 0) {
          console.log("📂 Chargement de", blockData.content.nodes.length, "nœuds");
          blockData.content.nodes.forEach(nodeData => {
            // ✅ UTILISER createNodeElementWithId POUR GARDER LES IDS
            createNodeElementWithId(
              nodeData.id,
              nodeData.parentId,
              nodeData.text,
              nodeData.level,
              nodeData.left,
              nodeData.top
            );
          });
        } else {
          console.log("📂 Aucun nœud trouvé, création du nœud racine");
          addRootNode();
        }
        drawConnections();
        adjustContainerHeight();
      }
    function saveTitle() {
      if (titleEl) {
        const title = titleEl.innerText || "Carte mentale";
        blockData.title = title;
        updateBlockContent(blockData.id, { title: title });
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    }

    // Drag events
    function onMouseMove(e) {
      if (isDragging && dragNode) {
        const containerRect = nodesContainer.getBoundingClientRect();
        let newLeft = e.clientX - dragOffsetX - containerRect.left;
        let newTop = e.clientY - dragOffsetY - containerRect.top;
        
        newLeft = Math.max(0, Math.min(newLeft, 3000));
        newTop = Math.max(0, Math.min(newTop, 2000));
        
        dragNode.element.style.left = newLeft + "px";
        dragNode.element.style.top = newTop + "px";
        drawConnections();
      }
    }

    function onMouseUp() {
      if (isDragging && dragNode) {
        saveToState();
        isDragging = false;
        dragNode = null;
        adjustContainerHeight();
        drawConnections();
      }
      isDragging = false;
    }

    function init() {
      if (titleEl) {
        titleEl.innerText = blockData.title || "Carte mentale";
        titleEl.addEventListener("blur", saveTitle);
      }
      
      loadFromState();
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      
      const resizeObserver = new ResizeObserver(() => {
        drawConnections();
        adjustContainerHeight();
      });
      resizeObserver.observe(blockEl.querySelector(".mindmap-nodes-area"));
      
      window.addEventListener("resize", () => {
        drawConnections();
        adjustContainerHeight();
      });
    }

    if (centerBtn) {
      centerBtn.addEventListener("click", centerView);
    }
    
    init();
    
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }
};

const mindmapBlock = createBlockType("mindmap", mindmapConfig);

export const createMindmapData = mindmapBlock.createData;
export const renderMindmap = mindmapBlock.render;
export const attachMindmapEvents = mindmapBlock.attachEvents;
export const addMindmap = mindmapBlock.add;

export function serializeMindmap(blockEl) {
    const titleEl = blockEl.querySelector(".mindmap-title");
    const nodesContainer = blockEl.querySelector(".mindmap-nodes-container");
    const nodesData = [];
    
    if (nodesContainer) {
      const nodeElements = nodesContainer.querySelectorAll(".mindmap-node");
      nodeElements.forEach(nodeEl => {
        const contentDiv = nodeEl.querySelector(".mindmap-node-content");
        const addChildBtn = nodeEl.querySelector(".mindmap-add-child-btn");
        const deleteBtn = nodeEl.querySelector(".mindmap-delete-node-btn");
        
        // Sauvegarder l'état des boutons ? Non, juste les données
        const text = contentDiv ? contentDiv.innerText : "";
        const left = parseFloat(nodeEl.style.left) || 0;
        const top = parseFloat(nodeEl.style.top) || 0;
        const level = parseInt(nodeEl.getAttribute("data-level")) || 0;
        const parentId = nodeEl.getAttribute("data-parent") || null;
        const nodeId = nodeEl.getAttribute("data-id") || Date.now() + "_" + Math.random();
        
        nodesData.push({
          id: nodeId,
          parentId: parentId,
          level: level,
          text: text,
          left: left,
          top: top
        });
      });
    }
    
    return {
      title: titleEl ? titleEl.innerText : "Carte mentale",
      content: { nodes: nodesData }
    };
  }