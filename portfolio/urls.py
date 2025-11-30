# portfolio/urls.py
from django.urls import path
from . import views

app_name = 'portfolio'  # Define the namespace for portfolio app

urlpatterns = [
    path('installations/', views.installations, name='installations'),  # Corrected name
    path('digital/', views.digital, name='digital'),  # Corrected name
    path('art/', views.art, name='art'),  # Corrected name
]
