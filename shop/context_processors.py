from .models import Cart


def cart_count(request):
    count = 0

    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        count = sum(item.quantity for item in cart.items.all())
    else:
        cart = request.session.get("cart", {})
        count = sum(
            int(item.get("quantity", 0))
            for item in cart.values()
            if isinstance(item, dict)
        )

    return {"cart_count": count}
