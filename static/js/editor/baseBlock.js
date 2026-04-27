// baseBlock.js - VERSION CORRIGÉE

import { generateId } from "./utils.js";
import { addBlockToState, updateBlockContent } from "./editorState.js";
import { attachBlockControls } from "./blockControls.js";
import { setupBlockSelection } from "./selection.js";
import { imageUploadService } from "./uploadService.js";
import { UploadComponent } from "./uploadComponent.js";

export class BaseBlock {
  constructor(type, config) {
    this.type = type;
    this.config = {
      defaultTitle: config.defaultTitle || "Bloc",
      defaultContent: config.defaultContent || "Contenu du bloc...",
      defaultWidth: config.defaultWidth || 320,
      defaultHeight: config.defaultHeight || 180,
      defaultLeft: config.defaultLeft || 40,
      defaultTop: config.defaultTop || 40,
      icon: config.icon || "fa-file",
      iconColor: config.iconColor || "#3b82f6",
      className: config.className || `${type}-block`,
      autoStack: config.autoStack !== false,
      blockSpacing: config.blockSpacing || 10,
      editableFields: config.editableFields || ["title", "content"],
      enableImageUpload: config.enableImageUpload || false,
      imageWidth: config.imageWidth || 270,
      imageHeight: config.imageHeight || 180,
      customHtml: config.customHtml || null,
      customCSS: config.customCSS || null,
      layout: config.layout || "default",
      headerBgColor: config.headerBgColor || "#f8f9fa",
      headerTextColor: config.headerTextColor || "#333",
      extraFields: config.extraFields || [],
      customEvents: config.customEvents || null,
      ...config
    };

    if (this.config.customCSS) {
      this.injectCustomCSS();
    }
  }

