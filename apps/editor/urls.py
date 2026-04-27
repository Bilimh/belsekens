# apps/editor/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Authentification
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Pages principales
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Dossiers - Création
    path('dossiers/creer/', views.creer_dossier, name='creer_dossier'),
    
    # Fichiers - Création
    path('dossiers/<path:chemin_dossier>/fichiers/creer/', views.creer_fichier, name='creer_fichier'),
    
    # ⚠️ Éditeur (fichier) - avec /fichier/ dans l'URL
    path('dossiers/<path:chemin_dossier>/fichier/<slug:fichier_slug>/', views.editeur, name='editeur'),
    
    path('dossiers/<path:chemin_dossier>/fichier/<slug:fichier_slug>/renommer/', views.renommer_fichier, name='renommer_fichier'),
    path('dossiers/<path:chemin_dossier>/fichier/<slug:fichier_slug>/supprimer/', views.supprimer_fichier, name='supprimer_fichier'),
    
    # Dossiers - Renommer, Supprimer et Détail
    path('dossiers/<path:path>/renommer/', views.renommer_dossier, name='renommer_dossier'),
    path('dossiers/<path:path>/supprimer/', views.supprimer_dossier, name='supprimer_dossier'),
    path('dossiers/<path:path>/', views.dossier_detail, name='dossier_detail'),
    
    # API - Sauvegarde (avec /fichier/)
    path('api/save/<path:chemin_dossier>/fichier/<slug:fichier_slug>/', views.save_fichier_api, name='save_fichier_api'),
    path('export/<path:chemin_dossier>/<slug:fichier_slug>/pdf/', views.export_pdf, name='export_pdf'),

    path('api/upload-image/', views.upload_image, name='upload_image'),
    path('api/delete-image/', views.delete_image, name='delete_image'),
    path('api/upload-video/', views.upload_video, name='upload_video'),
    path('api/upload-audio/', views.upload_audio, name='upload_audio'),
]