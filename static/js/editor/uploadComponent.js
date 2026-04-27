// uploadComponent.js

export class UploadComponent {
    constructor(options = {}) {
      this.width = options.width || 270;
      this.height = options.height || 180;
      this.float = options.float || 'right';
      this.onSuccess = options.onSuccess || (() => {});
      this.onError = options.onError || (() => {});
      this.onProgress = options.onProgress || null;
    }
  
    createPlaceholder() {
      const div = document.createElement('div');
      div.className = `image-upload-placeholder float-${this.float}`;
      div.setAttribute('data-action', 'upload-image');
      div.style.cssText = `
        float: ${this.float};
        width: ${this.width}px;
        height: ${this.height}px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin: 0 0 10px 15px;
        transition: all 0.3s ease;
        border: 2px dashed #cbd5e1;
      `;
      
      div.innerHTML = `
        <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #94a3b8; margin-bottom: 8px;"></i>
        <span style="color: #64748b; font-size: 12px; text-align: center;">Cliquer pour ajouter<br>une image</span>
      `;
      
      this.addHoverEffects(div);
      return div;
    }
  
    addHoverEffects(element) {
      element.addEventListener('mouseenter', () => {
        element.style.borderColor = '#53195D';
        element.style.background = '#f5f0f9';
        const icon = element.querySelector('i');
        if (icon) icon.style.color = '#53195D';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.borderColor = '#cbd5e1';
        element.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
        const icon = element.querySelector('i');
        if (icon) icon.style.color = '#94a3b8';
      });
    }
 // uploadComponent.js - Modifier createImageWrapper

createImageWrapper(imageUrl, onDelete, onUpload, blockId) {
    const div = document.createElement('div');
    div.className = `image-wrapper float-${this.float}`;
    div.style.cssText = `
      float: ${this.float};
      width: ${this.width}px;
      margin: 0 0 10px 15px;
      position: relative;
    `;
    
    div.innerHTML = `
      <div class="image-container" style="position: relative;">
        <img src="${imageUrl}" style="width: 100%; height: ${this.height}px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div class="image-overlay" style="position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity 0.2s;">
          <button class="image-delete-btn" title="Supprimer" style="background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; color: white;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
     
      </div>
    `;
    
    const container = div.querySelector('.image-container');
    container.addEventListener('mouseenter', () => {
      const overlay = container.querySelector('.image-overlay');
      if (overlay) overlay.style.opacity = '1';
    });
    container.addEventListener('mouseleave', () => {
      const overlay = container.querySelector('.image-overlay');
      if (overlay) overlay.style.opacity = '0';
    });
    
    // Bouton supprimer
    const deleteBtn = div.querySelector('.image-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (onDelete) await onDelete();
        // Remplacer par le placeholder
        const placeholder = this.createPlaceholder();
        div.parentNode.replaceChild(placeholder, div);
        this.attachEvents(placeholder, onUpload, blockId);
      });
    }
    
    return div;
  }

  createUploadUI(onUpload, blockId) {
    const placeholder = this.createPlaceholder();
    
    placeholder.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/gif,image/webp';
      input.style.display = 'none';
      
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        placeholder.innerHTML = `
          <i class="fas fa-spinner fa-pulse" style="font-size: 32px; color: #53195D;"></i>
          <span style="color: #64748b; font-size: 12px;">Upload en cours...</span>
        `;
        
        try {
          const imageUrl = await onUpload(file, blockId);
          this.onSuccess(imageUrl);
          
          const imageWrapper = this.createImageWrapper(
            imageUrl, 
            '', 
            async () => {
              // Supprimer l'image
              this.onSuccess(null, '');
            },
            onUpload,
            blockId
          );
          placeholder.parentNode.replaceChild(imageWrapper, placeholder);
          
        } catch (error) {
          console.error('Upload failed:', error);
          placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #ef4444;"></i>
            <span style="color: #64748b; font-size: 12px;">Erreur, réessayer</span>
          `;
          setTimeout(() => {
            placeholder.innerHTML = `
              <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #94a3b8; margin-bottom: 8px;"></i>
              <span style="color: #64748b; font-size: 12px; text-align: center;">Cliquer pour ajouter<br>une image</span>
            `;
            this.attachEvents(placeholder, onUpload, blockId);
          }, 2000);
        }
      });
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
    
    return placeholder;
  }


  attachEvents(element, onUpload, blockId) {
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    
    newElement.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/gif,image/webp';
      
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        newElement.innerHTML = `<i class="fas fa-spinner fa-pulse" style="font-size: 32px; color: #53195D;"></i>`;
        
        try {
          const imageUrl = await onUpload(file, blockId);
          // ✅ Passer tous les paramètres nécessaires
          const imageWrapper = this.createImageWrapper(
            imageUrl, 
            '', 
            async () => {
              this.onSuccess(null, '');
            },
            onUpload,
            blockId
          );
          newElement.parentNode.replaceChild(imageWrapper, newElement);
        } catch (error) {
          newElement.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #ef4444;"></i>`;
          setTimeout(() => {
            newElement.innerHTML = `
              <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #94a3b8;"></i>
              <span>Cliquer pour ajouter une image</span>
            `;
          }, 2000);
        }
      });
      
      input.click();
    });
  }

  }