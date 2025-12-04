from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import stripe

from config import settings
from shop.forms import CategoryForm, ProductForm, VariantForm

from .models import (
    Product,
    ProductImage,
    Category,
    ProductVariant,
    Cart,
    CartItem,
    Order,
    OrderItem,
)


# ===========================================================
# PUBLIC SHOP VIEWS
# ===========================================================

def product_list(request):
    products = Product.objects.all().order_by('-created_at')
    return render(request, "shop/product_list.html", {
        "products": products,
    })


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    images = product.images.all()
    variants = product.variants.all()

    return render(request, "shop/product_detail.html", {
        "product": product,
        "images": images,
        "variants": variants,
    })


@login_required
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    variant_id = request.POST.get("variant_id")
    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id).first()

    cart, created = Cart.objects.get_or_create(user=request.user)

    existing_item = CartItem.objects.filter(
        cart=cart,
        product=product
    ).first()

    if existing_item:
        existing_item.quantity += 1
        existing_item.save()
        messages.success(request, f"Updated {product.title} quantity.")
    else:
        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=1
        )
        messages.success(request, f"{product.title} added to cart.")

    return redirect("shop:cart")


def success(request):
    return render(request, "shop/success.html")


def cancel(request):
    return render(request, "shop/cancel.html")


# ===========================================================
# CART SYSTEM (PUBLIC)
# ===========================================================

@login_required
def cart_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    items = cart.items.all()
    total = sum(item.total_price for item in items)

    return render(request, "shop/cart.html", {
        "cart": cart,
        "items": items,
        "total": total,
    })


@login_required
def remove_from_cart(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    item.delete()
    messages.success(request, "Item removed from cart.")
    return redirect("shop:cart")


@login_required
def update_cart_item(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)

    if request.method == "POST":
        new_quantity = request.POST.get("quantity")
        try:
            new_quantity = int(new_quantity)
            if new_quantity > 0:
                item.quantity = new_quantity
                item.save()
                messages.success(request, "Cart updated.")
            else:
                item.delete()
                messages.info(request, "Item removed from cart.")
        except ValueError:
            messages.error(request, "Invalid quantity.")

    return redirect("shop:cart")


# ===========================================================
# STRIPE CHECKOUT SESSION
# ===========================================================

@login_required
def create_checkout_session(request):
    print("🔥 VIEW HIT:", request.method, request.POST)

    if request.method != "POST":
        return redirect("shop:cart")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    cart, created = Cart.objects.get_or_create(user=request.user)
    items = cart.items.all()

    if not items:
        messages.error(request, "Your cart is empty.")
        return redirect("shop:cart")

    line_items = []
    for item in items:
        line_items.append({
            "price_data": {
                "currency": "gbp",
                "product_data": {
                    "name": item.product.title,
                },
                "unit_amount": int(item.product.price * 100),
            },
            "quantity": item.quantity,
        })

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,

            customer_email=request.user.email,
            billing_address_collection="required",
            shipping_address_collection={
                "allowed_countries": ["GB"],
            },
            metadata={
                "user_id": request.user.id,
            },

            success_url=request.build_absolute_uri(reverse("shop:success")),
            cancel_url=request.build_absolute_uri(reverse("shop:cancel")),
        )

        return redirect(session.url)

    except Exception as e:
        messages.error(request, f"Stripe error: {e}")
        return redirect("shop:cart")


# ===========================================================
# MANAGEMENT (ADMIN AREA)
# ===========================================================

@login_required
def manage_products(request):
    products = Product.objects.all().order_by('-created_at')
    return render(request, "shop/manage/products_list.html", {
        "products": products
    })


@login_required
def add_product(request):
    if request.method == "POST":
        form = ProductForm(request.POST)
        if form.is_valid():
            product = form.save()
            messages.success(request, "Product created.")
            return redirect("shop:edit_product", pk=product.pk)
    else:
        form = ProductForm()

    return render(request, "shop/manage/product_form.html", {
        "form": form
    })


@login_required
def edit_product(request, pk):
    product = get_object_or_404(Product, pk=pk)

    if request.method == "POST":
        form = ProductForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
            messages.success(request, "Product updated.")
        return redirect("shop:edit_product", pk=pk)

    form = ProductForm(instance=product)
    images = product.images.all()
    variants = product.variants.all()

    return render(request, "shop/manage/product_form.html", {
        "product": product,
        "form": form,
        "images": images,
        "variants": variants,
    })


@login_required
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    product.delete()
    messages.success(request, "Product deleted.")
    return redirect("shop:manage_products")


@login_required
def bulk_delete(request):
    ids = request.POST.getlist("ids")
    Product.objects.filter(id__in=ids).delete()
    messages.success(request, "Products deleted.")
    return redirect("shop:manage_products")


@login_required
def duplicate_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    product.pk = None
    product.slug = product.slug + "-copy"
    product.save()
    messages.success(request, "Product duplicated.")
    return redirect("shop:edit_product", pk=product.pk)


# ===========================================================
# IMAGE MANAGEMENT
# ===========================================================

