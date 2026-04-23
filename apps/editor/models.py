# apps/editor/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class Dossier(models.Model):
    nom = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    enseignant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dossiers')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sous_dossiers')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.nom
    
    def get_ancestors(self):
        """Retourne la liste des dossiers parents (pour le breadcrumb)"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors
    
    def get_full_path(self):
        """Retourne le chemin complet du dossier (ex: 'parent1/parent2/dossier')"""
        if not self.parent:
            return self.slug
        return f"{self.parent.get_full_path()}/{self.slug}"


class Fichier(models.Model):
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='fichiers')
    titre = models.CharField(max_length=200)
    slug = models.SlugField(blank=True)
    contenu = models.JSONField(default=dict)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.titre