// audio.js - Bloc audio professionnel

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

// ========== UTILITAIRES ==========

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

// ========== UPLOAD ==========

async function uploadAudio(file, blockId) {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('block_id', blockId);
  
  const response = await fetch('/api/upload-audio/', {
    method: 'POST',
    headers: { 'X-CSRFToken': getCookie('csrftoken') },
    body: formData
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Erreur d'upload");
  return result.audio_url;
}

// ========== CONFIGURATION ==========

const audioConfig = {
  defaultTitle: "Audio",
  defaultContent: "",
  defaultWidth: 500,
  defaultHeight: 120,
  defaultLeft: 40,
  defaultTop: 40,
  icon: "fas fa-headphones",
  iconColor: "#8b5cf6",
  className: "audio-block",
  autoStack: true,
  editableFields: ["title", "content"],
  
  customHtml: (data) => {
    const hasAudio = data.content && data.content !== "";
    return `
      <div class="audio-container" data-audio-url="${data.content || ''}">
        ${hasAudio ? `
          <div class="audio-player-wrapper">
            <div class="audio-info">
              <i class="fas fa-music"></i>
              <span class="audio-title">${data.title || "Piste audio"}</span>
            </div>
            <audio controls class="audio-player">
              <source src="${data.content}" type="audio/mpeg">
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
          <div class="audio-overlay">
            <button class="audio-remove-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            <button class="audio-edit-btn" title="Changer"><i class="fas fa-edit"></i></button>
          </div>
        ` : `
          <div class="audio-upload-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Cliquez pour uploader un fichier audio</span>
            <small>MP3, WAV, OGG, M4A max 50MB</small>
          </div>
          <div class="audio-url-input-group">
            <input type="text" class="audio-url-input" placeholder="Ou entrez un lien URL vers un fichier audio...">
            <button class="audio-url-submit">Ajouter</button>
          </div>
        `}
      </div>
    `;
  },
  
  customCSS: `
    .audio-container {
      width: 100%;
      min-height: 100px;
      position: relative;
    }
    
    .audio-upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 30px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 15px;
    }
    
    .audio-upload-placeholder:hover {
      border-color: #8b5cf6;
      background: #f5f3ff;
    }
    
    .audio-upload-placeholder i {
      font-size: 48px;
      color: #8b5cf6;
    }
    
    .audio-url-input-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .audio-url-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    
    .audio-url-input:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 2px rgba(139,92,246,0.1);
    }
    
    .audio-url-submit {
      padding: 10px 20px;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .audio-url-submit:hover {
      background: #7c3aed;
    }
    
    .audio-player-wrapper {
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .audio-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 150px;
    }
    
    .audio-info i {
      font-size: 28px;
      color: #8b5cf6;
    }
    
    .audio-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 14px;
      word-break: break-word;
    }
    
    .audio-player {
      flex: 2;
      min-width: 200px;
      height: 48px;
    }
    
    .audio-player::-webkit-media-controls-panel {
      background: white;
    }
    
    .audio-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    }
    
    .audio-container:hover .audio-overlay {
      opacity: 1;
    }
    
    .audio-remove-btn, .audio-edit-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }
    
    .audio-remove-btn:hover {
      background: #ef4444;
    }
    
    .audio-edit-btn:hover {
      background: #8b5cf6;
    }
  `,

  customEvents: (blockEl, blockData) => {
    let fileInput = null;
    
    const renderAudio = (url) => {
      const wrapper = blockEl.querySelector('.audio-player-wrapper');
      if (!wrapper) return;
      
      const title = blockData.title || "Piste audio";
      wrapper.innerHTML = `
        <div class="audio-info">
          <i class="fas fa-music"></i>
          <span class="audio-title">${title}</span>
        </div>
        <audio controls class="audio-player">
          <source src="${url}" type="audio/mpeg">
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      `;
    };
    
    const updateAudio = async (audioUrl) => {
      if (!audioUrl) {
        blockData.content = "";
        await updateBlockContent(blockData.id, { content: "" });
        refreshUI();
        return;
      }
      
      blockData.content = audioUrl;
      await updateBlockContent(blockData.id, { content: audioUrl });
      refreshUI();
      
      if (window.triggerAutoSave) setTimeout(() => window.triggerAutoSave(), 100);
    };
    
    const refreshUI = () => {
      const container = blockEl.querySelector('.audio-container');
      const currentUrl = blockData.content || "";
      const hasAudio = currentUrl && currentUrl !== "";
      
      if (!container) return;
      
      if (hasAudio) {
        container.innerHTML = `
          <div class="audio-player-wrapper"></div>
          <div class="audio-overlay">
            <button class="audio-remove-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            <button class="audio-edit-btn" title="Changer"><i class="fas fa-edit"></i></button>
          </div>
        `;
        renderAudio(currentUrl);
        
        container.querySelector('.audio-remove-btn')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await updateAudio('');
        });
        
        container.querySelector('.audio-edit-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          showInputForm();
        });
      } else {
        showInputForm();
      }
      
      blockEl.setAttribute('data-audio-url', currentUrl);
    };
    
    const showInputForm = () => {
      const container = blockEl.querySelector('.audio-container');
      if (!container) return;
      
      container.innerHTML = `
        <div class="audio-upload-placeholder">
          <i class="fas fa-cloud-upload-alt"></i>
          <span>Cliquez pour uploader un fichier audio</span>
          <small>MP3, WAV, OGG, M4A max 50MB</small>
        </div>
        <div class="audio-url-input-group">
          <input type="text" class="audio-url-input" placeholder="Ou entrez un lien URL vers un fichier audio...">
          <button class="audio-url-submit">Ajouter</button>
        </div>
      `;
      
      container.querySelector('.audio-upload-placeholder')?.addEventListener('click', () => fileInput?.click());
      
      const urlInput = container.querySelector('.audio-url-input');
      const urlSubmit = container.querySelector('.audio-url-submit');
      
      urlSubmit?.addEventListener('click', async () => {
        const url = urlInput?.value.trim();
        if (url) await updateAudio(url);
      });
      
      urlInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          const url = e.target.value.trim();
          if (url) await updateAudio(url);
        }
      });
    };
    
    const setupFileInput = () => {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
          try {
            const audioUrl = await uploadAudio(file, blockData.id);
            await updateAudio(audioUrl);
          } catch (err) {
            console.error(err);
            alert("Erreur lors de l'upload");
          }
        }
        fileInput.value = '';
      });
      
      document.body.appendChild(fileInput);
    };
    
    setupFileInput();
    refreshUI();
  }
};

const audioBlock = createBlockType("audio", audioConfig);

export const createAudioData = audioBlock.createData;
export const renderAudio = audioBlock.render;
export const attachAudioEvents = audioBlock.attachEvents;
export const addAudio = audioBlock.add;

// ✅ Sérialisation
export function serializeAudio(blockEl) {
  const url = blockEl.getAttribute('data-audio-url');
  if (url) return url;
  
  const audio = blockEl.querySelector('audio');
  const source = audio?.querySelector('source');
  return source?.src || '';
}