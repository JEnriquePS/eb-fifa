# Diagrama Entidad-Relación

Base de datos en Supabase (PostgreSQL). Las 5 tablas del sistema más la tabla `auth.users` gestionada por Supabase.

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
        timestamptz created_at
    }

    PROFILES {
        uuid id PK, FK
        text name
        boolean is_admin
        timestamptz created_at
    }

    PREDICTIONS_GROUP {
        bigint id PK
        uuid user_id FK
        integer match_id
        integer home_score
        integer away_score
    }

    PREDICTIONS_KO {
        bigint id PK
        uuid user_id FK
        integer match_id
        text winner_code
    }

    RESULTS_GROUP {
        integer match_id PK
        integer home_score
        integer away_score
        timestamptz updated_at
    }

    RESULTS_KO {
        integer match_id PK
        text winner_code
        timestamptz updated_at
    }

    AUTH_USERS ||--|| PROFILES : "extiende"
    AUTH_USERS ||--o{ PREDICTIONS_GROUP : "hace"
    AUTH_USERS ||--o{ PREDICTIONS_KO : "hace"
```

---

## Notas

### Restricciones
- `predictions_group.match_id` — entre 1 y 72 (partidos de grupos)
- `predictions_ko.match_id` — entre 73 y 104 (partidos eliminatorios)
- `unique(user_id, match_id)` en ambas tablas de pronósticos — un pronóstico por partido por usuario
- `home_score` y `away_score` — mayor o igual a 0

### Datos estáticos (no en DB)
Los fixtures del torneo (equipos, fechas, horarios, estadios) son datos estáticos almacenados en el frontend:
- `src/core/data/teams.js` — 48 selecciones con nombre, bandera y grupo
- `src/core/data/groupMatches.js` — 72 partidos de fase de grupos
- `src/core/data/knockoutMatches.js` — 32 partidos eliminatorios

Los `match_id` en la DB referencian estos datos estáticos; no hay FK formal porque los fixtures no cambian.

### Row Level Security (RLS)
| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `profiles` | Todos | Solo el propio usuario |
| `predictions_group` | Todos (para el ranking) | Solo el propio usuario |
| `predictions_ko` | Todos | Solo el propio usuario |
| `results_group` | Todos | Solo admin (`is_admin = true`) |
| `results_ko` | Todos | Solo admin (`is_admin = true`) |
