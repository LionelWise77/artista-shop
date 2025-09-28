from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import OrderCreateSerializer, OrderSerializer
from .models import Order

class CreateOrderAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        s = OrderCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        order = s.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class RetrieveOrderAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, _, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail":"Not found"}, status=404)
        return Response(OrderSerializer(order).data)
