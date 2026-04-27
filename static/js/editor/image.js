// image.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

// Fonction pour uploader l'image sur le serveur
async function uploadImage(file, blockId) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('block_id', blockId);
  
  try {
    const response = await fetch('/api/upload-image/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.image_url;
    } else {
      throw new Error(result.error || "Erreur lors de l'upload");
    }
  } catch (error) {
    console.error("Erreur upload:", error);
    throw error;
  }
}

// Fonction pour obtenir le cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const imageConfig = {
  defaultTitle: "Image",
  defaultContent: "", // Stocke l'URL de l'image
  defaultWidth: 400,
  defaultHeight: 350,
  defaultLeft: 40,
  defaultTop: 40,
  icon: "fa-image",
  iconColor: "#10b981",
  headerIcon: "fas fa-image",
  className: "image-block",
  autoStack: true,
  editableFields: ["title", "content"], // ✅ content est l'URL de l'image
  
  customHtml: (data) => {
    const hasImage = data.content && data.content !== "";
    
    return `
      <div class="image-container">
        ${hasImage ? `
          <div class="image-preview-wrapper">
            <img src="${data.content}" alt="${data.title}" class="block-image-preview">
            <button class="image-remove-btn" title="Supprimer l'image">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        ` : `
          <div class="image-upload-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Cliquez pour uploader une image</span>
            <small>PNG, JPG, GIF max 5MB</small>
          </div>
        `}
      </div>
    `;
  },
  
  customCSS: `
    .image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    
    .image-upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }
    
    .image-upload-placeholder:hover {
      border-color: #10b981;
      background: #f0fdf4;
    }
    
    .image-upload-placeholder i {
      font-size: 48px;
      color: #10b981;
    }
    
    .image-upload-placeholder span {
      font-size: 14px;
      color: #475569;
    }
    
    .image-upload-placeholder small {
      font-size: 11px;
      color: #94a3b8;
    }
    
    .image-preview-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }
    
    .block-image-preview {
      width: 100%;
      height: auto;
      max-height: 300px;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .image-remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(239, 68, 68, 0.9);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .image-remove-btn:hover {
      background: #ef4444;
      transform: scale(1.05);
    }
  `,

  customEvents: (blockEl, blockData) => {
    let fileInput = null;
    
    // ✅ Fonction pour mettre à jour l'image dans les données
    const updateImage = async (imageUrl) => {
      // Mettre à jour les données du bloc
      blockData.content = imageUrl;
      await updateBlockContent(blockData.id, { content: imageUrl });
      
      // ✅ Forcer une sauvegarde immédiate
      if (window.triggerAutoSave) {
        setTimeout(() => window.triggerAutoSave(), 100);
      }
      
      refreshImageDisplay();
    };
    
    // ✅ Rafraîchit l'affichage
    const refreshImageDisplay = () => {
      const container = blockEl.querySelector('.image-container');
      const currentImage = blockData.content || "";
      const hasImage = currentImage && currentImage !== "";
      
      if (container) {
        if (hasImage) {
          container.innerHTML = `
            <div class="image-preview-wrapper">
              <img src="${currentImage}" alt="Image" class="block-image-preview">
              <button class="image-remove-btn" title="Supprimer l'image">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `;
          
          const removeBtn = container.querySelector('.image-remove-btn');
          if (removeBtn) {
            removeBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              await deleteImage(currentImage, blockData.id);
              blockData.content = "";
              await updateBlockContent(blockData.id, { content: "" });
              refreshImageDisplay();
              if (window.triggerAutoSave) {
                setTimeout(() => window.triggerAutoSave(), 100);
              }
            });
          }
        } else {
          container.innerHTML = `
            <div class="image-upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Cliquez pour uploader une image</span>
              <small>PNG, JPG, GIF max 5MB</small>
            </div>
          `;
          
          const placeholder = container.querySelector('.image-upload-placeholder');
          if (placeholder) {
            placeholder.addEventListener('click', () => {
              if (fileInput) fileInput.click();
            });
          }
        }
      }
    };
    
    // Supprime l'image du serveur
    async function deleteImage(imageUrl, blockId) {
      try {
        const response = await fetch('/api/delete-image/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: JSON.stringify({ image_url: imageUrl, block_id: blockId })
        });
        
        const result = await response.json();
        if (!result.success) {
          console.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
    
    // ✅ Crée l'input file et gère l'upload
    const setupFileInput = () => {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          try {
            const imageUrl = await uploadImage(file, blockData.id);
            await updateImage(imageUrl);
          } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'upload de l'image");
          }
        }
        fileInput.value = '';
      });
      
      document.body.appendChild(fileInput);
    };
    
    setupFileInput();
    refreshImageDisplay();
  }
};

const imageBlock = createBlockType("image", imageConfig);

export const createImageData = imageBlock.createData;
export const renderImage = imageBlock.render;
export const attachImageEvents = imageBlock.attachEvents;
export const addImage = imageBlock.add;

// ✅ Exporter la fonction de sérialisation pour la sauvegarde
export function serializeImage(blockEl) {
  const img = blockEl.querySelector('img');
  return img ? img.src : '';
}