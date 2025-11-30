from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from accounts.decorators import staff_required
from .models import Product, ProductImage, Category, ProductVariant
from .forms import ProductForm, CategoryForm, MultiImageUploadForm, VariantForm
from django.shortcuts import get_object_or_404, redirect
from .models import Product, Cart, CartItem, Order
from django.http import JsonResponse
import json
try:
    import stripe
except ImportError:
    stripe = None


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

# ORDER SUCCESS PAGE
def success(request):
    return render(request, 'shop/success.html')  # Adjust the template path if necessary

# CANCEL PAGE

def cancel(request):
    return render(request, 'shop/cancel.html')  # Adjust the template path as needed


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

# BULK DELETE PRODUCTS

@staff_required
def bulk_delete(request):
    if request.method == "POST":
        ids = request.POST.getlist("selected_products[]")

        if ids:
            Product.objects.filter(id__in=ids).delete()
            messages.success(request, f"Deleted {len(ids)} products.")
        else:
            messages.error(request, "No products selected.")

    return redirect('shop:manage_products')


# DUPLICATE PRODUCT

@staff_required
def duplicate_product(request, pk):
    original = get_object_or_404(Product, pk=pk)

    # --- 1: Duplicate the product ---------------------------
    new_product = Product.objects.create(
        title = original.title + " (Copy)",
        slug = "",  # force regeneration
        category = original.category,
        description = original.description,
        price = original.price,
        stock = original.stock,
        featured = original.featured,
    )

    # Regenerate slug
    new_product.save()

    # --- 2: Duplicate variants ------------------------------
    for variant in original.variants.all():
        ProductVariant.objects.create(
            product=new_product,
            name=variant.name,
            stock=variant.stock,
            price_adjust=variant.price_adjust,
        )

    # --- 3: Duplicate images (with file copy) ----------------
    from django.core.files.base import ContentFile

    for img in original.images.all():
        old_file = img.image

        if not old_file:
            continue

        # Read the existing file
        old_file.open()
        file_content = old_file.read()
        old_file.close()

        # Save new image
        new_image = ProductImage(product=new_product)
        new_filename = old_file.name.split("/")[-1]

        new_image.image.save(
            f"copy_{new_product.id}_{new_filename}",
            ContentFile(file_content),
            save=True
        )

    messages.success(request, f"Product '{original.title}' duplicated.")
    return redirect('shop:edit_product', pk=new_product.pk)



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

# frontend product list

def product_list(request):
    # Fetch products and categories
    products = Product.objects.all().order_by('-created_at')
    categories = Category.objects.all()
    
    # Category filter
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    # Price filter
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price and max_price:
        products = products.filter(price__gte=min_price, price__lte=max_price)
    
    return render(request, 'shop/product_list.html', {
        'products': products,
        'categories': categories
    })

from django.conf import settings

# configure stripe if available
stripe_api_key = getattr(settings, "STRIPE_SECRET_KEY", None)
if stripe is not None and stripe_api_key:
    stripe.api_key = stripe_api_key

def create_checkout_session(request):
    if stripe is None:
        messages.error(request, "Stripe library is not installed. Please install the 'stripe' package.")
        return redirect('shop:product_list')

    # Get cart items, total price
    cart = Cart.objects.filter(user=request.user).first()
    if not cart or not hasattr(cart, 'items') or not cart.items.exists():
        messages.error(request, "Your cart is empty.")
        return redirect('shop:product_list')

    line_items = []
    for item in cart.items.all():
        unit_amount = int(item.product.price * 100)  # Stripe expects the price in cents
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': item.product.title,
                },
                'unit_amount': unit_amount,
            },
            'quantity': item.quantity,
        })

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=line_items,
        mode='payment',
        success_url=getattr(settings, "STRIPE_SUCCESS_URL", "http://yourdomain.com/success/"),
        cancel_url=getattr(settings, "STRIPE_CANCEL_URL", "http://yourdomain.com/cancel/"),
    )

    return redirect(session.url, code=303)


def success(request):
    # Assuming you store the order after a successful Stripe payment
    order_id = request.GET.get('session_id')  # Stripe session_id or order_id can be passed
    order = Order.objects.get(id=order_id)  # Retrieve the order from your database

    return render(request, 'shop/success.html', {
        'order': order,
    })

def create_checkout_session(request):
    # Create line items for the Stripe Checkout session (e.g., cart items)
    line_items = [
        {
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': 'T-shirt',
                },
                'unit_amount': 2000,  # Price in cents
            },
            'quantity': 1,
        },
    ]

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=line_items,
        mode='payment',
        success_url=request.build_absolute_uri('/thank-you/?session_id={CHECKOUT_SESSION_ID}'),  # Include session ID
        cancel_url=request.build_absolute_uri('/cancel/'),  # URL to redirect if canceled
    )

    return redirect(session.url, code=303)
