# config/urls.py
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from pages.sitemaps import StaticViewSitemap, ProductSitemap
from pages.views import robots_txt
from portfolio import views as portfolio_views


sitemaps = {
    "static": StaticViewSitemap,
    "products": ProductSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path("robots.txt", robots_txt, name="robots_txt"),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
    path(
        "community/<slug:slug>/",
        portfolio_views.community_project_detail,
        name="community_project_detail",
    ),

    # Include pages.urls for all pages (like about, contact, etc.)
    path('', include('pages.urls')),  # For homepage and other page views like about
    path('work/', include('portfolio.urls')),  # Work section
    path('interactions/', include('interactions.urls')),  # Interactions section
    path('shop/', include('shop.urls')),  # Shop section
    path('accounts/', include('accounts.urls')),  # Accounts section
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
