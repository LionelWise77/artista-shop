from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Artwork  # asegúrate de tener un modelo Artwork
from .serializers import ArtworkSerializer

@api_view(['GET'])
def artwork_list(request):
    artworks = Artwork.objects.all()
    serializer = ArtworkSerializer(artworks, many=True)
    return Response(serializer.data)
