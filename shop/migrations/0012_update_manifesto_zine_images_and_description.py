"""Data migration: update Manifesto Zine description and reorder images.

Updates the description to change "field guide" to "field notes" and use
paragraph breaks instead of //, and make manifestozine1-2 the main/first image.
"""
from django.db import migrations


def update_manifesto_zine(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug='manifesto-zine').first()
    if product:
        # Update description
        product.description = "An A5 zine all about the creative process, framed through a transformative, alchemical cycle.\n\nThis isn't your average self-help guide. It's a field notes for moving an idea from an intuitive notion into actualized form.\n\nThe five stages **Unveil, Articulate, Synthesize, Actualise and Distill** give the creative process a symbolic structure to follow, but the writing stays grounded in practice with affirming honesty that will help you to bring your brilliant ideas into reality."
        product.save()

    # Reorder images: move manifestozine1-2 to position 0
    images = ProductImage.objects.filter(product=product).order_by('position')
    image_list = list(images)

    if len(image_list) >= 2:
        # Find the manifestozine1-2 image
        target_index = None
        for idx, img in enumerate(image_list):
            if 'manifestozine1-2' in img.image.name:
                target_index = idx
                break

        if target_index is not None and target_index != 0:
            # Move it to front
            target_img = image_list.pop(target_index)
            image_list.insert(0, target_img)

            # Update positions
            for idx, img in enumerate(image_list):
                img.position = idx
                img.save()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0011_update_manifesto_zine_description'),
    ]

    operations = [
        migrations.RunPython(update_manifesto_zine, migrations.RunPython.noop),
    ]
