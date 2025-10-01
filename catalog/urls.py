from django.urls import path
from .views import artwork_list

urlpatterns = [
    path("artworks/", artwork_list, name="artwork-list"),
]
