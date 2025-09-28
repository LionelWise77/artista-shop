import os, stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from orders.models import Order, OrderItem

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class CreateCheckoutSession(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        order_id = request.data.get("order_id")
        success_url = request.data.get("success_url", "http://localhost:5173/success?order={CHECKOUT_SESSION_ID}")
        cancel_url = request.data.get("cancel_url", "http://localhost:5173/cart")
        try:
            order = Order.objects.get(id=order_id, status="pending")
        except Order.DoesNotExist:
            return Response({"detail":"Order not found"}, status=404)

        line_items = []
        for item in order.items.all():
            line_items.append({
                "price_data": {
                    "currency": order.currency.lower(),
                    "product_data": {"name": item.title},
                    "unit_amount": int(item.unit_price * 100),  # cents/öre
                },
                "quantity": item.quantity,
            })

        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": str(order.id)},
        )
        return Response({"url": session.url}, status=status.HTTP_200_OK)

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        return HttpResponse(status=400)

    if event["type"] in ("checkout.session.completed", "payment_intent.succeeded"):
        data = event["data"]["object"]
        order_id = data.get("metadata", {}).get("order_id") or data.get("metadata", {}).get("order")
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                order.status = "paid"
                # TODO: opcional: reducir stock de cada product aquí
                order.save()
            except Order.DoesNotExist:
                pass
    return HttpResponse(status=200)
