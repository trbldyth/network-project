# Network

Network is a simple social network that allows user to create and edit existing posts, follow other users and "like" posts.
This project was created to understand how the backend and frontend interact, including API interaction.

### Technology stack:

Python, Django, DRF, JavaScript, Djoser

### How to set up the project on a local server?:

- Clone the repo:
```
git clone git@github.com/trbldyth/network-project.git
```

- Create an .env file and declare the following variables:
```
SECRET_KEY              # Django project secret key
DEBUG                   # default=TRUE
```

- Create/activate a virtual environment and install dependencies:
```
pip install -r requeirements.txt
```

- Aftewards, run migrations:
```
python3 manage.py makemigrations

python3 manage.py migrate
```

- To create a superuser:
```
python3 manage.py createsuperuser
```

- Collect static:
```
python3 manage.py collectstatic
```



### Author:

Michail Baylakov
