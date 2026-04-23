import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

// Fonction pour uploader l'image sur le serveur
async function uploadImage(file, blockId) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('block_id', blockId);
  
  try {
    const response = await fetch('/documents/upload-image/', {
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

// Crée l'input file
function createFileInput(blockEl, onUpload) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      showUploadingIndicator(blockEl);
      
      try {
        const blockId = blockEl.dataset.id;
        const imageUrl = await uploadImage(file, blockId);
        onUpload(imageUrl);
        hideUploadingIndicator(blockEl);
      } catch (error) {
        console.error("Erreur:", error);
        showUploadError(blockEl, error.message);
      }
    } else {
      alert("Veuillez sélectionner un fichier image valide");
    }
  });
  
  document.body.appendChild(fileInput);
  return fileInput;
}

// Indicateur de chargement
function showUploadingIndicator(blockEl) {
  const container = blockEl.querySelector('.image-container');
  if (container) {
    container.innerHTML = `
      <div class="image-uploading">
        <i class="fas fa-spinner fa-pulse"></i>
        <span>Upload en cours...</span>
      </div>
    `;
  }
}

function hideUploadingIndicator(blockEl) {
  // Rien à faire
}

function showUploadError(blockEl, message) {
  const container = blockEl.querySelector('.image-container');
  if (container) {
    container.innerHTML = `
      <div class="image-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Erreur: ${message}</span>
        <button class="retry-upload-btn">Réessayer</button>
      </div>
    `;
    
    const retryBtn = container.querySelector('.retry-upload-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const fileInput = blockEl._fileInput;
        if (fileInput) fileInput.click();
      });
    }
  }
}

const imageConfig = {
  defaultTitle: "Image",
  defaultContent: "", // Stocke l'URL de l'image (caché)
  defaultWidth: 400,
  defaultHeight: 350,
  defaultLeft: 40,
  defaultTop: 40,
  icon: "fa-image",
  iconColor: "#10b981",
  headerIcon: "fas fa-image",
  className: "image-block",
  autoStack: true,
  fields: ["title"], // On enlève "content" des champs éditables visibles
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
        <!-- Champ content caché pour stocker l'URL -->
        <input type="hidden" class="image-url-field" value="${data.content || ''}">
      </div>
    `;
  },
  customEvents: (blockEl, blockData) => {
    let fileInput = null;
    const titleEl = blockEl.querySelector('[data-field="title"]');
    const hiddenUrlField = blockEl.querySelector('.image-url-field');
    
    // Fonction pour mettre à jour l'image
    const updateImage = (imageUrl) => {
      if (hiddenUrlField) {
        hiddenUrlField.value = imageUrl;
        // Met à jour les données du bloc
        updateBlockContent(blockData.id, { content: imageUrl });
      }
      refreshImageDisplay();
    };
    
    // Rafraîchit l'affichage
    const refreshImageDisplay = () => {
      const container = blockEl.querySelector('.image-container');
      const currentImage = hiddenUrlField ? hiddenUrlField.value : "";
      const hasImage = currentImage && currentImage !== "";
      const title = titleEl ? titleEl.textContent.trim() : "Image";
      
      if (container) {
        if (hasImage) {
          container.innerHTML = `
            <div class="image-preview-wrapper">
              <img src="${currentImage}" alt="${title}" class="block-image-preview">
              <button class="image-remove-btn" title="Supprimer l'image">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
            <input type="hidden" class="image-url-field" value="${currentImage}">
          `;
          
          const removeBtn = container.querySelector('.image-remove-btn');
          if (removeBtn) {
            removeBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              await deleteImage(currentImage, blockData.id);
              removeImage();
            });
          }
        } else {
          container.innerHTML = `
            <div class="image-upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Cliquez pour uploader une image</span>
              <small>PNG, JPG, GIF max 5MB</small>
            </div>
            <input type="hidden" class="image-url-field" value="">
          `;
          
          const placeholder = container.querySelector('.image-upload-placeholder');
          if (placeholder) {
            placeholder.addEventListener('click', () => {
              if (fileInput) fileInput.click();
            });
          }
        }
        
        // Met à jour la référence au champ caché
        const newHiddenField = container.querySelector('.image-url-field');
        if (newHiddenField && newHiddenField !== hiddenUrlField) {
          // Re-attache les événements si nécessaire
        }
      }
    };
    
    // Supprime l'image
    const removeImage = () => {
      if (hiddenUrlField) {
        hiddenUrlField.value = "";
        updateBlockContent(blockData.id, { content: "" });
      }
      refreshImageDisplay();
    };
    
    // Supprime l'image du serveur
    async function deleteImage(imageUrl, blockId) {
      try {
        const response = await fetch('/documents/delete-image/', {
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
    
    // Crée l'input file
    fileInput = createFileInput(blockEl, (imageUrl) => {
      updateImage(imageUrl);
    });
    
    blockEl._fileInput = fileInput;
    
    // Initialise l'affichage
    refreshImageDisplay();
  }
};

const imageBlock = createBlockType("image", imageConfig);

export const createImageData = imageBlock.createData;
export const renderImage = imageBlock.render;
export const attachImageEvents = imageBlock.attachEvents;
export const addImage = imageBlock.add;