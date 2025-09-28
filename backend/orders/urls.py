from django.urls import path
from .views import CreateOrderAPIView, RetrieveOrderAPIView
urlpatterns = [
    path("orders/", CreateOrderAPIView.as_view()),
    path("orders/<int:pk>/", RetrieveOrderAPIView.as_view()),
]
