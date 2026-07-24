from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from shop.models import Product


class StaticViewSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return ["home", "about", "contact", "art", "digital", "people"]

    def location(self, item):
        if item in {"home", "about", "contact"}:
            return reverse(f"pages:{item}")
        return reverse(f"portfolio:{item}")


class ProductSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Product.objects.order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("shop:product_detail", kwargs={"slug": obj.slug})