  injectCustomCSS() {
    const styleId = `style-${this.type}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = this.config.customCSS;
      document.head.appendChild(style);
    }
  }



  createData(data = {}) {
    //console.log("🔵 baseBlock.createData - data reçu:", data);
    //console.log("🔵 baseBlock.createData - questionNumber:", data.questionNumber);

    const baseData = {
      id: data.id || generateId(this.type),
      type: this.type,
      title: data.title || this.config.defaultTitle,
      content: data.content || this.config.defaultContent,
      position: {
        left: data.position?.left ?? this.config.defaultLeft,
        top: data.position?.top ?? this.config.defaultTop
      },
      size: {
        width: data.size?.width ?? this.config.defaultWidth,
        height: data.size?.height ?? this.config.defaultHeight
      }
    };

    // ✅ Ajouter questionNumber s'il existe
    if (data.questionNumber !== undefined) {
      baseData.questionNumber = data.questionNumber;
      //console.log("🔵 baseBlock.createData - questionNumber ajouté:", data.questionNumber);
    }

    for (const [key, value] of Object.entries(data)) {
      if (!['id', 'type', 'title', 'content', 'position', 'size', 'questionNumber'].includes(key)) {
        baseData[key] = value;
      }
    }

    if (this.config.enableImageUpload) {
      baseData.imageUrl = data.imageUrl || null;
      baseData.imageCaption = data.imageCaption || "";
    }

    //console.log("🔵 baseBlock.createData - baseData final:", baseData);

    return baseData;
  }

  // ✅ CORRIGÉE : reçoit le workspace en paramètre
  calculateNewBlockPosition(workspace) {
    // Si workspace est null, essayer de trouver la page active
    let targetWorkspace = workspace;
    if (!targetWorkspace) {
      targetWorkspace = document.querySelector('.page-content:last-child');
    }
    if (!targetWorkspace && typeof window.getCurrentPageContent === 'function') {
      targetWorkspace = window.getCurrentPageContent();
    }

    if (!targetWorkspace) {
      return { left: this.config.defaultLeft, top: this.config.defaultTop };
    }

    const existingBlocks = targetWorkspace.querySelectorAll('.block');
    let top = this.config.defaultTop;
    let left = this.config.defaultLeft;

    if (existingBlocks.length > 0 && this.config.autoStack) {
      const lastBlock = existingBlocks[existingBlocks.length - 1];
      const lastBlockBottom = lastBlock.offsetTop + lastBlock.offsetHeight;
      top = lastBlockBottom + 10;
    }

    return { left, top };
  }

  generateHTML(data) {
    if (this.config.customHtml) {
      return this.config.customHtml(data);
    }

    const hasTitle = this.config.editableFields.includes("title");
    const hasContent = this.config.editableFields.includes("content");

    if (this.config.layout === "float-right" && this.config.enableImageUpload) {
      return this.generateFloatRightLayout(data);
    }

    if (this.config.layout === "float-left" && this.config.enableImageUpload) {
      return this.generateFloatLeftLayout(data);
    }

    return `
      ${hasTitle ? `
        <div class="block-header" data-field="title" style="background: ${this.config.headerBgColor}; color: ${this.config.headerTextColor};">
          <i class="${this.config.icon}" style="margin-right: 8px; color: ${this.config.iconColor};"></i>
          ${data.title}
        </div>
      ` : ''}
      ${hasContent ? `
        <div class="block-content" data-field="content" contenteditable="true">
          ${data.content}
        </div>
      ` : ''}
    `;
  }

  generateFloatRightLayout(data) {
    const hasImage = data.imageUrl && data.imageUrl !== "";
    const hasTitle = this.config.editableFields.includes("title");
    const hasContent = this.config.editableFields.includes("content");

    const imageHtml = hasImage ? `
      <div class="block-image-wrapper float-right" style="float: right; width: ${this.config.imageWidth}px; margin: 0 0 10px 15px;">
        <img src="${data.imageUrl}" style="width: 100%; height: ${this.config.imageHeight}px; object-fit: cover; border-radius: 6px;">
        ${data.imageCaption ? `<div class="block-image-caption" style="font-size: 11px; color: #666; text-align: center; margin-top: 5px;" data-field="imageCaption" contenteditable="true">${data.imageCaption}</div>` : ''}
      </div>
    ` : `
      <div class="block-image-placeholder float-right" data-action="upload-image" style="float: right; width: ${this.config.imageWidth}px; height: ${this.config.imageHeight}px; background: #f0f0f0; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; margin: 0 0 10px 15px;">
        <i class="fas fa-camera" style="font-size: 24px; color: #666; margin-bottom: 5px;"></i>
        <span style="color: #666; font-size: 11px; text-align: center;">Cliquer pour ajouter une image</span>
      </div>
    `;

    return `
      ${hasTitle ? `
        <div class="block-header" data-field="title" style="background: ${this.config.headerBgColor}; color: ${this.config.headerTextColor};">
          <i class="${this.config.icon}" style="margin-right: 8px; color: ${this.config.iconColor};"></i>
          ${data.title}
        </div>
      ` : ''}
      <div style="overflow: hidden;">
        ${imageHtml}
        ${hasContent ? `
          <div class="block-content" data-field="content" contenteditable="true">
            ${data.content}
          </div>
        ` : ''}
        <div style="clear: both;"></div>
      </div>
    `;
  }

  // baseBlock.js - méthode setupImageUpload complète

setupImageUpload(blockEl, blockData) {
  const placeholder = blockEl.querySelector('[data-action="upload-image"]');
  if (!placeholder) return;
  
  const uploadComp = new UploadComponent({
    width: this.config.imageWidth,
    height: this.config.imageHeight,
    float: 'right',
    onSuccess: (imageUrl, caption) => {
      if (imageUrl === null) {
        blockData.imageUrl = null;
        blockData.imageCaption = "";
      } else {
        blockData.imageUrl = imageUrl;
        if (caption !== undefined) blockData.imageCaption = caption;
      }
      
      updateBlockContent(blockData.id, { 
        imageUrl: blockData.imageUrl,
        imageCaption: blockData.imageCaption 
      });
      
      setTimeout(() => {
        if (window.saveDocument) window.saveDocument();
      }, 100);
    }
  });
  
  // ✅ Si une image existe déjà, l'afficher avec les contrôles
  if (blockData.imageUrl) {
    const imageWrapper = uploadComp.createImageWrapper(
      blockData.imageUrl, 
      blockData.imageCaption || '',
      async () => {
        blockData.imageUrl = null;
        blockData.imageCaption = "";
        updateBlockContent(blockData.id, { imageUrl: null, imageCaption: "" });
        if (window.saveDocument) window.saveDocument();
        // Recréer le placeholder
        this.setupImageUpload(blockEl, blockData);
      },
      async (file, blockId) => {
        const result = await imageUploadService.upload(file, blockId);
        blockData.imageUrl = result;
        updateBlockContent(blockData.id, { imageUrl: result });
        if (window.saveDocument) window.saveDocument();
        return result;
      },
      blockData.id
    );
    placeholder.parentNode.replaceChild(imageWrapper, placeholder);
  } else {
    const uploadUI = uploadComp.createUploadUI(async (file, blockId) => {
      return await imageUploadService.upload(file, blockId);
    }, blockData.id);
    placeholder.parentNode.replaceChild(uploadUI, placeholder);
  }
}

  attachEvents(blockEl, blockData) {
    this.config.editableFields.forEach(field => {
      const fieldEl = blockEl.querySelector(`[data-field="${field}"]`);
      if (!fieldEl) return;

      fieldEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        blockEl.classList.add("is-editing");
        this.enableEditable(fieldEl);
      });

      fieldEl.addEventListener("blur", () => {
        this.disableEditable(fieldEl);
        blockEl.classList.remove("is-editing");
        updateBlockContent(blockData.id, { [field]: fieldEl.innerHTML });
      });

      fieldEl.addEventListener("input", () => {
        updateBlockContent(blockData.id, { [field]: fieldEl.innerHTML });
      });
    });

    if (this.config.enableImageUpload) {
      this.setupImageUpload(blockEl, blockData);
    }

    if (this.config.customEvents) {
      this.config.customEvents(blockEl, blockData);
    }
  }

  enableEditable(el) {
    el.setAttribute("contenteditable", "true");
    el.focus();
  }

  disableEditable(el) {
    el.removeAttribute("contenteditable");
  }

  // ✅ CORRIGÉE : reçoit le workspace en paramètre
  render(blockData, isNewBlock = false, targetWorkspace = null) {
    const safeData = this.createData(blockData);

    const el = document.createElement("div");
    el.className = `block ${this.config.className}`;
    el.dataset.id = safeData.id;
    el.dataset.type = this.type;

    let { left, top } = safeData.position;

    if (isNewBlock) {
      const newPosition = this.calculateNewBlockPosition(targetWorkspace);
      top = newPosition.top;
      left = newPosition.left;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${safeData.size.width}px`;
    el.style.minHeight = `${safeData.size.height}px`;

    el.innerHTML = this.generateHTML(safeData);
    attachBlockControls(el);
    this.attachEvents(el, safeData);

    // Utiliser le workspace passé ou trouver la page active
    let workspace = targetWorkspace;
    if (!workspace) {
      workspace = document.querySelector('.page-content:last-child');
    }
    if (!workspace && typeof window.getCurrentPageContent === 'function') {
      workspace = window.getCurrentPageContent();
    }

    if (workspace) {
      setupBlockSelection(el, workspace);
    }
    el.setupImageUpload = (el, data) => {
      this.setupImageUpload(el, data);
    };

    return el;
  }



