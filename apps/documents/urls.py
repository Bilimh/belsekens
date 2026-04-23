# apps/documents/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('', views.dashboard, name='dashboard'),  # ← Route vide obligatoire !
    path('dossier/<int:dossier_id>/', views.dashboard, name='dossier'),
    
    # Éditeur
    path('editeur/<int:document_id>/', views.editeur, name='editeur'),
    
    # API
    path("save/<int:document_id>/", views.save_document, name="save_document"),
    path('upload-image/', views.upload_document_image, name='upload_document_image'),
    path('delete-image/', views.delete_document_image, name='delete_document_image'),
    
    # CRUD
    path('creer-dossier/', views.creer_dossier, name='creer_dossier'),
    path('creer-document/', views.creer_document, name='creer_document'),
    path('supprimer-dossier/<int:dossier_id>/', views.supprimer_dossier, name='supprimer_dossier'),
    path('supprimer-document/<int:document_id>/', views.supprimer_document, name='supprimer_document'),
    # apps/documents/urls.py - Ajouter

    path('api/explorer/', views.api_explorer, name='api_explorer'),
    path('api/document/<int:document_id>/', views.api_document, name='api_document'),
    path('api/creer-document/', views.api_creer_document, name='api_creer_document'),
]