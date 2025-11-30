# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include pages.urls for all pages (like about, contact, etc.)
    path('', include('pages.urls')),  # For homepage and other page views like about
    path('work/', include('portfolio.urls')),  # Work section
    path('interactions/', include('interactions.urls')),  # Interactions section
    path('shop/', include('shop.urls')),  # Shop section
    path('accounts/', include('accounts.urls')),  # Accounts section
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
