from django.urls import path
from . import views

app_name = "dashboardLogin"
urlspatterns = [
    path('', views.login, name='login'),
]