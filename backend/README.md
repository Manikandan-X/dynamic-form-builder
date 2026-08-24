# Dynamic Form Builder - Backend

Backend API for a **Dynamic Form Builder** application that allows administrators to create and manage dynamic forms without hardcoding individual form structures.

The system supports multiple field types, field validation, conditional fields, form publishing, response submission, file uploads, authentication, and role-based access.

---

## 🚀 Features

### Authentication & Authorization
- User registration & login
- JWT-based authentication
- Protected API endpoints
- Role-based access control (Admin, Employee/User)
- Password hashing
- Change password
- Forgot/reset password support

### Dynamic Form Builder
Administrators can create forms dynamically without changing backend code.

**Supported field types:**
1. Text  
2. Number  
3. Email  
4. Date  
5. Dropdown  
6. Checkbox  
7. Radio Button  
8. File Upload  
9. Rating  

### Form Field Configuration
Each field can have:
- Label, field key, placeholder, help text
- Required / Optional
- Display order
- Min/max length
- Min/max value
- Options for Dropdown, Radio, Checkbox

### Conditional Fields
Fields can be displayed conditionally based on another field's value.

**Supported operators:**
- EQUALS, NOT_EQUALS, CONTAINS  
- GREATER_THAN, LESS_THAN  
- GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL  

---

## 🛠️ Technology Stack
**Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic, Alembic, JWT, Passlib/bcrypt  
**Database:** MySQL 8.0  
**Tools:** Git, GitHub, VS Code, Postman, Swagger UI, MySQL Workbench  

---

## 📁 Project Structure
```
backend/
│
├── app/
│   ├── api/v1/router.py
│   ├── core/config.py, security.py
│   ├── db/base.py, base_class.py, session.py
│   ├── exceptions/base.py
│   ├── models/
│   ├── repositories/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   └── utils/
│
├── alembic/versions/
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── alembic.ini
├── requirements.txt
├── seed.py
└── main.py
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.12+
- MySQL 8.0+
- Git  
Optional: MySQL Workbench, Postman, VS Code

### Clone Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd backend
```

### Virtual Environment
Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
Linux/macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Database Setup
```sql
CREATE DATABASE dynamic_form_builder;
SHOW DATABASES;
```

### Environment Variables
Create `.env` file:
```
APP_NAME=Dynamic Form Builder
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/dynamic_form_builder
SECRET_KEY=change-this-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
```

### Database Migration
```bash
alembic upgrade head
```

### Seed Initial Data
```bash
python seed.py
```

### Upload Directory
```bash
mkdir uploads
```

---

## ▶️ Run Application
```bash
uvicorn main:app --reload
```
API available at:  
- Swagger UI → `http://127.0.0.1:8000/docs`  
- ReDoc → `http://127.0.0.1:8000/redoc`  

---

## 🔑 Authentication Flow
1. Register  
2. Login  
3. Receive JWT Access Token  
4. Send Token with Protected Requests  
5. Access Protected APIs  

---

## 🧩 Dynamic Form Flow
Admin → Create Form → Add Fields → Configure Properties → Conditional Logic → Publish → User Opens Form → Submit Response → Backend Validates → Store in DB  

---

## 🛡️ Security
- JWT authentication  
- Password hashing  
- Role-based authorization  
- Environment variables for secrets  
- Input & file validation  
- Database constraints  
- CORS configuration  

---

## 🧪 Testing
Recommended flow:
1. Register & Login  
2. Create Form & Fields  
3. Configure Options & Conditional Fields  
4. Activate Form  
5. Submit Response  
6. Verify Response  

---

## 🧹 Git Safety
Do not commit:
- `.env`
- `venv/`
- `uploads/`
- `__pycache__/`
- Cache folders (`.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`)

---

## 📄 License
This project is developed for application development and learning purposes.  
Add the appropriate license before distributing publicly.

---

## 👨‍💻 Development
- Python  
- FastAPI  
- SQLAlchemy  
- Pydantic  
- Alembic  
- MySQL  
- JWT  

The backend is designed around a **dynamic form architecture** so that new forms and fields can be created through the application without requiring backend code changes.
```

