# apps/editor/views.py

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Dossier, Fichier
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.contrib import messages
#from django.urls import reverse
from django.http import JsonResponse, Http404


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')
    return render(request, 'editor/login.html')

def logout_view(request):
    logout(request)
    return redirect('home')


def home(request):
    """Page d'accueil publique"""
    return render(request, 'editor/home.html')

@login_required
def dashboard(request):
    """Liste des dossiers racine (sans parent)"""
    dossiers = Dossier.objects.filter(enseignant=request.user, parent=None)
    return render(request, 'editor/dashboard.html', {'dossiers': dossiers})


def get_dossier_by_path(utilisateur, path):
    """Récupère un dossier par son chemin (ex: 'dossier1/dossier2')"""
    if not path:
        return None
    
    slugs = path.split('/')
    dossier = None
    
    for slug in slugs:
        dossier = get_object_or_404(Dossier, slug=slug, parent=dossier, enseignant=utilisateur)
    
    return dossier

def get_dossier_path(dossier):
    """Retourne le chemin complet d'un dossier (ex: 'parent1/parent2/dossier')"""
    if not dossier:
        return ''
    path_parts = []
    current = dossier
    while current:
        path_parts.insert(0, current.slug)
        current = current.parent
    return '/'.join(path_parts)


@login_required
def dossier_detail(request, path):
    dossier = get_dossier_by_path(request.user, path)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    sous_dossiers = Dossier.objects.filter(parent=dossier, enseignant=request.user)
    fichiers = Fichier.objects.filter(dossier=dossier)
    
    return render(request, 'editor/dossier.html', {
        'dossier': dossier,
        'sous_dossiers': sous_dossiers,
        'fichiers': fichiers,
        'chemin_complet': path,
    })


@login_required
def editeur(request, dossier_slug, fichier_slug):
    """Éditeur de fichier"""
    dossier = get_object_or_404(Dossier, slug=dossier_slug, enseignant=request.user)
    fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
    return render(request, 'editor/editeur.html', {
        'dossier': dossier,
        'fichier': fichier,
    })



@login_required
def creer_dossier(request):
    parent_id = request.GET.get('parent_id')
    parent_dossier = None
    parent_path = None
    
    if parent_id:
        parent_dossier = get_object_or_404(Dossier, id=parent_id, enseignant=request.user)
        parent_path = parent_dossier.get_full_path()
    
    if request.method == 'POST':
        nom = request.POST.get('nom')
        parent_id_post = request.POST.get('parent_id')
        
        if nom:
            parent = None
            if parent_id_post:
                parent = get_object_or_404(Dossier, id=parent_id_post, enseignant=request.user)
            
            dossier = Dossier.objects.create(
                nom=nom,
                parent=parent,
                enseignant=request.user
            )
            messages.success(request, f'Dossier "{nom}" créé avec succès')
            
            if parent:
                # ✅ Utiliser path au lieu de slug
                return redirect('dossier_detail', path=parent.get_full_path())
            else:
                return redirect('dashboard')
    
    return render(request, 'editor/creer_dossier.html', {
        'parent_path': parent_path,
        'parent_dossier': parent_dossier
    })


@login_required
def creer_fichier(request, chemin_dossier):
    dossier = get_dossier_by_path(request.user, chemin_dossier)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    if request.method == 'POST':
        titre = request.POST.get('titre')
        if titre:
            fichier = Fichier.objects.create(
                dossier=dossier,
                titre=titre,
                contenu={'blocks': []}
            )
            return redirect('editeur', chemin_dossier=chemin_dossier, fichier_slug=fichier.slug)
    
    return render(request, 'editor/creer_fichier.html', {'dossier': dossier})

@login_required
def editeur(request, chemin_dossier, fichier_slug):
    dossier = get_dossier_by_path(request.user, chemin_dossier)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
    
    # ✅ Construire le fil d'Ariane
    breadcrumb_items = []
    current = dossier
    while current:
        breadcrumb_items.insert(0, {
            'nom': current.nom,
            'slug': current.slug,
            'path': current.get_full_path()
        })
        current = current.parent
    
    return render(request, 'editor/belsekens.html', {
        'dossier': dossier,
        'fichier': fichier,
        'chemin_dossier': chemin_dossier,
        'breadcrumb_items': breadcrumb_items,  # ← Ajouter cette variable
    })