@login_required
def upload_product_image(request, product_id):
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "POST" and request.FILES.getlist("images"):
        for img in request.FILES.getlist("images"):
            ProductImage.objects.create(product=product, image=img)
        messages.success(request, "Images uploaded.")
    return redirect("shop:edit_product", pk=product_id)


@login_required
def delete_product_image(request, image_id):
    image = get_object_or_404(ProductImage, pk=image_id)
    product_id = image.product.id
    image.delete()
    messages.success(request, "Image deleted.")
    return redirect("shop:edit_product", pk=product_id)


@login_required
def update_image_order(request):
    if request.method == "POST":
        order = request.POST.getlist("order[]")
        for idx, image_id in enumerate(order):
            ProductImage.objects.filter(id=image_id).update(position=idx)
        return JsonResponse({"status": "success"})


# ===========================================================
# CATEGORY MANAGEMENT
# ===========================================================

@login_required
def manage_categories(request):
    categories = Category.objects.all()
    return render(request, "shop/manage/categories_list.html", {
        "categories": categories
    })


@login_required
def add_category(request):
    if request.method == "POST":
        form = CategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Category added.")
            return redirect("shop:manage_categories")
    else:
        form = CategoryForm()

    return render(request, "shop/manage/category_form.html", {
        "form": form
    })


@login_required
def edit_category(request, pk):
    category = get_object_or_404(Category, pk=pk)

    if request.method == "POST":
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, "Category updated.")
            return redirect("shop:manage_categories")
    else:
        form = CategoryForm(instance=category)

    return render(request, "shop/manage/category_form.html", {
        "form": form,
        "category": category
    })


@login_required
def delete_category(request, pk):
    category = get_object_or_404(Category, pk=pk)
    category.delete()
    messages.success(request, "Category deleted.")
    return redirect("shop:manage_categories")


# ===========================================================
# VARIANT MANAGEMENT
# ===========================================================

@login_required
def add_variant(request, product_id):
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "POST":
        form = VariantForm(request.POST)
        if form.is_valid():
            variant = form.save(commit=False)
            variant.product = product
            variant.save()
            messages.success(request, "Variant added.")
            return redirect("shop:edit_product", pk=product_id)
    else:
        form = VariantForm()

    return render(request, "shop/manage/add_variant.html", {
        "form": form,
        "product": product,
    })


@login_required
def edit_variant(request, variant_id):
    variant = get_object_or_404(ProductVariant, pk=variant_id)
    product = variant.product

    if request.method == "POST":
        form = VariantForm(request.POST, instance=variant)
        if form.is_valid():
            form.save()
            messages.success(request, "Variant updated.")
            return redirect("shop:edit_product", pk=product.id)
    else:
        form = VariantForm(instance=variant)

    return render(request, "shop/manage/edit_variant.html", {
        "form": form,
        "variant": variant,
        "product": product,
    })


@login_required
def delete_variant(request, variant_id):
    variant = get_object_or_404(ProductVariant, pk=variant_id)
    product_id = variant.product.id
    variant.delete()
    messages.success(request, "Variant deleted.")
    return redirect("shop:edit_product", pk=product_id)


# ===========================================================
# STRIPE WEBHOOK – CREATES ORDERS AFTER PAYMENT
# ===========================================================

@csrf_exempt
def stripe_webhook(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    if endpoint_secret is None:
        return HttpResponse(status=200)

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        User = get_user_model()
        user = None
        user_id = session.get("metadata", {}).get("user_id")

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                user = None

        if not user:
            return HttpResponse(status=200)

        amount_total = session.get("amount_total") or 0
        total_price = amount_total / 100

        customer_details = session.get("customer_details") or {}
        shipping_details = session.get("shipping_details") or {}
        address = shipping_details.get("address") or {}

        order = Order.objects.create(
            user=user,
            email=customer_details.get("email"),
            total_price=total_price,
            stripe_session_id=session.get("id"),
            stripe_payment_intent=session.get("payment_intent"),
            shipping_name=shipping_details.get("name") or customer_details.get("name"),
            shipping_address1=address.get("line1"),
            shipping_address2=address.get("line2"),
            shipping_city=address.get("city"),
            shipping_postcode=address.get("postal_code"),
            shipping_country=address.get("country"),
        )

        line_items = stripe.checkout.Session.list_line_items(session["id"])

        for li in line_items["data"]:
            product_name = li.get("description")
            quantity = li.get("quantity", 1)

            product = Product.objects.filter(title=product_name).first()
            if product:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                )

        Cart.objects.filter(user=user).delete()

    return HttpResponse(status=200)


# ===========================================================
# ORDER MANAGEMENT (ADMIN AREA)
# ===========================================================

@login_required
def manage_orders(request):
    orders = Order.objects.all().order_by("-created_at")
    return render(request, "shop/manage/orders_list.html", {
        "orders": orders
    })


@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order, pk=order_id)

    if request.method == "POST":
        new_status = request.POST.get("status")
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            messages.success(request, "Order status updated.")
            return redirect("shop:order_detail", order_id=order.id)

    return render(request, "shop/manage/order_detail.html", {
        "order": order,
    })
