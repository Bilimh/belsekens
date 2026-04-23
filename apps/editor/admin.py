from django.contrib import admin
from .models import Dossier, Fichier

@admin.register(Dossier)
class DossierAdmin(admin.ModelAdmin):
    list_display = ('nom', 'slug', 'enseignant', 'date_creation')
    search_fields = ('nom', 'slug')
    list_filter = ('enseignant', 'date_creation')
    prepopulated_fields = {'slug': ('nom',)}

@admin.register(Fichier)
class FichierAdmin(admin.ModelAdmin):
    list_display = ('titre', 'slug', 'dossier', 'date_creation', 'date_modification')
    search_fields = ('titre', 'slug', 'dossier__nom')
    list_filter = ('dossier', 'date_creation')
    prepopulated_fields = {'slug': ('titre',)}
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('dossier')