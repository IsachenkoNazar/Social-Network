Мета: мета створення цього проекту - була в особистому знайомстві з новими технологіями, навчанні дізнаватися про щось самостійно, комунікувати з іншими, та більше практикувати написання коду.


Склад команди:

Максим Субач: https://github.com/MaxS2010

Яромір Трегуб: https://github.com/YaromirTregub

Ісаченко Назарій: https://github.com/IsachenkoNazar


Зміст файлів( або навігація):

__init__.py - позначає папку як пакет

models.py — структура даних, таблиці БД

views.py - обробки запитів

urls.py - зв'язок URL і view

forms.pyФорми для вводу даних

admin.py - реєстрація моделей в Django Admin

apps.py - конфігурація додатку

tests.py -  перевірка, що моделі, views, форми працюють правильно

consumers.py  - обробляє вебсокет з'єднання для функцій (чат, сповіщення в реальному часі), схожий на  views.py, але для постійного з'єднання.

routing.py - файл для налаштування маршрутизації веб-сокет-з'єднання. Є аналогом urls.py та працює в асинхронному режимі. У цьому файлі ми створюємо адресу URL для веб-сокет з'єднання.

templates - папка, що зберігає в собі шаблони, які потім рендерить views.py

static - папка, що зберігає в собі статичні файли(такі як css, js, та зображення)

utils - в цьому файлі зберігаються функції, які не є моделлю, вьюхою, або формою, але потрібні для логіки


Використані технології та модулі:

Django — головний фреймворк на Python для створення сайтів.

Flask — інший, простіший фреймворк на Python, схожий на Django.

Django Channels — додаток до Django, щоб робити  функції типу чату в реальному часі.

WebSocket — технологія, яка дозволяє сайту і серверу обмінюватись повідомленнями миттєво, без перезавантаження сторінки.

ASGI — спосіб запуску Django-сайту, який підтримує WebSocket (на відміну від WSGI).

WSGI — стандартний спосіб запуску звичайного Django/Flask сайту.

Daphne — сервер, який запускає Django-проєкт з підтримкою WebSocket.

ORM — спосіб працювати з базою даних через Python-код.

SQLite — проста вбудована база даних, яку Django використовує за замовчуванням.

python-dotenv — модуль, щоб зберігати секретні дані (паролі, ключі) в окремому файлі .env.

Pillow — бібліотека для роботи з картинками (стиснення, зміна розміру).

django-phonenumber-field — готове поле для зручного введення номера телефону в формі.

colorama — робить текст у консолі кольоровим (для зручності читання помилок).

HTML — мова, якою описують структуру сторінки (заголовки, кнопки, текст).

CSS — мова, якою оформлюють вигляд сторінки (кольори, відступи, розміри).

JavaScript (JS) — мова програмування, яка робить сторінку інтерактивною (кнопки, анімації, запити).

jQuery — стара бібліотека JS, яка спрощує роботу з елементами сторінки.

AJAX — старий спосіб відправляти запити на сервер без перезавантаження сторінки.

Fetch API — сучасний, простіший спосіб робити те саме, що AJAX.

Jinja (Jinja2) — шаблонізатор (мова для вставки даних в HTML), схожий на Django Templates.

CSRF token — спеціальний ключ , який захищає форми від підробних запитів.

Cookies  — для запам'ятовування користувача між сторінками (наприклад, що він залогінений).

LiqPay — сервіс для приймання онлайн-оплати на сайті.

Git — програма для збереження історії змін коду.

GitHub — сайт, де зберігають код через Git і працюють командою.

pip — програма для встановлення Python-бібліотек.

venv — віртуальне середовище, для бібліотек одного проєкту.

requirements.txt — файл зі списком усіх бібліотек, які потрібні проєкту.

JSON — формат тексту, у якому сервер і сайт обмінюються даними


Як запустити проект в роботу:

