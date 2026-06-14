# ⚽ La Polla Mundialista 2026 — Multijugador

Polla futbolera de la Copa Mundial FIFA 2026 para **hasta ~10 personas** desde sus propios dispositivos, con tablero de posiciones en **tiempo real**.

Stack: React 18 · Vite · Tailwind CSS v4 · **Supabase** (auth + DB + real-time).

---

## Setup (una vez, lo hace el organizador)

### 1. Crear proyecto en Supabase

1. Entrar a [supabase.com](https://supabase.com) → **New project**
2. Elegir nombre, contraseña, región (ej. `us-east-1`)
3. Esperar que el proyecto inicie (~1 min)

### 2. Configurar la base de datos

En el dashboard de Supabase → **SQL Editor** → pegar y ejecutar el contenido de [`supabase/schema.sql`](./supabase/schema.sql).

Esto crea las 5 tablas, los permisos (RLS) y activa el tiempo real.

### 3. Obtener credenciales

Dashboard → **Project Settings** → **API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon / public key` → `VITE_SUPABASE_ANON_KEY`

### 4. Crear `.env.local`

```bash
cp .env.example .env.local
# Editar con tu URL y clave
```

### 5. Activar magic links (email)

Dashboard → **Authentication** → **Email** → verificar que "Enable Email provider" esté ON.

Para desarrollo local también habilitar: **Authentication** → **URL Configuration** → agregar `http://localhost:5173` a "Redirect URLs".

### 6. Correr la app

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción
```

---

## Flujo para los jugadores

1. El organizador comparte el link de la app (Vercel, Netlify, etc.)
2. Cada jugador entra con su correo → recibe un **link mágico** por email → clic → ingresa su nombre
3. Llenan sus pronósticos desde su propio dispositivo
4. La **Tabla** se actualiza en tiempo real para todos

---

## Hacer admin al organizador

Después de que el organizador se registre, ejecutar en Supabase SQL Editor:

```sql
UPDATE public.profiles SET is_admin = true WHERE name = 'TuNombre';
-- o por email:
UPDATE public.profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@correo.com');
```

Solo el admin puede ingresar los **Resultados oficiales** que alimentan el tablero de puntos.

---

## Pestañas

| Pestaña | Quién la usa | Qué hace |
|---------|-------------|----------|
| **Grupos** | Cada jugador | Pronostica los 72 partidos de grupos; tabla de posiciones en vivo |
| **La Llave** | Cada jugador | Arma su bracket eliminatorio hasta el campeón 🏆 |
| **Fixture** | Todos | Ve todos los partidos día a día con hora peruana; muestra resultado oficial (verde) o tu polla (dorado) |
| **Resultados** | Solo admin 🔑 | Ingresa los marcadores y ganadores reales del torneo |
| **Tabla** | Todos | Ranking en tiempo real 🟢 de quién va ganando |

---

## Sistema de puntaje

| Acierto | Puntos |
|---------|--------|
| Marcador exacto (grupos) | **3** |
| Resultado correcto 1X2 sin exacto | **1** |
| Ganador correcto — 16avos | **2** |
| Ganador correcto — 8vos | **4** |
| Ganador correcto — 4tos | **6** |
| Ganador correcto — Semis | **8** |
| Ganador correcto — 3er puesto | **8** |
| Ganador correcto — Final | **10** |
| **Máximo posible** | **338** |

---

## Desplegar en Vercel (gratis)

```bash
npm install -g vercel
vercel
# Agregar las variables de entorno en el dashboard de Vercel:
# VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

En Supabase → **Authentication** → **URL Configuration** → agregar la URL de Vercel a "Redirect URLs".
