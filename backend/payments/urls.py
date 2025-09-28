from django.urls import path
from .views import CreateCheckoutSession, stripe_webhook
urlpatterns = [
    path("checkout/create-session/", CreateCheckoutSession.as_view()),
    path("stripe/webhook/", stripe_webhook),
]
