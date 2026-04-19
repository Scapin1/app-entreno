# Deploy gratis (sin tarjeta): Cloudflare Pages + Hugging Face Spaces + Supabase

Este proyecto se prepara para este stack:

- Frontend React/Vite: **Cloudflare Pages**
- Backend FastAPI: **Hugging Face Spaces (Docker)**
- Base de datos Postgres: **Supabase Free**

---

## 1) Variables de entorno

### Frontend (root `.env` para local)

Copiá:

```bash
cp .env.example .env
```

Setear:

```env
VITE_API_URL=http://localhost:8000/api
```

En producción (Cloudflare Pages):

```env
VITE_API_URL=https://TU_BACKEND.hf.space/api
```

### Backend (`backend/.env`)

Copiá:

```bash
cp backend/.env.example backend/.env
```

Setear:

```env
APP_NAME=GymTracker API
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://TU_FRONTEND.pages.dev
DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres
SECRET_KEY=STRING_LARGA_ALEATORIA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
AUTO_INIT_DB=false
```

---

## 2) Deploy backend en Hugging Face Spaces (Docker)

1. Crear Space nuevo en HF:
   - SDK: **Docker**
   - Visibility: según quieras

2. Subir carpeta `backend/` (con `Dockerfile`).

3. En Space Settings → Variables, configurar:
   - `APP_NAME`
   - `ENVIRONMENT`
   - `DEBUG`
   - `CORS_ORIGINS`
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ALGORITHM`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`
   - `AUTO_INIT_DB`

4. Deploy y validar:
   - `https://TU_BACKEND.hf.space/health`

---

## 3) Base de datos en Supabase Free

1. Crear proyecto en Supabase.
2. Copiar `Connection string` Postgres.
3. Configurar esa URL como `DATABASE_URL` en HF Space.
4. Ejecutar migraciones (recomendado Alembic) antes de abrir tráfico.

> Nota: en este repo hoy hay init opcional por startup (`AUTO_INIT_DB`). Para prod robusta, usar Alembic.

---

## 4) Deploy frontend en Cloudflare Pages

1. Crear proyecto Pages conectado al repo.
2. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
3. Variables de entorno (Preview + Production):
   - `VITE_API_URL=https://TU_BACKEND.hf.space/api`
4. Deploy.

---

## 5) Checklist final producción

- [ ] `SECRET_KEY` fuerte (no default)
- [ ] `DEBUG=false`
- [ ] `CORS_ORIGINS` restringido al dominio frontend
- [ ] `VITE_API_URL` configurado en Pages
- [ ] `/health` responde 200
- [ ] login/register OK
- [ ] create/update profile OK
- [ ] analytics carga datos

---

## 6) Troubleshooting rápido

- Pantalla negra frontend:
  - revisar `VITE_API_URL`
  - re-deploy en Pages

- CORS bloqueado:
  - backend `CORS_ORIGINS` debe incluir exacto `https://xxx.pages.dev`

- Backend no conecta DB:
  - validar `DATABASE_URL`
  - validar whitelist/red en proveedor DB

---

## 7) Deploy automático (GitHub Actions)

Este repo incluye workflows para automatizar deploy/checks:

- `.github/workflows/deploy-hf-backend.yml`
  - Cuando hay cambios en `backend/**` en `main`, sincroniza automáticamente la carpeta `backend/` al repo del Space en Hugging Face.
- `.github/workflows/ci-frontend.yml`
  - Verifica que el frontend compile en cada push/PR relevante.

### Secrets requeridos (GitHub repo → Settings → Secrets and variables → Actions)

- `HF_USERNAME` → tu usuario de Hugging Face (ej. `Scapini`)
- `HF_SPACE_REPO` → `<owner>/<space>` (ej. `Scapini/GymTracker`)
- `HF_TOKEN` → token HF con permisos write sobre el Space

Con eso, el backend queda auto-deploy con cada push a `main` que toque `backend/**`.
