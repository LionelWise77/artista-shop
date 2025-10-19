import stripe
import os
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from orders.models import Order, OrderItem


def to_int_minor(amount: Decimal) -> int:
    """Convierte un Decimal a entero en centavos/öre (menor unidad)"""
    if amount is None:
        return 0
    cents = (amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) * 100)
    return int(cents)


class CreateCheckoutSession(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"detail": "order_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener la orden
        order = get_object_or_404(Order, id=order_id)
        if order.status != "pending":
            return Response(
                {"detail": f"Order {order.id} is not pending"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener items de la orden
        items = OrderItem.objects.filter(order=order).select_related("product")
        if not items.exists():
            return Response(
                {"detail": "Order has no items"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Construir line_items para Stripe
            line_items = []
            for item in items:
                unit_amount = to_int_minor(item.unit_price)
                
                if unit_amount <= 0:
                    return Response(
                        {"detail": f"Invalid unit amount for product {item.product_id}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if item.quantity <= 0:
                    return Response(
                        {"detail": f"Invalid quantity for product {item.product_id}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                line_items.append({
                    "quantity": item.quantity,
                    "price_data": {
                        "currency": (order.currency or "sek").lower(),
                        "unit_amount": unit_amount,
                        "product_data": {
                            "name": item.title,
                        },
                    },
                })

            # URLs de éxito y cancelación
            success_url = "http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}"
            cancel_url = "http://localhost:5173/checkout/cancel"
            
            # Production URLs (descomentar en producción)
            # success_url = "https://artista-shop.com/checkout/success?session_id={CHECKOUT_SESSION_ID}"
            # cancel_url = "https://artista-shop.com/checkout/cancel"

            # Crear sesión de Stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                mode="payment",
                line_items=line_items,
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"order_id": str(order.id)},
            )

            return Response(
                {"id": session.id, "url": session.url}, 
                status=status.HTTP_200_OK
            )

        except stripe.error.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Internal error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
def stripe_webhook(request):
    """Webhook para recibir eventos de Stripe"""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    # Verificar la firma del webhook
    try:
        event = stripe.Webhook.construct_event(
            payload, 
            sig_header, 
            endpoint_secret
        )
    except ValueError as e:
        # Payload inválido
        print(f"❌ Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Firma inválida
        print(f"❌ Invalid signature: {e}")
        return HttpResponse(status=400)

    # Manejar el evento
    event_type = event.get("type")
    
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        order_id = metadata.get("order_id")
        
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                order.status = "paid"
                # Opcional: guardar el monto total
                amount_total = session.get("amount_total", 0)
                if amount_total:
                    order.amount_total = Decimal(amount_total) / 100
                order.save()
                print(f"✅ Order {order_id} marked as paid")
            except Order.DoesNotExist:
                print(f"❌ Order {order_id} not found")

    return HttpResponse(status=200)