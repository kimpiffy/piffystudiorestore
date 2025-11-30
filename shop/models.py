from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User

# ============================
# CATEGORY
# ============================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ============================
# PRODUCT
# ============================
class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=9, decimal_places=2)
    stock = models.PositiveIntegerField(default=10)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# ============================
# PRODUCT IMAGE
# ============================
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position']  

    def __str__(self):
        return f"{self.product.title} image"


# ============================
# PRODUCT VARIANT
# ============================
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)  # "Small", "A3 print", "Framed", etc.
    stock = models.PositiveIntegerField(default=0)
    price_adjust = models.DecimalField(max_digits=9, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('product', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.product.title} - {self.name}"

    @property
    def final_price(self):
        return self.product.price + self.price_adjust


# ============================
# CART
# ============================
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def total_price(self):
        return self.product.price * self.quantity


# ============================
# ORDER
# ============================
class Order(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('shop.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.quantity} x {self.product.title}"

# CREATING ORDER STORAGE (after payment success)
def create_order(session):
    user = session.customer if isinstance(session.customer, User) else None
    order = Order.objects.create(user=user, total_price=(session.amount_total / 100) if hasattr(session, 'amount_total') else 0)

    for item in getattr(session, 'line_items', []):
        product_name = item.get('product_data', {}).get('name')
        quantity = item.get('quantity', 1)

        product = Product.objects.filter(title=product_name).first() if product_name else None
        if product:
            OrderItem.objects.create(order=order, product=product, quantity=quantity)

    return order
