// uploadService.js

export class UploadService {
    constructor(endpoint) {
      this.endpoint = endpoint;
    }
  
    async upload(file, blockId, onProgress = null) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('block_id', blockId);
  
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress(e.loaded / e.total);
            }
          });
        }
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.success) {
                resolve(result.image_url);
              } else {
                reject(new Error(result.error));
              }
            } catch (e) {
              reject(new Error('Réponse invalide'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Erreur réseau')));
        
        xhr.open('POST', this.endpoint);
        xhr.setRequestHeader('X-CSRFToken', this.getCookie('csrftoken'));
        xhr.send(formData);
      });
    }
  
    getCookie(name) {
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
  }
  
  export const imageUploadService = new UploadService('/api/upload-image/');