  // baseBlock.js - méthode add complète

add(workspace, data = {}) {
  let targetWorkspace = workspace;
  if (!targetWorkspace) {
      targetWorkspace = document.querySelector('.page-content:last-child');
  }
  if (!targetWorkspace && typeof window.getCurrentPageContent === 'function') {
      targetWorkspace = window.getCurrentPageContent();
  }
  
  if (!targetWorkspace) {
      console.error("❌ Impossible de trouver le workspace");
      return null;
  }
  
  const blockData = this.createData(data);
  const blockHeight = blockData.size.height || this.config.defaultHeight;
  const blockSpacing = this.config.blockSpacing || 10;
  
  const currentPage = targetWorkspace.closest('.page-item');
  const existingBlocks = targetWorkspace.querySelectorAll('.block');
  
  // Calculer la position Y du nouveau bloc
  let newTop = this.config.defaultTop;
  if (existingBlocks.length > 0) {
      const lastBlock = existingBlocks[existingBlocks.length - 1];
      newTop = lastBlock.offsetTop + lastBlock.offsetHeight + blockSpacing;
  }
  
  // Vérifier l'espace disponible
  const pageHeight = targetWorkspace.clientHeight;
  const bottomPosition = newTop + blockHeight;
  const marginBottom = 50;
  const needNewPage = existingBlocks.length > 0 && bottomPosition > pageHeight - marginBottom;
  
  // ✅ Si besoin d'une nouvelle page
  if (needNewPage) {
      //console.log("📄 Pas assez d'espace, création d'une nouvelle page...");
      
      // Créer une nouvelle page et l'obtenir
      let newPage = null;
      if (typeof window.addPage === 'function') {
          newPage = window.addPage();
      }
      
      // Attendre que la page soit dans le DOM
      if (newPage) {
          const newWorkspace = newPage.querySelector('.page-content');
          if (newWorkspace) {
              //console.log("✅ Bloc redirigé vers la nouvelle page");
              // Ajouter le bloc dans la nouvelle page (position par défaut)
              return this.add(newWorkspace, data);
          }
      }
  }
  
  // ✅ Ajout normal du bloc
  const blockEl = this.render(blockData, true, targetWorkspace);
  targetWorkspace.appendChild(blockEl);
  addBlockToState(blockData);
  
  // Appliquer la position
  const finalLeft = parseInt(blockEl.style.left) || this.config.defaultLeft;
  blockEl.style.top = `${newTop}px`;
  blockEl.style.left = `${finalLeft}px`;
  
  blockData.position = { left: finalLeft, top: newTop };
  
  //console.log(`✅ Bloc ajouté à la position top: ${newTop}px`);
  
  return blockEl;
}



}

export function createBlockType(type, config) {
  const block = new BaseBlock(type, config);
  return {
    createData: (data) => block.createData(data),
    render: (data, isNew, workspace) => block.render(data, isNew, workspace),
    add: (workspace, data) => block.add(workspace, data),
    attachEvents: (el, data) => block.attachEvents(el, data)
  };
}