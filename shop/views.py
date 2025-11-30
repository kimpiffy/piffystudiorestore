from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from accounts.decorators import staff_required

from .models import Product, ProductImage, Category, ProductVariant
from .forms import ProductForm, CategoryForm, MultiImageUploadForm, VariantForm


# ============================
# PUBLIC SHOP
# ============================
def product_list(request):
    products = Product.objects.all().order_by('-created_at')
    categories = Category.objects.all()
    return render(request, 'shop/product_list.html', {
        'products': products,
        'categories': categories
    })


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    return render(request, 'shop/product_detail.html', {
        'product': product
    })


# ============================
# PRODUCT MANAGEMENT
# ============================
@staff_required
def manage_products(request):
    products = Product.objects.all().order_by('-created_at')

    for p in products:
        p.featured = p.images.first()  # None if no images

    return render(request, 'shop/manage/products_list.html', {'products': products})


@staff_required
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)

        if form.is_valid():
            product = form.save()
            messages.success(request, "Product created successfully.")
            return redirect('shop:edit_product', pk=product.pk)

    else:
        form = ProductForm()

    return render(request, 'shop/manage/product_form.html', {
        'form': form,
        'product': None,
        'images': [],
        'variants': []
    })


@staff_required
def edit_product(request, pk):
    product = get_object_or_404(Product, pk=pk)

    if request.method == 'POST':
        form = ProductForm(request.POST, instance=product)

        if form.is_valid():
            form.save()

            action = request.POST.get("save_product")

            if action == "exit":
                messages.success(request, "Product saved. Returning to product list.")
                return redirect('shop:manage_products')

            messages.success(request, "Product updated successfully.")
            return redirect('shop:edit_product', pk=product.pk)

    else:
        form = ProductForm(instance=product)

    image_form = MultiImageUploadForm()

    return render(request, 'shop/manage/product_form.html', {
        'form': form,
        'product': product,
        'image_form': image_form,
        'images': product.images.all(),
        'variants': product.variants.all()
    })


@staff_required
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    title = product.title
    product.delete()
    messages.success(request, f"Product '{title}' deleted successfully.")
    return redirect('shop:manage_products')


# ============================
# IMAGE UPLOAD
# ============================
@staff_required
def upload_product_image(request, product_id):
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "POST":
        files = request.FILES.getlist("images")

        for f in files:
            ProductImage.objects.create(product=product, image=f)

        messages.success(request, "Images uploaded successfully.")
        return redirect('shop:edit_product', pk=product_id)

    return redirect('shop:edit_product', pk=product_id)


@staff_required
def delete_product_image(request, image_id):
    image = get_object_or_404(ProductImage, id=image_id)
    product_id = image.product.id
    image.delete()
    messages.success(request, "Image deleted successfully.")
    return redirect('shop:edit_product', pk=product_id)


# ============================
# VARIANT MANAGEMENT
# ============================
@staff_required
def add_variant(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == 'POST':
        form = VariantForm(request.POST)
        if form.is_valid():
            variant = form.save(commit=False)
            variant.product = product
            variant.save()
            messages.success(request, "Variant added successfully.")
            return redirect('shop:edit_product', pk=product.id)
    else:
        form = VariantForm()

    return render(request, 'shop/manage/variant_form.html', {
        'form': form,
        'product': product
    })


@staff_required
def edit_variant(request, variant_id):
    variant = get_object_or_404(ProductVariant, id=variant_id)

    if request.method == 'POST':
        form = VariantForm(request.POST, instance=variant)
        if form.is_valid():
            form.save()
            messages.success(request, "Variant updated successfully.")
            return redirect('shop:edit_product', pk=variant.product.id)
    else:
        form = VariantForm(instance=variant)

    return render(request, 'shop/manage/variant_form.html', {
        'form': form,
        'variant': variant,
        'product': variant.product
    })


@staff_required
def delete_variant(request, variant_id):
    variant = get_object_or_404(ProductVariant, id=variant_id)
    product_id = variant.product.id
    variant.delete()
    messages.success(request, "Variant deleted successfully.")
    return redirect('shop:edit_product', pk=product_id)


# ============================
# CATEGORY MANAGEMENT
# ============================
@staff_required
def manage_categories(request):
    categories = Category.objects.all().order_by('name')
    return render(request, 'shop/manage/categories_list.html', {
        'categories': categories
    })


@staff_required
def add_category(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Category created successfully.")
            return redirect('shop:manage_categories')
    else:
        form = CategoryForm()

    return render(request, 'shop/manage/category_form.html', {
        'form': form
    })


@staff_required
def edit_category(request, pk):
    category = get_object_or_404(Category, pk=pk)

    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, "Category updated successfully.")
            return redirect('shop:manage_categories')
    else:
        form = CategoryForm(instance=category)

    return render(request, 'shop/manage/category_form.html', {
        'form': form,
        'category': category
    })


@staff_required
def delete_category(request, pk):
    category = get_object_or_404(Category, pk=pk)
    name = category.name
    category.delete()
    messages.success(request, f"Category '{name}' deleted successfully.")
    return redirect('shop:manage_categories')


# ============================
# IMAGE ORDER UPDATE (AJAX)
# ============================
from django.http import JsonResponse
import json

@staff_required
def update_image_order(request):
    if request.method == "POST":
        data = json.loads(request.body)
        order_list = data.get("order", [])

        for item in order_list:
            img_id = item["id"]
            position = item["position"]

            try:
                img = ProductImage.objects.get(id=img_id)
                img.position = position
                img.save()
            except ProductImage.DoesNotExist:
                continue

        return JsonResponse({"status": "ok"})

    return JsonResponse({"error": "Invalid method"}, status=400)