1.Взяти проект з гіт( можна зробити гіт клон, або завантажити як ZIP

2.Створити віртуальне оточення, та встановити всі необхідні модулі

3. Запустити проект(python manage.py runserver), та відкрити посилання


Зміст проєкту:

user_app — відповідає за реєстрацію нових користувачів і вхід зареєстрованих. Перевіряє введені дані (email/пароль), і якщо все правильно — створює сесію, яка зберігається в куках. Захищає сторінки від тих, хто не залогінений (login_required). При виході сесія видаляється (logout). Усі форми захищені CSRF-токеном від підробних запитів.

home_app — формує головну сторінку сайту і базовий шаблон, від якого успадковуються всі інші сторінки (шапка, футер, навігаційне меню). Через context_processors.py передає одні й ті самі дані (наприклад, інформацію про поточного юзера) у всі шаблони сайту автоматично, без повторення коду в кожному view.

post_app — дає можливість створювати, переглядати, редагувати і видаляти пости. Модель Post пов'язана з тегами через ManyToManyField. Форма для поста прив'язана прямо до моделі (ModelForm), тож Django сам генерує поля та перевіряє дані. На сторінці показується обмежена кількість постів (пагінація), а картинки при завантаженні автоматично стискаються до потрібного розміру.

profile_app — зберігає й показує розширені дані про юзера: аватар, номер телефону, опис. Показує статус "онлайн/оффлайн". Реалізує систему друзів — запит, прийняття чи відхилення зв'язку, а також фільтрацію користувачів за типом зв'язку (друзі/не друзі).

chat_app — Дозволяє обмінюватись повідомленнями без перезавантаження сторінки через WebSocket (Django Channels). Підтримує особисті та групові чати, перевіряє список учасників при створенні групи, розсилає нові повідомлення всім учасникам одночасно та показує сповіщення про непрочитані повідомлення.


Висновок:

Проєкт був дуже корисний навіть в тому, що я зміг познайомитися з новими модулями, навчився працювати в команді, та фішкам для більш швидкого написання коду. Напевно також можна було б добавити якийсь косметичний функціонал, по типу стикерів, гіфок та іншого.




Goal: The goal of creating this project was to personally get acquainted with new technologies, learn to learn about something on your own, communicate with others, and practice writing code more.


Team members:

Maxim Subach: https://github.com/MaxS2010

Yaromir Tregub: https://github.com/YaromirTregub

Isachenko Nazariy: https://github.com/IsachenkoNazar



File contents (or navigation):

__init__.py - marks the folder as a package

models.py - data structure, DB tables

views.py - query processing

urls.py - URL and view binding

forms.pyForms for data entry

admin.py - registration of models in Django Admin

apps.py - application configuration

tests.py - checking that models, views, forms work correctly

consumers.py - handles websocket connections for functions (chat, real-time notifications), similar to views.py, but for persistent connections.

routing.py - a file for configuring web socket connection routing. It is an analogue of urls.py and works in asynchronous mode. In this file we create a URL for a web socket connection.

templates - a folder that stores templates, which are then rendered by views.py

static - a folder that stores static files (such as css, js, and images)

utils - this file stores functions that are not a model, view, or form, but are needed for logic


Technologies and modules used:

Django is the main Python framework for building websites.

Flask is another, simpler Python framework similar to Django.

Django Channels is an add-on to Django to do real-time chat-like features.

WebSocket is a technology that allows a website and a server to exchange messages instantly, without reloading the page.

ASGI is a way to launch a Django website that supports WebSocket (as opposed to WSGI).

WSGI is the standard way to launch a regular Django/Flask website.

Daphne is a server that runs a Django project with WebSocket support.

ORM is a way to work with a database through Python code.

SQLite is a simple built-in database that Django uses by default.

python-dotenv is a module to store secret data (passwords, keys) in a separate .env file.

Pillow — a library for working with images (compression, resizing).

django-phonenumber-field — a ready-made field for convenient entry of a phone number in a form.

colorama — makes the text in the console colored (for easy reading of errors).

HTML — a language used to describe the structure of a page (headings, buttons, text).

CSS — a language used to style a page (colors, padding, sizes).

JavaScript (JS) — a programming language that makes a page interactive (buttons, animations, queries).

jQuery — an old JS library that simplifies working with page elements.

AJAX — an old way to send requests to the server without reloading the page.

Fetch API — a modern, simpler way to do the same thing as AJAX.

Jinja (Jinja2) — a templating tool (a language for inserting data into HTML), similar to Django Templates.

CSRF token — a special key that protects forms from fraudulent requests.

Cookies — for remembering the user between pages (for example, that he is logged in).

LiqPay — a service for accepting online payments on the site.

Git — a program for saving the history of code changes.

GitHub — a site where code is stored via Git and worked as a team.

pip — a program for installing Python libraries.

venv — a virtual environment for libraries of one project.

requirements.txt — a file with a list of all libraries that the project needs.

JSON — a text format in which the server and the site exchange data


How to start the project:

1. Get the project from git (you can make a git clone, or download it as a ZIP

2. Create a virtual environment, and install all the necessary modules

3. Run the project (python manage.py runserver), and open the link


Project content:

user_app — responsible for registering new users and logging in registered ones. Checks the entered data (email/password), and if everything is correct — creates a session that is stored in cookies. Protects pages from those who are not logged in (login_required). When exiting, the session is deleted (logout). All forms are protected by a CSRF token from fake requests.

home_app — forms the main page of the site and the base template from which all other pages (header, footer, navigation menu) are inherited. Through context_processors.py, it transfers the same data (for example, information about the current user) to all site templates automatically, without repeating the code in each view.

post_app — allows you to create, view, edit, and delete posts. The Post model is associated with tags via ManyToManyField. The post form is directly linked to the model (ModelForm), so Django generates the fields and validates the data. A limited number of posts are displayed on the page (pagination), and images are automatically compressed to the required size when loaded.

profile_app — stores and displays extended user data: avatar, phone number, description. Shows the "online/offline" status. Implements the friend system — request, accept, or reject a connection, as well as filtering users by connection type (friends/not friends).

chat_app — Allows you to exchange messages without reloading the page via WebSocket (Django Channels). Supports personal and group chats, checks the list of participants when creating a group, sends new messages to all participants at once, and shows notifications about unread messages.


The project was very useful even in that I was able to get acquainted with new modules, learned how to work in a team, and features for faster code writing. It would probably also be possible to add some cosmetic functionality, such as stickers, gifs, and so on.
