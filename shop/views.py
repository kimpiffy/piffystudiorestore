from django.shortcuts import render, redirect, get_object_or_404
from accounts.decorators import staff_required

from .models import Product, ProductImage, Category, ProductVariant
from .forms import (
    ProductForm,
    CategoryForm,
    MultiImageUploadForm,
    VariantForm
)


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
    return render(request, 'shop/manage/products_list.html', {
        'products': products
    })


@staff_required
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)

        if form.is_valid():
            product = form.save()
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
    """
    Product details + show images + show variants.
    NO image uploading logic is here anymore.
    """
    product = get_object_or_404(Product, pk=pk)

    if request.method == 'POST':
        form = ProductForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
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


# ============================
# DELETE PRODUCT
# ============================
@staff_required
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    product.delete()
    return redirect('shop:manage_products')


# ============================
# IMAGE UPLOAD (SEPARATE ENDPOINT)
# ============================
@staff_required
def upload_product_image(request, product_id):
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "POST":
        files = request.FILES.getlist("images")

        print("RAW FILES:", files)

        for f in files:
            ProductImage.objects.create(product=product, image=f)

        return redirect('shop:edit_product', pk=product_id)

    return redirect('shop:edit_product', pk=product_id)


        
    print("UPLOAD ERRORS:", form.errors)
    return redirect('shop:edit_product', pk=product_id)

    return redirect('shop:edit_product', pk=product_id)


@staff_required
def delete_product_image(request, image_id):
    image = get_object_or_404(ProductImage, id=image_id)
    product_id = image.product.id
    image.delete()
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
    category.delete()
    return redirect('shop:manage_categories')
