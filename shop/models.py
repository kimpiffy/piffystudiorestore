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

# ============================
# ORDER
# ============================
class Order(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    email = models.EmailField(blank=True, null=True)

    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)

    STATUS_CHOICES = [
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="paid")

    # shipping info collected from Stripe Checkout
    shipping_name = models.CharField(max_length=255, blank=True, null=True)
    shipping_address1 = models.CharField(max_length=255, blank=True, null=True)
    shipping_address2 = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=255, blank=True, null=True)
    shipping_postcode = models.CharField(max_length=50, blank=True, null=True)
    shipping_country = models.CharField(max_length=2, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"



class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('shop.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.quantity} x {self.product.title}"

