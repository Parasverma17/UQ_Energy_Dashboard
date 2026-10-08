from django.urls import path
from . import views

urlpatterns = [
    path("", views.private_dashboard, name="private_dashboard"),  
    # http://127.0.0.1:8000/dashboard/
]
