from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def private_dashboard(request):
    return render(request, 'dashboard/private_dashboard.html')
