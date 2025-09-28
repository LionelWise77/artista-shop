from django.db import models
from django.conf import settings
from catalog.models import Product

class Order(models.Model):
    STATUS = (("pending","Pending"),("paid","Paid"),("failed","Failed"),("canceled","Canceled"))
    email = models.EmailField()
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default=getattr(settings, "CURRENCY", "SEK"))
    stripe_payment_intent = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    title = models.CharField(max_length=150)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
