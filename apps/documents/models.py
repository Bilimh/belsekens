# apps/documents/models.py

from django.db import models
from django.contrib.auth.models import User

class Dossier(models.Model):
    """Dossier pour organiser les documents"""
    nom = models.CharField(max_length=200)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nom']
    
    def __str__(self):
        return self.nom

class Document(models.Model):
    """Ton document existant - on ajoute juste user et dossier"""
    title = models.CharField(max_length=255, default="Sans titre")
    content_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ⚠️ NOUVEAUX CHAMPS
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    
    def __str__(self):
        return self.title