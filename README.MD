Social Network
Назва проєкту / Project Name
Соціальна мережа / Social Network
English Version
Українська версія
Description
Social Network is a web application built with Django and Django Channels. The project allows users to register accounts, create and manage posts, edit personal profiles, add friends, and communicate through real-time personal and group chats.
README Organization
Team Members
Technologies and Modules
Installation Guide
Project Structure
Application Description
Main Files Description
Conclusion
Project Purpose
This project was created to help beginner developers learn:
Django application architecture;
Database design using ORM;
Authentication and authorization systems;
Real-time communication with WebSockets;
Frontend and backend integration;
Team development using Git and GitHub.
The project demonstrates how a modern social network can be built using Python and Django technologies.
Team Members
Maxim Subach — https://github.com/MaxS2010
Yaromir Tregub — https://github.com/YaromirTregub
Nazar Isachenko — https://github.com/IsachenkoNazar
Technologies and Modules
Backend
Django — the main Python framework used to build the website.
Django Channels — extends Django with WebSocket support.
WebSocket — enables real-time communication between the client and the server.
ASGI — asynchronous server interface required for WebSocket support.
Daphne — ASGI server used to run the project.
ORM — simplifies database interaction through Python objects.
python-dotenv — stores sensitive configuration values in environment variables.
Pillow — image processing library.
Frontend
HTML — page structure.
CSS — page styling.
JavaScript — client-side interactivity.
Fetch API — asynchronous communication with the server.
Django Templates — dynamic HTML rendering.
Additional Technologies
SQLite — default database engine.
CSRF Protection — security mechanism against forged requests.
Cookies — session storage.
Installation Guide
1. Clone the Repository
git clone https://github.com/MaxS2010/Social-Network.git
2. Create a Virtual Environment
Windows:
python -m venv venv
venv\Scripts\activate
Linux/macOS:
python3 -m venv venv
source venv/bin/activate
3. Install Dependencies
pip install -r requirements.txt
4. Configure Environment Variables
Create a .env file and add the required environment variables.
Example:
SECRET_KEY=''

EMAIL_HOST_USER=""
EMAIL_HOST_PASSWORD=""

DATABASE_USER=""
DATABASE_PASSWORD=""
DATABASE_HOST=""
DATABASE_PORT=""
DATABASE_NAME=""

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
5. Apply Migrations
python manage.py migrate
6. Run the Development Server
python manage.py runserver
Open your browser and visit:
http://127.0.0.1:8000/
Project Structure
Social-Network
│
├── user_app
├── home_app
├── post_app
├── profile_app
├── chat_app
│
├── templates
├── static
├── media
│
├── manage.py
└── requirements.txt
Application Description
Project Screenshots
Home Page
![Home](static/README/home.png)
Profile Page
![Profile](static/README/profile.png)
Chat Page
![Chat](static/README/chat.png)
user_app
Responsible for:
user registration;
authentication;
session management;
logout functionality;
validation of registration and login forms;
protection of private pages through authentication decorators.
home_app
Responsible for:
the homepage;
the base template shared across the project;
global context data through context_processors.py.
post_app
Responsible for:
creating posts;
editing posts;
deleting posts;
pagination;
image uploads and compression;
tag management using Many-to-Many relationships.
profile_app
Responsible for:
user profiles;
profile avatars;
phone numbers and descriptions;
online/offline status indicators;
friendship management;
user filtering by friendship status.
chat_app



