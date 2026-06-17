# ADRs — La Quiniela Mundialista 2026

Registro de decisiones de arquitectura del proyecto. Cada ADR documenta **por qué** se tomó una decisión, no solo **qué** se decidió.

## Índice

### Frontend

| ID | Título | Estado |
|----|--------|--------|
| [001](./frontend/001-generacion-imagenes-cliente.md) | Generación de imágenes en el cliente con html-to-image | accepted |
| [002](./frontend/002-timezone-display-only.md) | Selector de zona horaria solo afecta el display | accepted |
| [003](./frontend/003-kickoff-timer-hook.md) | Hook useKickoffTimer para bloqueo automático de pronósticos | accepted |
| [004](./frontend/004-portal-modales.md) | Modales de compartir usando ReactDOM.createPortal | accepted |

### Backend (Supabase)

| ID | Título | Estado |
|----|--------|--------|
| [001](./backend/001-rls-kickoff-predictions.md) | RLS sobre predicciones con validación de kickoff_at | accepted |
| [002](./backend/002-matches-table-utc.md) | Tabla public.matches con kickoff en UTC | accepted |
| [003](./backend/003-access-code-rpc.md) | Validación de código de acceso via RPC en Supabase | accepted |

---

## Plantilla ADR

Copiar este bloque al crear un nuevo ADR:

```markdown
---
id: NNN
title: <título corto>
date: YYYY-MM-DD
status: accepted | proposed | deprecated | superseded
---

## Contexto
<por qué se tomó la decisión, qué problema resuelve>

## Decisión
<qué se decidió exactamente>

## Alternativas consideradas
<otras opciones evaluadas y por qué se descartaron>

## Consecuencias
<efectos positivos y negativos de la decisión>
```

### Convenciones de naming

- Archivos: `NNN-descripcion-corta.md` (ej. `001-rls-kickoff-predictions.md`)
- Numeración separada por subcarpeta: `frontend/` y `backend/` tienen su propia secuencia de 3 dígitos
- Idioma: español
