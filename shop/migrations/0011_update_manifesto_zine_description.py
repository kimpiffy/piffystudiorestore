"""Data migration: update Manifesto Zine description.

Updates the manifesto-zine product description with the full A5 zine details
about the creative process and alchemical cycle.
"""
from django.db import migrations


def update_manifesto_zine_description(apps, schema_editor):
    Product = apps.get_model("shop", "Product")

    product = Product.objects.filter(slug='manifesto-zine').first()
    if product:
        product.description = "An A5 zine all about the creative process, framed through a transformative, alchemical cycle.\n\nThis isn't your average self-help guide. It's a field guide for moving an idea from an intuitive notion into actualized form. // The five stages **Unveil, Articulate, Synthesize, Actualise and Distill** give the creative process a symbolic structure to follow, but the writing stays grounded in practice with affirming honesty that will help you to bring your brilliant ideas into reality."
        product.save()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0010_add_manifesto_zine_images'),
    ]

    operations = [
        migrations.RunPython(update_manifesto_zine_description, migrations.RunPython.noop),
    ]
