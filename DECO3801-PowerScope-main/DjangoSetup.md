HOW TO START DJANGO SERVER

1. Install Python and Pip if haven't already.
2. Create virtual environment python and acivate it (system dependant)
3.  There 's a requirements.txt file so use **pip install -r requirements.txt** to install Django and all dependencies.
4.  Open Django project root folder
5.  Create empty .env file in root directory.
6.  Enter SECRET_KEY = [your own made up key] in .env file. The real secret key has been ignored by git for security purposes
7.  Run Django server by typing **python manage.py runserver** in terminal
8.  Will be redirected to barebones login page.
9.  To access currently empty dashboard, type dashboard/ at the end of URL.
