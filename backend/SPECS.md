# SPEC: User Authentication

## Purpose

Sistema de autenticación JWT para usuarios de la app.

## Requirements

### Requirement: User Registration

El sistema DEBE permitir registrar nuevos usuarios con email y contraseña.

- GIVEN un usuario con email y password válidos
- WHEN POST /api/auth/register
- THEN devuelve token JWT y datos del usuario
- AND usuario queda autenticado automáticamente

- GIVEN un email que ya existe en el sistema
- WHEN POST /api/auth/register
- THEN devuelve error 400 "Email already registered"

- GIVEN password menor a 6 caracteres
- WHEN POST /api/auth/register
- THEN devuelve error 422 "Password too short"

### Requirement: User Login

El sistema DEBE permitir login con email y password.

- GIVEN credenciales válidas
- WHEN POST /api/auth/login
- THEN devuelve token JWT y datos del usuario

- GIVEN email incorrecto
- WHEN POST /api/auth/login
- THEN devuelve error 401 "Invalid credentials"

- GIVEN password incorrecto
- WHEN POST /api/auth/login
- THEN devuelve error 401 "Invalid credentials"

### Requirement: Protected Endpoints

El sistema DEBE rechazar requests sin token JWT válido.

- GIVEN request sin header Authorization
- WHEN GET /api/profiles
- THEN devuelve error 401 "Not authenticated"

- GIVEN token JWT inválido o expirado
- WHEN GET /api/profiles
- THEN devuelve error 401 "Invalid token"

---

# SPEC: Profiles CRUD

## Purpose

Gestión de perfiles de entrenamiento por usuario.

## Requirements

### Requirement: Create Profile

El sistema DEBE permitir crear un nuevo perfil.

- GIVEN usuario autenticado con nombre de perfil
- WHEN POST /api/profiles
- THEN devuelve el perfil creado con id

- GIVEN nombre de perfil vacío
- WHEN POST /api/profiles
- THEN devuelve error 422 "Profile name required"

### Requirement: List Profiles

El sistema DEBE listar todos los perfiles del usuario autenticado.

- GIVEN usuario autenticado
- WHEN GET /api/profiles
- THEN devuelve lista de perfiles del usuario

### Requirement: Get Profile

El sistema DEBE permitir ver un perfil específico del usuario.

- GIVEN usuario autenticado
- WHEN GET /api/profiles/{id}
- THEN devuelve los datos del perfil

- GIVEN perfil que no pertenece al usuario
- WHEN GET /api/profiles/{id}
- THEN devuelve error 404 "Profile not found"

### Requirement: Update Profile

El sistema DEBE permitir editar un perfil.

- GIVEN usuario autenticado
- WHEN PUT /api/profiles/{id}
- THEN devuelve el perfil actualizado

### Requirement: Delete Profile

El sistema DEBE permitir eliminar un perfil.

- GIVEN usuario autenticado
- WHEN DELETE /api/profiles/{id}
- THEN devuelve 204 y elimina el perfil
- AND todas las sesiones asociadas se eliminan en cascada

---

# SPEC: Training Days

## Purpose

Gestión de días de entrenamiento por perfil.

## Requirements

### Requirement: List Training Days

El sistema DEBE listar los días de un perfil.

- GIVEN perfil existente del usuario
- WHEN GET /api/profiles/{id}/days
- THEN devuelve lista de días del perfil

### Requirement: Create Training Day

El sistema DEBE permitir agregar un día a un perfil.

- GIVEN perfil existente con datos del día
- WHEN POST /api/profiles/{id}/days
- THEN devuelve el día creado

- GIVEN day_number ya existe en el perfil
- WHEN POST /api/profiles/{id}/days
- THEN devuelve error 422 "Day number already exists"

### Requirement: Update Training Day

El sistema DEBE permitir editar un día.

- GIVEN día existente del perfil
- WHEN PUT /api/profiles/{id}/days/{day_id}
- THEN devuelve el día actualizado

### Requirement: Delete Training Day

El sistema DEBE permitir eliminar un día.

- GIVEN día existente del perfil
- WHEN DELETE /api/profiles/{id}/days/{day_id}
- THEN devuelve 204 y elimina el día

---

# SPEC: Session Recording

## Purpose

Registro de sesiones de entrenamiento con resultados de ejercicios.

## Requirements

### Requirement: Create Session

El sistema DEBE permitir iniciar una nueva sesión.

- GIVEN perfil existente con day_id
- WHEN POST /api/sessions
- THEN devuelve la sesión creada con timestamp

### Requirement: Add Exercise Result

El sistema DEBE permitir agregar resultado de ejercicio.

- GIVEN sesión existente con datos del ejercicio
- WHEN PUT /api/sessions/{id}/exercises
- THEN devuelve el resultado guardado

- GIVEN ejercicio de series con reps y peso
- THEN guarda: reps, peso, feeling, duración

### Requirement: Complete Session

El sistema DEBE permitir completar una sesión.

- GIVEN sesión en progreso
- WHEN POST /api/sessions/{id}/complete
- THEN calcula duración total y marca como completada

### Requirement: Get Session History

El sistema DEBE permitir ver historial de sesiones.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/sessions
- THEN devuelve lista de sesiones con resultados

---

# SPEC: Body Weight Tracking

## Purpose

Seguimiento del peso corporal por perfil.

## Requirements

### Requirement: Record Weight

El sistema DEBE permitir registrar peso corporal.

- GIVEN perfil con peso y fecha
- WHEN POST /api/profiles/{id}/weight
- THEN devuelve el registro creado

### Requirement: Get Weight History

El sistema DEBE permitir ver historial de pesos.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/weight
- THEN devuelve lista de pesos ordenada por fecha

---

# SPEC: Recovery State

## Purpose

Recuperar estado de entrenamiento interrumpido.

## Requirements

### Requirement: Save Recovery State

El sistema DEBE permitir guardar el estado actual del entrenamiento.

- GIVEN perfil con estado (block, exercise, set, etc)
- WHEN POST /api/recovery/{profile_id}
- THEN guarda el estado

### Requirement: Get Recovery State

El sistema DEBE permitir recuperar el estado guardado.

- GIVEN perfil con estado guardado
- WHEN GET /api/recovery/{profile_id}
- THEN devuelve el estado recovery

- GIVEN perfil sin estado recovery
- WHEN GET /api/recovery/{profile_id}
- THEN devuelve null

### Requirement: Clear Recovery State

El sistema DEBE permitir borrar el estado recovery.

- GIVEN perfil con estado
- WHEN DELETE /api/recovery/{profile_id}
- THEN borra el estado y devuelve 204

---

# SPEC: Profile Analytics

## Purpose

Analytics SQL sobre datos del perfil.

## Requirements

### Requirement: Exercise Progress

El sistema DEBE mostrar progreso por ejercicio.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/analytics?type=exercises
- THEN devuelve lista de ejercicios con: mejor peso, reps promedio, última fecha

### Requirement: Session Summary

El sistema DEBE mostrar resumen de sesiones.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/analytics?type=sessions
- THEN devuelve: total sesiones, duración promedio, sesiones este mes

### Requirement: Weight Evolution

El sistema DEBE mostrar evolución del peso.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/analytics?type=weight
- THEN devuelve lista de pesos con fecha, tendencia (up/down)

### Requirement: Personal Records

El sistema DEBE mostrar records personales.

- GIVEN perfil existente
- WHEN GET /api/profiles/{id}/analytics?type=records
- THEN devuelve lista de ejercicios con su máximo peso registrado