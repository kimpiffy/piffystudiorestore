# portfolio/urls.py
from django.urls import path, re_path
from . import views

app_name = 'portfolio'  # Define the namespace for portfolio app

urlpatterns = [
    path('people/', views.people, name='people'),
    path('digital/', views.digital, name='digital'),  # Corrected name
    path('art/', views.art, name='art'),  # Corrected name
    path('styles/', views.styles, name='styles'),
    path('industry/', views.industry, name='industry'),
    re_path(
        r'^industry/brand-guidelines\.pdf/?$',
        views.industry_brand_guidelines_pdf,
        name='industry_brand_guidelines_pdf',
    ),
    re_path(
        r'^styles/brand-guidelines\.pdf/?$',
        views.industry_brand_guidelines_pdf,
        name='styles_brand_guidelines_pdf',
    ),
]
