// video.js - Version professionnelle avec YouTube API

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

// ✅ Extraction fiable de l'ID YouTube
function extractYouTubeId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/shorts\/)([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ✅ Extraction fiable de l'ID Vimeo
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

// ✅ Nettoyer l'URL utilisateur
function cleanUserUrl(input) {
  let url = input.trim();
  if (!url) return null;
  
  url = url.split(' ')[0];
  url = url.split('\n')[0];
  
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  
  return url;
}

// ========== UPLOAD ==========

async function uploadVideo(file, blockId) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('block_id', blockId);
  
  const response = await fetch('/api/upload-video/', {
    method: 'POST',
    headers: { 'X-CSRFToken': getCookie('csrftoken') },
    body: formData
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Erreur d'upload");
  return result.video_url;
}

// ========== LECTEUR YOUTUBE (API) ==========

let youtubeApiReady = false;
let youtubeApiCallbacks = [];

function waitForYouTubeAPI() {
  return new Promise((resolve) => {
    if (youtubeApiReady) {
      resolve();
      return;
    }
    
    youtubeApiCallbacks.push(resolve);
    
    if (!document.querySelector('#youtube-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    window.onYouTubeIframeAPIReady = () => {
      youtubeApiReady = true;
      youtubeApiCallbacks.forEach(cb => cb());
      youtubeApiCallbacks = [];
    };
  });
}

function createYouTubePlayer(container, videoId) {
  const playerId = `youtube-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  container.innerHTML = `<div id="${playerId}" style="width:100%; height:360px;"></div>`;
  
  waitForYouTubeAPI().then(() => {
    new YT.Player(playerId, {
      height: '360',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      }
    });
  });
}

function createVimeoPlayer(container, videoId) {
  container.innerHTML = `<iframe 
    src="https://player.vimeo.com/video/${videoId}" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    style="width:100%; height:360px;">
  </iframe>`;
}

function createLocalVideoPlayer(container, url) {
  container.innerHTML = `
    <video controls style="width:100%; height:360px;">
      <source src="${url}" type="video/mp4">
      Votre navigateur ne supporte pas la lecture de vidéo.
    </video>
  `;
}

// ========== CONFIGURATION ==========

const videoConfig = {
  defaultTitle: "Vidéo",
  defaultContent: "",
  defaultWidth: 640,
  defaultHeight: 360,
  defaultLeft: 40,
  defaultTop: 40,
  icon: "fas fa-video",
  iconColor: "#ef4444",
  className: "video-block",
  autoStack: true,
  editableFields: ["title", "content"],
  
  customHtml: (data) => {
    const hasVideo = data.content && data.content !== "";
    return `
      <div class="video-container" data-video-url="${data.content || ''}">
        ${hasVideo ? `
          <div class="video-preview-wrapper"></div>
          <div class="video-overlay">
            <button class="video-remove-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            <button class="video-edit-btn" title="Changer"><i class="fas fa-edit"></i></button>
          </div>
        ` : `
          <div class="video-upload-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Cliquez pour uploader une vidéo</span>
            <small>MP4, WebM, OGG max 100MB</small>
          </div>
          <div class="video-url-input-group">
            <input type="text" class="video-url-input" placeholder="Lien YouTube ou Vimeo...">
            <button class="video-url-submit">Ajouter</button>
          </div>
        `}
      </div>
    `;
  },
  
  customCSS: `
    .video-container { width: 100%; min-height: 200px; position: relative; }
    .video-upload-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 40px; background: #f8fafc; border: 2px dashed #cbd5e1;
      border-radius: 12px; cursor: pointer; margin-bottom: 15px;
    }
    .video-upload-placeholder:hover { border-color: #ef4444; background: #fef2f2; }
    .video-upload-placeholder i { font-size: 48px; color: #ef4444; }
    .video-url-input-group { display: flex; gap: 10px; align-items: center; }
    .video-url-input { flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
    .video-url-input:focus { border-color: #ef4444; outline: none; }
    .video-url-submit { padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .video-url-submit:hover { background: #dc2626; }
    .video-preview-wrapper { width: 100%; background: #000; border-radius: 8px; overflow: hidden; min-height: 360px; }
    .video-preview-wrapper iframe { width: 100%; height: 360px; display: block; border: none; }
    .video-overlay { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; z-index: 10; }
    .video-container:hover .video-overlay { opacity: 1; }
    .video-remove-btn, .video-edit-btn { background: rgba(0,0,0,0.7); border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; color: white; transition: all 0.2s; }
    .video-remove-btn:hover { background: #ef4444; }
    .video-edit-btn:hover { background: #3b82f6; }
  `,

  customEvents: (blockEl, blockData) => {
    let fileInput = null;
    let currentPlayerType = null;
    
    // ✅ Rendu fiable de la vidéo
    const renderVideo = (url) => {
      const wrapper = blockEl.querySelector('.video-preview-wrapper');
      if (!wrapper) return;
      
      const youtubeId = extractYouTubeId(url);
      const vimeoId = extractVimeoId(url);
      const isLocal = url && (url.startsWith('/media/') || url.includes('editor_videos/') || url.match(/\.(mp4|webm|ogg)$/i));
      
      if (youtubeId) {
        currentPlayerType = 'youtube';
        createYouTubePlayer(wrapper, youtubeId);
      } else if (vimeoId) {
        currentPlayerType = 'vimeo';
        createVimeoPlayer(wrapper, vimeoId);
      } else if (isLocal) {
        currentPlayerType = 'local';
        createLocalVideoPlayer(wrapper, url);
      } else if (url) {
        wrapper.innerHTML = `<div style="color:red; padding:20px; text-align:center;">Lien non reconnu</div>`;
      }
      
      blockEl.setAttribute('data-video-url', url || '');
    };
    
    // ✅ Mettre à jour et sauvegarder
    const updateVideo = async (url) => {
      if (!url) {
        blockData.content = "";
        await updateBlockContent(blockData.id, { content: "" });
        refreshUI();
        return;
      }
      
      blockData.content = url;
      await updateBlockContent(blockData.id, { content: url });
      refreshUI();
      
      if (window.triggerAutoSave) setTimeout(() => window.triggerAutoSave(), 100);
    };
    
    // ✅ Interface utilisateur
    const refreshUI = () => {
      const container = blockEl.querySelector('.video-container');
      const currentUrl = blockData.content || "";
      const hasVideo = currentUrl && currentUrl !== "";
      
      if (!container) return;
      
      if (hasVideo) {
        container.innerHTML = `
          <div class="video-preview-wrapper"></div>
          <div class="video-overlay">
            <button class="video-remove-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            <button class="video-edit-btn" title="Changer"><i class="fas fa-edit"></i></button>
          </div>
        `;
        renderVideo(currentUrl);
        
        container.querySelector('.video-remove-btn')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          await updateVideo('');
        });
        
        container.querySelector('.video-edit-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          showInputForm();
        });
      } else {
        showInputForm();
      }
    };
    
    const showInputForm = () => {
      const container = blockEl.querySelector('.video-container');
      if (!container) return;
      
      container.innerHTML = `
        <div class="video-upload-placeholder">
          <i class="fas fa-cloud-upload-alt"></i>
          <span>Cliquez pour uploader une vidéo</span>
          <small>MP4, WebM, OGG max 100MB</small>
        </div>
        <div class="video-url-input-group">
          <input type="text" class="video-url-input" placeholder="Lien YouTube ou Vimeo...">
          <button class="video-url-submit">Ajouter</button>
        </div>
      `;
      
      container.querySelector('.video-upload-placeholder')?.addEventListener('click', () => fileInput?.click());
      
      const urlInput = container.querySelector('.video-url-input');
      const urlSubmit = container.querySelector('.video-url-submit');
      
      urlSubmit?.addEventListener('click', async () => {
        const rawUrl = urlInput?.value.trim();
        const cleanUrl = cleanUserUrl(rawUrl);
        if (cleanUrl) await updateVideo(cleanUrl);
      });
      
      urlInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          const cleanUrl = cleanUserUrl(e.target.value);
          if (cleanUrl) await updateVideo(cleanUrl);
        }
      });
    };
    
    // ✅ Upload local
    const setupFileInput = () => {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'video/mp4,video/webm,video/ogg';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
          try {
            const videoUrl = await uploadVideo(file, blockData.id);
            await updateVideo(videoUrl);
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

const videoBlock = createBlockType("video", videoConfig);

export const createVideoData = videoBlock.createData;
export const renderVideo = videoBlock.render;
export const attachVideoEvents = videoBlock.attachEvents;
export const addVideo = videoBlock.add;

// ✅ Sérialisation
export function serializeVideo(blockEl) {
  const url = blockEl.getAttribute('data-video-url');
  if (url) return url;
  
  const iframe = blockEl.querySelector('iframe');
  if (iframe) {
    let src = iframe.src;
    const youtubeId = extractYouTubeId(src);
    if (youtubeId) return `https://www.youtube.com/watch?v=${youtubeId}`;
    
    const vimeoId = extractVimeoId(src);
    if (vimeoId) return `https://vimeo.com/${vimeoId}`;
    
    return src;
  }
  
  const video = blockEl.querySelector('video');
  const source = video?.querySelector('source');
  return source?.src || '';
}