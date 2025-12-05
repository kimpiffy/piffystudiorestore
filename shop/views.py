from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
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
# SESSION CART HELPERS (GUEST SUPPORT)
# ===========================================================

def save_session_cart(request, data):
    request.session["cart"] = data
    request.session.modified = True


def get_session_cart(request):
    return request.session.get("cart", {})


# ===========================================================
# PUBLIC SHOP VIEWS
# ===========================================================

def product_list(request):
    products = Product.objects.all().order_by('-created_at')
    return render(request, "shop/product_list.html", {"products": products})


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    images = product.images.all()
    variants = product.variants.all()

    return render(request, "shop/product_detail.html", {
        "product": product,
        "images": images,
        "variants": variants,
    })


# ===========================================================
# ADD TO CART (GUEST + LOGGED-IN)
# ===========================================================

def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    # LOGGED-IN USER
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item = CartItem.objects.filter(cart=cart, product=product).first()

        if item:
            item.quantity += 1
            item.save()
        else:
            CartItem.objects.create(cart=cart, product=product, quantity=1)

        messages.success(request, f"{product.title} added to cart.")
        return redirect("shop:cart")

    # GUEST USER - SESSION CART
    cart = get_session_cart(request)

    pid = str(product.id)

    if pid in cart:
        cart[pid]["quantity"] += 1
    else:
        cart[pid] = {
            "title": product.title,
            "price": float(product.price),
            "quantity": 1,
        }

    save_session_cart(request, cart)
    messages.success(request, f"{product.title} added to cart.")
    return redirect("shop:cart")


# ===========================================================
# SUCCESS / CANCEL
# ===========================================================

def success(request):
    session_id = request.GET.get("session_id")
    order = None

    if session_id:
        order = Order.objects.filter(stripe_session_id=session_id).first()

    return render(request, "shop/success.html", {"order": order})


def cancel(request):
    return render(request, "shop/cancel.html")


# ===========================================================
# CART VIEW (GUEST + LOGGED-IN)
# ===========================================================

def cart_view(request):
    # LOGGED-IN
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items = cart.items.all()
        total = sum(item.total_price for item in items)

        return render(request, "shop/cart.html", {
            "cart": cart,
            "items": items,
            "total": total,
        })

    # GUEST
    cart = get_session_cart(request)
    items = []
    total = 0

    for pid, data in cart.items():
        total += data["price"] * data["quantity"]
        items.append({
            "id": pid,
            "title": data["title"],
            "quantity": data["quantity"],
            "total_price": data["price"] * data["quantity"],
        })

    return render(request, "shop/cart.html", {
        "cart": cart,
        "items": items,
        "total": total,
    })


# ===========================================================
# REMOVE FROM CART (GUEST + USER)
# ===========================================================

def remove_from_cart(request, item_id):
    # LOGGED-IN
    if request.user.is_authenticated:
        item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        item.delete()
        messages.success(request, "Item removed.")
        return redirect("shop:cart")

    # GUEST
    cart = get_session_cart(request)
    pid = str(item_id)

    if pid in cart:
        del cart[pid]

    save_session_cart(request, cart)
    messages.success(request, "Item removed.")
    return redirect("shop:cart")


# ===========================================================
# UPDATE CART (GUEST + USER)
# ===========================================================

def update_cart_item(request, item_id):
    # LOGGED-IN
    if request.user.is_authenticated:
        item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        qty = int(request.POST.get("quantity", 1))

        if qty > 0:
            item.quantity = qty
            item.save()
        else:
            item.delete()

        return redirect("shop:cart")

    # GUEST
    cart = get_session_cart(request)
    pid = str(item_id)
    qty = int(request.POST.get("quantity", 1))

    if pid in cart:
        if qty > 0:
            cart[pid]["quantity"] = qty
        else:
            del cart[pid]

    save_session_cart(request, cart)
    return redirect("shop:cart")


# ===========================================================
# STRIPE CHECKOUT SESSION (GUEST + USER)
# ===========================================================

def create_checkout_session(request):
    if request.method != "POST":
        return redirect("shop:cart")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # GET ITEMS
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.all()
    else:
        cart_items = request.session.get("cart", {})
    
    if not cart_items:
        messages.error(request, "Your cart is empty.")
        return redirect("shop:cart")

    # BUILD LINE ITEMS
    line_items = []

    if request.user.is_authenticated:
        for item in cart_items:
            line_items.append({
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": item.product.title},
                    "unit_amount": int(item.product.price * 100),
                },
                "quantity": item.quantity,
            })
    else:
        # SESSION CART
        for pid, data in cart_items.items():
            line_items.append({
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": data["title"]},
                    "unit_amount": int(float(data["price"]) * 100),
                },
                "quantity": data["quantity"],
            })

    # METADATA
    metadata = {}
    if request.user.is_authenticated:
        metadata["user_id"] = request.user.id

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=line_items,
        customer_email=request.user.email if request.user.is_authenticated else None,
        billing_address_collection="required",
        shipping_address_collection={"allowed_countries": ["GB"]},
        metadata=metadata,
        success_url=request.build_absolute_uri(
            reverse("shop:success")
        ) + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=request.build_absolute_uri(reverse("shop:cancel")),
    )

    return redirect(session.url)


# ===========================================================
# MANAGEMENT (ADMIN AREA)
# ===========================================================

@login_required
def manage_products(request):
    products = Product.objects.all().order_by('-created_at')
    return render(request, "shop/manage/products_list.html", {"products": products})


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

    return render(request, "shop/manage/product_form.html", {"form": form})


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
    return render(request, "shop/manage/categories_list.html", {"categories": categories})


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

    return render(request, "shop/manage/category_form.html", {"form": form})


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
# STRIPE WEBHOOK – FIXED + EMAIL + CLEAR SESSION CART
# ===========================================================

@csrf_exempt
def stripe_webhook(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    if not endpoint_secret:
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

        # USER METADATA
        User = get_user_model()
        user = None
        user_id = session.get("metadata", {}).get("user_id")

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                user = None

        # CUSTOMER INFO
        total_price = (session.get("amount_total") or 0) / 100
        customer_details = session.get("customer_details") or {}
        collected_info = session.get("collected_information", {}) or {}
        shipping_details = collected_info.get("shipping_details") or {}
        address = shipping_details.get("address") or {}

        # CREATE ORDER
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

        # CREATE ORDER ITEMS
        line_items = stripe.checkout.Session.list_line_items(session["id"])
        for li in line_items["data"]:
            product = Product.objects.filter(title=li.get("description")).first()
            if product:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=li.get("quantity", 1),
                )

        # SEND EMAIL
        if order.email:
            subject = "Your Piffy Studio Order Confirmation"
            message = render_to_string("emails/order_confirmation.txt", {
                "order": order,
                "items": order.items.all(),
            })
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [order.email],
                fail_silently=True,
            )

        # CLEAR DB CART
        if user:
            Cart.objects.filter(user=user).delete()

        # CLEAR SESSION CART (GUEST)
        request.session["cart"] = {}
        request.session.modified = True

    return HttpResponse(status=200)


# ===========================================================
# ORDER MANAGEMENT
# ===========================================================

@login_required
def manage_orders(request):
    orders = Order.objects.all().order_by("-created_at")
    return render(request, "shop/manage/orders_list.html", {"orders": orders})


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

    return render(request, "shop/manage/order_detail.html", {"order": order})
