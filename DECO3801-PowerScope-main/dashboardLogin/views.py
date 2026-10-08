from django.shortcuts import render
from django.http import HttpResponse

# Create views that show the data
def login(request):
    return HttpResponse('This is the login page, enter details.')
