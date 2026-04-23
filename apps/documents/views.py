# apps/documents/views.py

import json
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
import uuid
from .models import Document, Dossier

# ========== TES VUES EXISTANTES (gardées) ==========

@csrf_exempt
def save_document(request, document_id):
    """Sauvegarde le document (API)"""
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    document = get_object_or_404(Document, id=document_id)

    try:
        data = json.loads(request.body)
        document.content_json = data
        document.save()

        return JsonResponse({
            "success": True,
            "message": "Document sauvegardé"
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)

@require_http_methods(["POST"])
def upload_document_image(request):
    """Upload une image pour un bloc de document"""
    try:
        image = request.FILES.get('image')
        block_id = request.POST.get('block_id')
        
        if not image:
            return JsonResponse({'success': False, 'error': 'Aucune image fournie'})
        
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return JsonResponse({'success': False, 'error': 'Type de fichier non autorisé'})
        
        if image.size > 5 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'Image trop volumineuse (max 5MB)'})
        
        ext = os.path.splitext(image.name)[1]
        filename = f"document_images/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, ContentFile(image.read()))
        image_url = default_storage.url(saved_path)
        
        return JsonResponse({
            'success': True,
            'image_url': image_url,
            'filename': filename
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_http_methods(["POST"])
def delete_document_image(request):
    """Supprime une image d'un bloc de document"""
    try:
        data = json.loads(request.body)
        image_url = data.get('image_url')
        
        if not image_url:
            return JsonResponse({'success': False, 'error': 'Aucune image spécifiée'})
        
        relative_path = image_url.replace(settings.MEDIA_URL, '')
        
        if default_storage.exists(relative_path):
            default_storage.delete(relative_path)
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# ========== NOUVELLES VUES ==========

# apps/documents/views.py

@login_required
def dashboard(request, dossier_id=None):
    """Dashboard avec arborescence (style VS Code)"""
    # Récupérer le dossier courant
    if dossier_id:
        dossier_actuel = get_object_or_404(Dossier, id=dossier_id, utilisateur=request.user)
    else:
        dossier_actuel = None
    
    # Récupérer les dossiers et documents du niveau courant
    dossiers = Dossier.objects.filter(parent=dossier_actuel, utilisateur=request.user)
    documents = Document.objects.filter(dossier=dossier_actuel, utilisateur=request.user)
    
    # Pour l'arborescence complète (sidebar)
    dossiers_racine = Dossier.objects.filter(parent=None, utilisateur=request.user)
    
    # ⚠️ CHANGEMENT ICI : utiliser le nouveau template
    return render(request, 'documents/dashboard_editor.html', {
        'dossier_actuel': dossier_actuel,
        'dossiers': dossiers,
        'documents': documents,
        'dossiers_racine': dossiers_racine,
    })


@login_required
def editeur(request, document_id):
    """Éditeur du document"""
    document = get_object_or_404(Document, id=document_id, utilisateur=request.user)
    return render(request, 'documents/editeur.html', {
        'document': document,
    })

@login_required
def creer_dossier(request):
    """Créer un dossier"""
    if request.method == 'POST':
        nom = request.POST.get('nom')
        parent_id = request.POST.get('parent_id')
        
        if nom:
            parent = None
            if parent_id:
                parent = get_object_or_404(Dossier, id=parent_id, utilisateur=request.user)
            
            Dossier.objects.create(
                nom=nom,
                parent=parent,
                utilisateur=request.user
            )
        
        if parent_id:
            return redirect('dossier', dossier_id=parent_id)
    return redirect('dashboard')

@login_required
def creer_document(request):
    """Créer un document (fichier)"""
    if request.method == 'POST':
        nom = request.POST.get('nom')
        dossier_id = request.POST.get('dossier_id')
        
        if nom:
            dossier = None
            if dossier_id:
                dossier = get_object_or_404(Dossier, id=dossier_id, utilisateur=request.user)
            
            Document.objects.create(
                title=nom,
                dossier=dossier,
                utilisateur=request.user,
                content_json={"blocks": []}
            )
        
        if dossier_id:
            return redirect('dossier', dossier_id=dossier_id)
    return redirect('dashboard')

@login_required
def supprimer_dossier(request, dossier_id):
    """Supprimer un dossier"""
    dossier = get_object_or_404(Dossier, id=dossier_id, utilisateur=request.user)
    parent_id = dossier.parent.id if dossier.parent else None
    dossier.delete()
    
    if parent_id:
        return redirect('dossier', dossier_id=parent_id)
    return redirect('dashboard')

@login_required
def supprimer_document(request, document_id):
    """Supprimer un document"""
    document = get_object_or_404(Document, id=document_id, utilisateur=request.user)
    dossier_id = document.dossier.id if document.dossier else None
    document.delete()
    
    if dossier_id:
        return redirect('dossier', dossier_id=dossier_id)
    return redirect('dashboard')


# apps/documents/views.py - Ajouter

import json
from django.http import JsonResponse

def api_explorer(request):
    """Retourne l'arborescence complète pour l'utilisateur"""
    def build_tree(parent=None):
        dossiers = Dossier.objects.filter(parent=parent, utilisateur=request.user)
        result = []
        for dossier in dossiers:
            # Récupérer les documents dans ce dossier
            documents = Document.objects.filter(dossier=dossier, utilisateur=request.user)
            result.append({
                'id': dossier.id,
                'nom': dossier.nom,
                'type': 'dossier',
                'enfants': build_tree(dossier),  # Sous-dossiers
                'documents': [
                    {'id': doc.id, 'nom': doc.title, 'type': 'document'}
                    for doc in documents
                ]
            })
        return result
    
    return JsonResponse(build_tree(), safe=False)

def api_document(request, document_id):
    """Retourne le contenu JSON d'un document"""
    document = get_object_or_404(Document, id=document_id, utilisateur=request.user)
    return JsonResponse(document.content_json)



def api_creer_document(request):
    """Crée un document via AJAX"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
    
    try:
        data = json.loads(request.body)
        nom = data.get('nom')
        dossier_id = data.get('dossier_id')
        
        if not nom:
            return JsonResponse({'error': 'Nom requis'}, status=400)
        
        dossier = None
        if dossier_id:
            dossier = get_object_or_404(Dossier, id=dossier_id, utilisateur=request.user)
        
        document = Document.objects.create(
            title=nom,
            dossier=dossier,
            utilisateur=request.user,
            content_json={"blocks": []}
        )
        
        return JsonResponse({
            'success': True,
            'id': document.id,
            'nom': document.title
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)