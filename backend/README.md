# App Entreno - Backend

## Stack
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Auth**: JWT (python-jose)
- **Validation**: Pydantic v2

## Estructura

```
backend/
├── app/
│   ├── api/           # Endpoints (routes)
│   │   ├── auth.py
│   │   ├── profiles.py
│   │   ├── training_days.py
│   │   ├── sessions.py
│   │   ├── exercises.py
│   │   ├── weight.py
│   │   └── analytics.py
│   ├── models/       # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── training_day.py
│   │   ├── session.py
│   │   ├── exercise_result.py
│   │   └── body_weight.py
│   ├── schemas/       # Pydantic schemas (request/response)
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── training_day.py
│   │   ├── session.py
│   │   └── exercise.py
│   ├── services/      # Lógica de negocio
│   │   ├── auth_service.py
│   │   └── analytics_service.py
│   ├── database.py   # Configuración DB
│   ├── main.py        # FastAPI app
│   └── config.py      # Settings
├── alembic/           # Migraciones
│   └── versions/
├── requirements.txt  # Dependencias
├── .env.example       # Variables de entorno ejemplo
└── tests/            # Tests (futuro)
```

## Primeros Pasos

### 1. Crear entorno virtual
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus datos
```

### 4. Ejecutar la app
```bash
uvicorn app.main:app --reload
```

## Endpoints

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Login, devuelve JWT |
| GET | /api/profiles | Listar perfiles del usuario |
| POST | /api/profiles | Crear nuevo perfil |
| GET | /api/profiles/{id} | Ver perfil |
| PUT | /api/profiles/{id} | Editar perfil |
| DELETE | /api/profiles/{id} | Eliminar perfil |
| GET | /api/profiles/{id}/days | Días del perfil |
| POST | /api/profiles/{id}/days | Agregar día |
| PUT | /api/profiles/{id}/days/{day_id} | Editar día |
| DELETE | /api/profiles/{id}/days/{day_id} | Eliminar día |
| GET | /api/profiles/{id}/sessions | Historial de sesiones |
| POST | /api/sessions | Nueva sesión |
| PUT | /api/sessions/{id}/exercises | Agregar resultado |
| GET | /api/profiles/{id}/analytics | Analytics |
| GET | /api/profiles/{id}/weight | Historial peso |
| POST | /api/profiles/{id}/weight | Registrar peso |
| GET | /api/recovery/{profile_id} | Estado recovery |
| POST | /api/recovery/{profile_id} | Guardar estado |

## Base de Datos

### Oracle Cloud Setup
1. Crear cuenta en Oracle Cloud
2. Crear Autonomous Database (siempre free)
3. Obtener connection string
4. Poner en .env: `DATABASE_URL=oracle+oracledb://admin:password@hostname/freepdb1`

## Desarrollo

- **Puerto**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Reload**: enabled con --reload

## Notas

- Por ahora sin tests
- Solo JWT simple (sin OAuth)
- Perfiles privados por usuario