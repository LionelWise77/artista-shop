from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product 
        fields = ['id', 'title', 'slug', 'description', 'price', 'stock', 'primary_image', 'technique', 'width_cm', 'height_cm', 'is_active', 'created_at']