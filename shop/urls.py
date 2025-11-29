from django.urls import path
from . import views

app_name = 'shop'

urlpatterns = [
    # PUBLIC
    path('', views.product_list, name='product_list'),
    path('<slug:slug>/', views.product_detail, name='product_detail'),

    # PRODUCT MANAGEMENT
    path('manage/products/', views.manage_products, name='manage_products'),
    path('manage/products/add/', views.add_product, name='add_product'),
    path('manage/products/<int:pk>/edit/', views.edit_product, name='edit_product'),
    path('manage/products/<int:pk>/delete/', views.delete_product, name='delete_product'),

    # IMAGES
    path('manage/products/<int:product_id>/upload-image/', 
         views.upload_product_image, 
         name='upload_product_image'),

    path('manage/products/image/<int:image_id>/delete/', 
         views.delete_product_image, 
         name='delete_product_image'),

    # VARIANTS
    path('manage/products/<int:product_id>/variants/add/', 
         views.add_variant, 
         name='add_variant'),

    path('manage/variants/<int:variant_id>/edit/', 
         views.edit_variant, 
         name='edit_variant'),

    path('manage/variants/<int:variant_id>/delete/', 
         views.delete_variant, 
         name='delete_variant'),

    # CATEGORIES
    path('manage/categories/', views.manage_categories, name='manage_categories'),
    path('manage/categories/add/', views.add_category, name='add_category'),
    path('manage/categories/<int:pk>/edit/', views.edit_category, name='edit_category'),
    path('manage/categories/<int:pk>/delete/', views.delete_category, name='delete_category'),
]