@csrf_exempt
@require_http_methods(["POST"])
def save_fichier_api(request, chemin_dossier, fichier_slug):
    """API de sauvegarde du fichier"""
    try:
        dossier = get_dossier_by_path(request.user, chemin_dossier)
        if not dossier:
            return JsonResponse({"success": False, "error": "Dossier non trouvé"}, status=404)
        
        fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
        
        data = json.loads(request.body)
        
        if 'pages' in data:
            fichier.contenu = data
        else:
            fichier.contenu = {'blocks': data.get('blocks', [])}
        
        fichier.save()
        
        return JsonResponse({
            "success": True,
            "message": "Fichier sauvegardé"
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)

@login_required
def renommer_dossier(request, path):
    dossier = get_dossier_by_path(request.user, path)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    if request.method == 'POST':
        nouveau_nom = request.POST.get('nom')
        if nouveau_nom:
            dossier.nom = nouveau_nom
            dossier.save()
            messages.success(request, f'Dossier renommé en "{nouveau_nom}"')
            # ✅ Rediriger vers le dossier (qui a le même chemin)
            return redirect('dossier_detail', path=dossier.get_full_path())
    
    return render(request, 'editor/renommer_dossier.html', {'dossier': dossier})


@login_required
def supprimer_dossier(request, path):
    dossier = get_dossier_by_path(request.user, path)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    parent_path = dossier.parent.get_full_path() if dossier.parent else None
    
    if request.method == 'POST':
        nom_verification = request.POST.get('confirm_nom')
        if nom_verification == dossier.nom:
            dossier.delete()
            messages.success(request, f'Dossier "{dossier.nom}" supprimé')
            if parent_path:
                return redirect('dossier_detail', path=parent_path)
            return redirect('dashboard')
        else:
            messages.error(request, 'Le nom ne correspond pas')
    
    return render(request, 'editor/supprimer_dossier.html', {'dossier': dossier})


@login_required
def renommer_fichier(request, chemin_dossier, fichier_slug):
    dossier = get_dossier_by_path(request.user, chemin_dossier)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
    
    if request.method == 'POST':
        nouveau_titre = request.POST.get('titre')
        if nouveau_titre:
            fichier.titre = nouveau_titre
            fichier.save()
            messages.success(request, f'Fichier renommé en "{nouveau_titre}"')
            return redirect('dossier_detail', path=chemin_dossier)
    
    return render(request, 'editor/renommer_fichier.html', {'fichier': fichier, 'chemin_dossier': chemin_dossier})

@login_required
def supprimer_fichier(request, chemin_dossier, fichier_slug):
    dossier = get_dossier_by_path(request.user, chemin_dossier)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
    
    if request.method == 'POST':
        titre_verification = request.POST.get('confirm_titre')
        if titre_verification == fichier.titre:
            fichier.delete()
            messages.success(request, f'Fichier "{fichier.titre}" supprimé')
            return redirect('dossier_detail', path=chemin_dossier)
        else:
            messages.error(request, 'Le titre ne correspond pas')
    
    return render(request, 'editor/supprimer_fichier.html', {'fichier': fichier, 'chemin_dossier': chemin_dossier})



# editor/views.py

from playwright.sync_api import sync_playwright
from django.http import HttpResponse
from django.template.loader import render_to_string
import tempfile
import os

@login_required
def export_pdf(request, chemin_dossier, fichier_slug):
    dossier = get_dossier_by_path(request.user, chemin_dossier)
    if not dossier:
        raise Http404("Dossier non trouvé")
    
    fichier = get_object_or_404(Fichier, dossier=dossier, slug=fichier_slug)
    
    pages = fichier.contenu.get('pages', [])
    
    # Préparer les données des graphiques pour le template
    import json
    for page in pages:
        for block in page.get('blocks', []):
            if block.get('type') == 'graph':
                # Convertir le contenu du graphique en JSON
                block['graph_data_json'] = json.dumps(block.get('content', {}))
    
    html_content = render_to_string('editor/export_pdf.html', {
        'fichier': fichier,
        'dossier': dossier,
        'pages': pages,
    })

    # Utiliser Playwright pour générer le PDF
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Charger le HTML
        page.set_content(html_content, wait_until='networkidle')
        
        # Générer le PDF au format A4
        pdf_bytes = page.pdf(
            format='A4',
            print_background=True,
            margin={
                'top': '20mm',
                'bottom': '20mm',
                'left': '15mm',
                'right': '15mm'
            }
        )
        
        browser.close()
    
    # Retourner le PDF
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{fichier.titre}.pdf"'
    return response



# apps/editor/views.py - AJOUTER CES FONCTIONS

import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def upload_image(request):
    """Upload une image pour un bloc"""
    try:
        image = request.FILES.get('image')
        block_id = request.POST.get('block_id')
        
        if not image:
            return JsonResponse({'success': False, 'error': 'Aucune image fournie'})
        
        # Vérifier le type de fichier
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return JsonResponse({'success': False, 'error': 'Type de fichier non autorisé'})
        
        # Vérifier la taille (max 5MB)
        if image.size > 5 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'Image trop volumineuse (max 5MB)'})
        
        # Générer un nom de fichier unique
        ext = os.path.splitext(image.name)[1]
        filename = f"editor_images/{uuid.uuid4().hex}{ext}"
        
        # Sauvegarder l'image
        saved_path = default_storage.save(filename, ContentFile(image.read()))
        image_url = default_storage.url(saved_path)
        
        return JsonResponse({
            'success': True,
            'image_url': image_url,
            'filename': filename
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def delete_image(request):
    """Supprime une image"""
    try:
        import json
        data = json.loads(request.body)
        image_url = data.get('image_url')
        
        if not image_url:
            return JsonResponse({'success': False, 'error': 'Aucune image spécifiée'})
        
        # Extraire le chemin relatif
        relative_path = image_url.replace(settings.MEDIA_URL, '')
        
        # Supprimer le fichier
        if default_storage.exists(relative_path):
            default_storage.delete(relative_path)
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    


# apps/editor/views.py - AJOUTER CETTE FONCTION

@csrf_exempt
@require_http_methods(["POST"])
def upload_video(request):
    """Upload une vidéo pour un bloc"""
    try:
        video = request.FILES.get('video')
        block_id = request.POST.get('block_id')
        
        if not video:
            return JsonResponse({'success': False, 'error': 'Aucune vidéo fournie'})
        
        # Vérifier le type de fichier
        allowed_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        if video.content_type not in allowed_types:
            return JsonResponse({'success': False, 'error': 'Type de fichier non autorisé (MP4, WebM, OGG)'})
        
        # Vérifier la taille (max 100MB)
        if video.size > 100 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'Vidéo trop volumineuse (max 100MB)'})
        
        # Générer un nom de fichier unique
        
        ext = os.path.splitext(video.name)[1]
        filename = f"editor_videos/{uuid.uuid4().hex}{ext}"
        
        # Sauvegarder la vidéo
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        saved_path = default_storage.save(filename, ContentFile(video.read()))
        video_url = default_storage.url(saved_path)
        
        return JsonResponse({
            'success': True,
            'video_url': video_url,
            'filename': filename
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    


# apps/editor/views.py - Ajouter

@csrf_exempt
@require_http_methods(["POST"])
def upload_audio(request):
    """Upload un fichier audio pour un bloc"""
    try:
        audio = request.FILES.get('audio')
        block_id = request.POST.get('block_id')
        
        if not audio:
            return JsonResponse({'success': False, 'error': 'Aucun fichier audio fourni'})
        
        # Vérifier le type de fichier
        allowed_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
        if audio.content_type not in allowed_types:
            return JsonResponse({'success': False, 'error': 'Type de fichier non autorisé (MP3, WAV, OGG, M4A)'})
        
        # Vérifier la taille (max 50MB)
        if audio.size > 50 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'Fichier audio trop volumineux (max 50MB)'})
        
        import os
        import uuid
        ext = os.path.splitext(audio.name)[1]
        filename = f"editor_audios/{uuid.uuid4().hex}{ext}"
        
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        saved_path = default_storage.save(filename, ContentFile(audio.read()))
        audio_url = default_storage.url(saved_path)
        
        return JsonResponse({
            'success': True,
            'audio_url': audio_url,
            'filename': filename
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})