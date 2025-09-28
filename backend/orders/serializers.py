from rest_framework import serializers
from .models import Order, OrderItem
from catalog.models import Product
from decimal import Decimal

class OrderItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = ["id","email","status","subtotal","total","currency","created_at","items"]

    def get_items(self, obj):
        return [{"title":i.title,"unit_price":str(i.unit_price),"quantity":i.quantity} for i in obj.items.all()]

class OrderCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    items = OrderItemWriteSerializer(many=True)

    def create(self, data):
        items = data.pop("items")
        order = Order.objects.create(**data)
        subtotal = Decimal("0")
        for it in items:
            p = Product.objects.get(id=it["product_id"], is_active=True)
            qty = min(it["quantity"], p.stock)
            line_total = p.price * qty
            subtotal += line_total
            OrderItem.objects.create(order=order, product=p, title=p.title, unit_price=p.price, quantity=qty)
        order.subtotal = subtotal
        order.total = subtotal 
        order.save()
        return order
