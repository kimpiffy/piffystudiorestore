from django import forms
from .models import Product, ProductImage, Category, ProductVariant


# ============================
# PRODUCT FORM
# ============================
class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            'title',
            'category',
            'description',
            'price',
            'stock',
            'featured'
        ]


# ============================
# SINGLE IMAGE FORM
# ============================
class ProductImageForm(forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ['image']


# ============================
# MULTI-IMAGE UPLOADER
# ============================
class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultiImageUploadForm(forms.Form):
    images = forms.FileField(
        widget=MultipleFileInput(attrs={'multiple': True}),
        required=False
    )

    def clean_images(self):
        # ALWAYS return a list of uploaded files.
        # This bypasses Django's single-file validation.
        return self.files.getlist('images')


# ============================
# CATEGORY FORM
# ============================
class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description']


# ============================
# VARIANT FORM
# ============================
class VariantForm(forms.ModelForm):
    class Meta:
        model = ProductVariant
        fields = ['name', 'stock', 'price_adjust']
