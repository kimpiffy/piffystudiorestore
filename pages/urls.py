# pages/urls.py
from django.urls import path
from . import views

app_name = 'pages'  # Define the namespace for this app

urlpatterns = [
    path('', views.home, name='home'),  # Homepage URL
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
]
