from django.db import migrations, models
import django.db.models.deletion


def set_default_category(apps, schema_editor):
    Category = apps.get_model('shop', 'Category')
    Product = apps.get_model('shop', 'Product')

    category = Category.objects.order_by('id').first()
    if category is None:
        category = Category.objects.create(
            name='Uncategorized',
            slug='uncategorized',
            description='',
        )

    Product.objects.filter(category__isnull=True).update(category=category)


class Migration(migrations.Migration):
    """Legacy compatibility migration.

    The initial shop migration already creates the Product.category FK, so
    replaying the add-field step on a clean database causes a duplicate-column
    error. We keep the migration in the historical chain but make it a no-op at
    the database level, which avoids rewriting production-applied history while
    allowing local development databases to build cleanly.
    """

    dependencies = [
        ('shop', '0006_productlike_productlike_uniq_like_per_anon'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='product',
                    name='category',
                    field=models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='products',
                        to='shop.category',
                    ),
                ),
                migrations.RunPython(
                    set_default_category,
                    migrations.RunPython.noop,
                ),
                migrations.AlterField(
                    model_name='product',
                    name='category',
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='products',
                        to='shop.category',
                    ),
                ),
            ],
        ),
    ]
