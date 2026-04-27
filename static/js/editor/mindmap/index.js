// index.js
import { createBlockType } from "../baseBlock.js";
import { mindmapEvents } from "./mindmapMain.js";

const defaultMindmapContent = { nodes: [] };

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

  customHtml: () => `
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
  `,

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
    .mindmap-title:hover { background: #e2e8f0; }
    .mindmap-title:empty:before {
      content: "Titre de la carte mentale";
      color: #94a3b8;
      font-style: italic;
    }
    .mindmap-toolbar { display: flex; gap: 10px; flex-wrap: wrap; }
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
    .mindmap-center:hover { transform: translateY(-1px); }
    .mindmap-canvas-wrapper { position: relative; overflow: auto; }
    .mindmap-nodes-area { position: relative; min-height: 500px; overflow: visible; }
    .mindmap-nodes-container { position: relative; min-height: 500px; height: auto; }
    .mindmap-connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
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
    .mindmap-node:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .mindmap-node.selected { box-shadow: 0 0 0 3px #8b5cf6, 0 4px 16px rgba(0,0,0,0.1); }
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
    .mindmap-node-content[contenteditable="true"] { cursor: text; user-select: auto; }
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
    .mindmap-add-child-btn { background: #10b981; color: white; }
    .mindmap-add-child-btn:hover { transform: scale(1.1); background: #059669; }
    .mindmap-delete-node-btn { background: #ef4444; color: white; }
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
    .mindmap-instruction span { display: inline-flex; align-items: center; gap: 4px; }
    /* Styles pour le mindmap (inspirés de situation.js) */
.mindmap-node-preview {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 40px;
}

.mindmap-node-editor {
  display: none;
}

.mindmap-node.is-editing .mindmap-node-preview {
  display: none;
}

.mindmap-node.is-editing .mindmap-node-editor {
  display: block;
}

.mindmap-node-source {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  cursor: text;
  min-height: 60px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
}

.mindmap-node-source:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139,92,246,0.1);
}

.mindmap-node-source:empty:before {
  content: "Texte du nœud... (LaTeX supporté : $...$ ou $$...$$)";
  color: #94a3b8;
  font-style: italic;
}

/* LaTeX dans le preview */
.mindmap-node-preview .katex {
  font-size: 0.9em;
}

.mindmap-node-preview .katex-display {
  margin: 0.2em 0;
}
  `,

  customEvents: mindmapEvents
};

const mindmapBlock = createBlockType("mindmap", mindmapConfig);

export const createMindmapData = mindmapBlock.createData;
export const renderMindmap = mindmapBlock.render;
export const addMindmap = mindmapBlock.add;

export function serializeMindmap(blockEl) {
    const titleEl = blockEl.querySelector(".mindmap-title");
    const nodesContainer = blockEl.querySelector(".mindmap-nodes-container");
    const nodesData = [];
    
    if (nodesContainer) {
      nodesContainer.querySelectorAll(".mindmap-node").forEach(nodeEl => {
        const previewEl = nodeEl.querySelector(".mindmap-node-preview");
        const sourceEl = nodeEl.querySelector(".mindmap-node-source");
        
        let text = "";
        if (previewEl && previewEl.innerHTML) {
          text = previewEl.innerHTML;
        } else if (sourceEl && sourceEl.innerHTML) {
          text = sourceEl.innerHTML;
        }
        
        nodesData.push({
          id: nodeEl.getAttribute("data-id"),
          parentId: nodeEl.getAttribute("data-parent"),
          level: parseInt(nodeEl.getAttribute("data-level")) || 0,
          text: text,
          left: parseFloat(nodeEl.style.left) || 0,
          top: parseFloat(nodeEl.style.top) || 0
        });
      });
    }
    
    console.log("🔵 serializeMindmap - nodesData:", nodesData);
    
    return {
      title: titleEl ? titleEl.innerText : "Carte mentale",
      content: { nodes: nodesData }
    };
  }