from django.urls import path
from . import views

app_name = "shop"

urlpatterns = [
    path('manage/products/', views.manage_products, name='manage_products'),
    path('manage/products/add/', views.add_product, name='add_product'),
    path('manage/products/<int:pk>/edit/', views.edit_product, name='edit_product'),
    path('manage/products/<int:pk>/delete/', views.delete_product, name='delete_product'),

    # Image uploads + ordering
    path('manage/products/<int:product_id>/images/upload/', views.upload_product_image, name='upload_product_image'),
    path('manage/images/<int:image_id>/delete/', views.delete_product_image, name='delete_product_image'),
    path('manage/images/reorder/', views.update_image_order, name='update_image_order'),

    # Categories
    path('manage/categories/', views.manage_categories, name='manage_categories'),
    path('manage/categories/add/', views.add_category, name='add_category'),
    path('manage/categories/<int:pk>/edit/', views.edit_category, name='edit_category'),
    path('manage/categories/<int:pk>/delete/', views.delete_category, name='delete_category'),

    # Variants
    path('manage/variants/add/<int:product_id>/', views.add_variant, name='add_variant'),
    path('manage/variants/<int:variant_id>/edit/', views.edit_variant, name='edit_variant'),
    path('manage/variants/<int:variant_id>/delete/', views.delete_variant, name='delete_variant'),
]
