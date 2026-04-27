// mindmapMain.js - Contient toute la logique de customEvents
import { updateBlockContent } from "../editorState.js";
import { renderLatexInElement } from "../../katex/latexRenderer.js";



export function mindmapEvents(blockEl, blockData) {
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

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

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
    
    // Stocker le code source original (avec $)
    const sourceText = text || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée");
    
    // Structure : preview + editor (comme situation.js)
    nodeDiv.innerHTML = `
      <div class="mindmap-node-preview latex-enabled"></div>
      <div class="mindmap-node-editor">
        <div class="mindmap-node-source" contenteditable="true"></div>
      </div>
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
      source: sourceText,  // Code source (avec $)
      text: sourceText
    };
    
    nodes.push(nodeData);
    
    const previewEl = nodeDiv.querySelector(".mindmap-node-preview");
    const sourceEl = nodeDiv.querySelector(".mindmap-node-source");
    const addChildBtnNode = nodeDiv.querySelector(".mindmap-add-child-btn");
    const deleteNodeBtn = nodeDiv.querySelector(".mindmap-delete-node-btn");
    const actionsDiv = nodeDiv.querySelector(".mindmap-node-actions");
    
    let originalHeight = null;
    
    // ✅ Sauvegarde : stocker le code BRUT, afficher le rendu
    function saveContent() {
      const rawContent = sourceEl.innerHTML;
      nodeData.source = rawContent;  
      nodeData.text = rawContent;
      
      previewEl.innerHTML = rawContent;
      renderLatexInElement(previewEl);
      saveToState();
      drawConnections();
    }
    
    // ✅ Mode édition
    function openEditMode() {
      originalHeight = nodeDiv.offsetHeight;
      nodeDiv.style.minHeight = originalHeight + "px";
      nodeDiv.style.height = "auto";
      
      // Mettre le code BRUT dans l'éditeur
      sourceEl.innerHTML = nodeData.source;
      
      nodeDiv.classList.add("is-editing");
      sourceEl.focus();
      
      const range = document.createRange();
      range.selectNodeContents(sourceEl);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // ✅ Fermer le mode édition
    function closeEditMode() {
      saveContent();
      nodeDiv.classList.remove("is-editing");
      
      if (originalHeight) {
        nodeDiv.style.height = originalHeight + "px";
        nodeDiv.style.minHeight = "";
        originalHeight = null;
      }
    }
    
    // ✅ Initialisation : preview avec LaTeX rendu, source avec code brut
    previewEl.innerHTML = sourceText;
    renderLatexInElement(previewEl);
    sourceEl.innerHTML = sourceText;
    
    // ✅ Double-clic pour ouvrir l'éditeur
    nodeDiv.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      openEditMode();
    });
    
    // ✅ Éditeur : perte de focus
    sourceEl.addEventListener("blur", () => {
      closeEditMode();
    });
    
    // ✅ Éditeur : touche Escape
    sourceEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeEditMode();
      }
    });
    
    // ✅ Hover pour afficher les boutons
    nodeDiv.addEventListener('mouseenter', function(e) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      
      actionsDiv.style.display = 'flex';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      this.style.transform = 'translateY(-1px)';
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

 // createNodeElementWithId - Version complète avec logique situation.js (preview + editor)

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
  
  // Stocker le code source original (avec $)
  const sourceText = text || (level === 0 ? "✨ Idée principale" : "🌱 Nouvelle idée");
  
  // Structure : preview + editor (comme situation.js)
  nodeDiv.innerHTML = `
    <div class="mindmap-node-preview latex-enabled"></div>
    <div class="mindmap-node-editor">
      <div class="mindmap-node-source" contenteditable="true"></div>
    </div>
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
    source: sourceText,  // Code source (avec $)
    text: sourceText
  };
  
  nodes.push(nodeData);
  
  const previewEl = nodeDiv.querySelector(".mindmap-node-preview");
  const sourceEl = nodeDiv.querySelector(".mindmap-node-source");
  const addChildBtnNode = nodeDiv.querySelector(".mindmap-add-child-btn");
  const deleteNodeBtn = nodeDiv.querySelector(".mindmap-delete-node-btn");
  const actionsDiv = nodeDiv.querySelector(".mindmap-node-actions");
  
  let originalHeight = null;
  
  // ✅ Sauvegarde : stocker le code BRUT, afficher le rendu
  function saveContent() {
    const rawContent = sourceEl.innerHTML;
    nodeData.source = rawContent;
    nodeData.text = rawContent;
    
    previewEl.innerHTML = rawContent;
    renderLatexInElement(previewEl);
    saveToState();
    drawConnections();
  }
  
  // ✅ Mode édition
  function openEditMode() {
    originalHeight = nodeDiv.offsetHeight;
    nodeDiv.style.minHeight = originalHeight + "px";
    nodeDiv.style.height = "auto";
    
    // Mettre le code BRUT dans l'éditeur
    sourceEl.innerHTML = nodeData.source;
    
    nodeDiv.classList.add("is-editing");
    sourceEl.focus();
    
    const range = document.createRange();
    range.selectNodeContents(sourceEl);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  // ✅ Fermer le mode édition
  function closeEditMode() {
    saveContent();
    nodeDiv.classList.remove("is-editing");
    
    if (originalHeight) {
      nodeDiv.style.height = originalHeight + "px";
      nodeDiv.style.minHeight = "";
      originalHeight = null;
    }
  }
  
  // ✅ Initialisation : preview avec LaTeX rendu, source avec code brut
  previewEl.innerHTML = sourceText;
  renderLatexInElement(previewEl);
  sourceEl.innerHTML = sourceText;
  
  // ✅ Double-clic pour ouvrir l'éditeur
  nodeDiv.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    openEditMode();
  });
  
  // ✅ Éditeur : perte de focus
  sourceEl.addEventListener("blur", () => {
    closeEditMode();
  });
  
  // ✅ Éditeur : touche Escape
  sourceEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeEditMode();
    }
  });
  
  // ✅ Hover pour afficher les boutons
  nodeDiv.addEventListener('mouseenter', function(e) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    actionsDiv.style.display = 'flex';
    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    this.style.transform = 'translateY(-1px)';
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
    
    createNodeElement(parentId, text, level, x, y);
    const childNode = nodes[nodes.length - 1];
    parent.children.push(childNode.id);
    saveToState();
    drawConnections();
    adjustContainerHeight();
    
    setTimeout(() => {
      if (childNode.element) {
        childNode.element.scrollIntoView({ behavior: "smooth", block: "center" });
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
    console.log("🔍 Contenu des nœuds avant sauvegarde:");
    nodes.forEach(node => {
      console.log(`  - ${node.id}: source = "${node.source}"`);
    });
    
    const nodesData = nodes.map(node => ({
      id: node.id,
      parentId: node.parentId,
      level: node.level,
      text: node.source,
      left: parseFloat(node.element.style.left) || 0,
      top: parseFloat(node.element.style.top) || 0
    }));
    
    console.log("💾 Sauvegarde des nœuds:", nodesData);
    
    blockData.content = { nodes: nodesData };
    updateBlockContent(blockData.id, { content: { nodes: nodesData } });
  }

  function loadFromState() {
    console.log("📂 loadFromState - blockData.content:", blockData.content);
    console.log("📂 loadFromState - blockData.content brut:", JSON.stringify(blockData.content, null, 2));
    nodes.forEach(node => {
      if (node.element && node.element.parentNode) {
        node.element.remove();
      }
    });
    nodes = [];
    selectedNodeId = null;
    
    if (blockData.content && blockData.content.nodes && blockData.content.nodes.length > 0) {
      blockData.content.nodes.forEach(nodeData => {
        console.log("📂 Création nœud avec text:", nodeData.text);
        createNodeElementWithId(
          nodeData.id,
          nodeData.parentId,
          nodeData.text,  // ← Ceci est le source
          nodeData.level,
          nodeData.left,
          nodeData.top
        );
      });
    } else {
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