Responsible for:
personal chats;
group chats;
real-time messaging through WebSockets;
unread message notifications;
synchronization of chat updates between users.
Main Files Description
models.py
Contains database models and relationships.
views.py
Processes incoming HTTP requests and generates responses.
urls.py
Maps URLs to views.
forms.py
Contains Django forms used for user input validation.
admin.py
Registers models within Django Admin.
apps.py
Application configuration.
tests.py
Contains automated tests for models, forms, and views.
consumers.py
Handles WebSocket connections and real-time events.
routing.py
Defines WebSocket URL routes and routing configuration.
templates/
Stores HTML templates rendered by Django.
static/
Stores CSS, JavaScript files, icons, and images.
utils/
Contains helper functions and reusable business logic.
Key Features
Authentication System
User registration and login
Session-based authentication
CSRF protection
Social Features
User profiles
Friendship requests
Friend management
Online/offline status
Posts System
Create, edit, and delete posts
Image uploads
Tag support
Pagination
Real-Time Chat
Personal messaging
Group chats
WebSocket communication
Unread message notifications
Conclusion
This project provided valuable experience in web application development using Django and Django Channels. During development, the team gained practical knowledge of WebSockets, asynchronous communication, database design, frontend-backend interaction, and collaborative software development.
Future improvements may include stickers, GIF support, voice messages, message reactions, and additional social networking features.
Українська версія
Опис
Соціальна мережа, створена на Django та Django Channels. Проєкт дозволяє користувачам реєструватися, створювати пости, додавати друзів, переглядати профілі та обмінюватися повідомленнями в режимі реального часу.
Зміст
Учасники
Технології та модулі
Інструкція для запуску
Структура проєкту
Опис додатків
Опис основних файлів
Висновок
Мета проєкту
Цей проєкт був створений, щоб допомогти початківцям у програмуванні вивчити:
архітектуру вебзастосунків на Django;
проєктування баз даних за допомогою ORM;
системи автентифікації та авторизації користувачів;
обмін даними в режимі реального часу за допомогою WebSocket;
інтеграцію фронтенду та бекенду;
командну розробку з використанням Git і GitHub.
Проєкт демонструє, як за допомогою Python та технологій Django можна створити сучасну соціальну мережу з функціями взаємодії користувачів, публікації контенту та обміну повідомленнями в реальному часі.
Учасники
Максим Субач — https://github.com/MaxS2010
Яромір Трегуб — https://github.com/YaromirTregub
Назарій Ісаченко — https://github.com/IsachenkoNazar
Технології та модулі
Backend
Django — основний веб-фреймворк.
Django Channels — підтримка WebSocket.
Daphne — ASGI сервер.
WebSocket — обмін повідомленнями в реальному часі.
ORM — робота з базою даних через Python-код.
Python-dotenv — робота зі змінними середовища.
Pillow — обробка зображень.
Frontend
HTML
CSS
JavaScript
Fetch API
Django Templates (Jinja-подібний шаблонізатор)
Інше
SQLite
CSRF Token
Cookies
Інструкція для запуску
1. Клонування репозиторію
git clone <repository_url>
2. Створення віртуального оточення
Windows:
python -m venv venv
venv\Scripts\activate
Linux/macOS:
python3 -m venv venv
source venv/bin/activate
3. Встановлення залежностей
pip install -r requirements.txt
4. Налаштування .env
Створіть файл .env та додайте необхідні змінні середовища.
SECRET_KEY=''

EMAIL_HOST_USER=""
EMAIL_HOST_PASSWORD=""

DATABASE_USER=""
DATABASE_PASSWORD=""
DATABASE_HOST=""
DATABASE_PORT=""
DATABASE_NAME=""

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
5. Запуск проєкту
python manage.py migrate
python manage.py runserver
Запустіть ваш браузер і відкрийте:
http://127.0.0.1:8000/
Структура проєкту
Social-Network
│
├── user_app
├── home_app
├── post_app
├── profile_app
├── chat_app
│
├── templates
├── static
├── media
│
├── manage.py
└── requirements.txt
Опис додатків
Скріншоти проєкту
Home Page
![Home](static/README/home.png)
Profile Page
![Profile](static/README/profile.png)
Chat Page
![Chat](static/README/chat.png)
user_app
Відповідає за:
реєстрацію користувачів;
авторизацію;
вихід із системи;
перевірку даних форм;
роботу із сесіями та cookies.
home_app
Відповідає за:
головну сторінку;
передачу загальних даних через context_processors.
post_app
Відповідає за:
створення постів;
редагування постів;
видалення постів;
роботу із зображеннями;
систему тегів.
profile_app
Відповідає за:
профілі користувачів;
аватари;
статус онлайн/офлайн;
систему друзів;
фільтрацію користувачів.
chat_app
Відповідає за:
особисті чати;
групові чати;
повідомлення через WebSocket;
непрочитані повідомлення;
оновлення даних у реальному часі.
Опис основних файлів
models.py
Моделі бази даних.
views.py
Обробка HTTP-запитів.
urls.py
Маршрутизація URL.
forms.py
Форми введення даних.
admin.py
Реєстрація моделей в Django Admin.
apps.py
Конфігурація додатку.
tests.py
Тестування моделей, форм та представлень.
consumers.py
Обробка WebSocket-з'єднань.
routing.py
Маршрутизація WebSocket-з'єднань.
templates/
HTML-шаблони.
static/
CSS, JavaScript та зображення.
utils/
Допоміжні функції для бізнес-логіки.
Висновок
Під час розробки проєкту було отримано практичний досвід роботи з Django, Django Channels, WebSocket та командною розробкою. Проєкт дозволив покращити навички проєктування веб-застосунків, організації коду та роботи з сучасними вебтехнологіями.
У майбутньому проєкт можна розширити додаванням стікерів, GIF-анімацій, голосових повідомлень та інших соціальних функцій.
