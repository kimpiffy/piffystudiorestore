from django.urls import path
from . import views

app_name = 'interactions'

urlpatterns = [
    path('prompt/', views.creative_prompt, name='creative_prompt'),
    # path('like/<int:product_id>/', views.like_product, name='like_product'),
    # path('wishlist/<int:product_id>/', views.toggle_wishlist, name='toggle_wishlist'),
]
