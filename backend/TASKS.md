# Tasks: Backend Migration - FastAPI + PostgreSQL

## Phase 1: Foundation

- [x] 1.1 Crear `backend/app/config.py` - Settings con pydantic
- [x] 1.2 Crear `backend/app/database.py` - SQLAlchemy engine + session
- [x] 1.3 Crear `backend/app/models/__init__.py` - Imports de todos los modelos
- [x] 1.4 Crear `backend/app/models/models.py` - User, Profile, TrainingDay, Session, etc
- [x] 1.5 Configurar Alembic (`alembic.ini` + `env.py`)
- [x] 1.6 Crear primera migración `alembic/versions/001_initial.py`
- [x] 1.7 Crear `backend/app/main.py` - FastAPI app básica

## Phase 2: Auth Core

- [x] 2.1 Crear `backend/app/schemas/user.py` - UserCreate, UserResponse, Token
- [x] 2.2 Crear `backend/app/services/auth_service.py` - JWT create, verify, password hash
- [x] 2.3 Crear `backend/app/api/auth.py` - POST /register, POST /login
- [x] 2.4 Crear `backend/app/dependencies.py` - get_current_user dependency

## Phase 3: Profiles CRUD

- [x] 3.1 Crear `backend/app/schemas/profile.py` - ProfileCreate, ProfileUpdate, ProfileResponse
- [x] 3.2 Crear `backend/app/api/profiles.py` - CRUD endpoints
- [x] 3.3 Probar registro + login + crear perfil

## Phase 4: Training Days

- [x] 4.1 Crear `backend/app/schemas/training_day.py` - DayCreate, DayUpdate, DayResponse
- [x] 4.2 Crear `backend/app/api/training_days.py` - CRUD days por profile
- [x] 4.3 Agregar seed data inicial (los 4 días del plan.json actual)

## Phase 5: Sessions & Results

- [x] 5.1 Crear `backend/app/schemas/session.py` - SessionCreate, ExerciseResultCreate
- [x] 5.2 Crear `backend/app/api/sessions.py` - POST session, PUT exercises, POST complete
- [x] 5.3 Probar crear sesión + agregar resultados de ejercicios

## Phase 6: Body Weight

- [x] 6.1 Crear `backend/app/schemas/weight.py` - WeightCreate, WeightResponse
- [x] 6.2 Crear `backend/app/api/weight.py` - POST / GET weight

## Phase 7: Recovery State

- [x] 7.1 Crear `backend/app/schemas/recovery.py` - RecoveryState
- [x] 7.2 Crear `backend/app/api/recovery.py` - GET / POST / PUT / DELETE recovery

## Phase 8: Analytics

- [x] 8.1 Crear `backend/app/services/analytics_service.py` - SQL queries
- [x] 8.2 Crear `backend/app/api/analytics.py` - GET analytics con query params
- [x] 8.3 Probar analytics con datos de prueba

## Phase 9: Deployment Prep

- [ ] 9.1 Crear `backend/.env.example` con DATABASE_URL
- [ ] 9.2 Verificar conexión a Oracle Cloud PostgreSQL
- [ ] 9.3 Run migrations en producción
- [ ] 9.4 Testear todos los endpoints con Postman/curl
- [ ] 9.5 Commit y push a GitHub

## Phase 10: Frontend Migration (Post-Backend)

- [x] 10.1 Crear `src/utils/api.js` - API client para backend FastAPI
- [x] 10.2 Crear `src/features/auth/LoginScreen.jsx` - Pantalla de login
- [x] 10.3 Crear `src/features/auth/RegisterScreen.jsx` - Pantalla de registro
- [x] 10.4 Crear `src/features/profile/ProfileSelector.jsx` - Selector de perfiles
- [x] 10.5 Modificar `src/App.jsx` - Agregar login/profile selection flow
- [x] 10.6 Aplicar Design System "The Kinetic Edge" de Stitch
- [ ] 10.7 Actualizar MainMenu, TrainingPreview, SessionController, Analytics al nuevo diseño
- [ ] 10.8 Probar login completo + workout flow
- [ ] 10.9 Deploy frontend a Vercel