---
id: 002
title: Tabla public.matches con kickoff en UTC
date: 2026-06-17
status: accepted
---

## Contexto

Las políticas RLS que bloquean pronósticos (ver ADR backend/001) necesitan comparar el momento actual (`now()`) con el horario de inicio de cada partido. Para que esta comparación sea correcta y unívoca en PostgreSQL, ambos valores deben estar en el mismo tipo con información de zona horaria.

Paralelamente, el frontend tiene un archivo de datos (`groupMatches.js`) con los horarios de los partidos expresados en hora de Lima (UTC-5) para display. Estos dos conjuntos de datos tienen propósitos distintos y no deben mezclarse.

## Decisión

Crear la tabla `public.matches` con la siguiente estructura mínima:

```sql
CREATE TABLE public.matches (
  id        INTEGER PRIMARY KEY,
  kickoff_at TIMESTAMPTZ NOT NULL
);
```

Los horarios se almacenan en UTC usando el tipo `TIMESTAMPTZ` (timestamp with time zone). Esta tabla es la **fuente autoritativa** para la lógica de bloqueo de pronósticos via RLS.

El archivo `groupMatches.js` del frontend sigue siendo la fuente de datos para la UI (nombres de equipos, grupos, horarios en Lima para display), pero no se usa para decisiones de seguridad.

## Alternativas consideradas

**Almacenar kickoff en hora de Lima como `TIMESTAMP` sin zona horaria**: se descartó porque `TIMESTAMP` sin zona horaria en PostgreSQL no permite comparaciones inequívocas con `now()` (que sí es timezone-aware). Introduciría bugs sutiles alrededor de cambios de horario y configuraciones de `TimeZone` del servidor.

**Usar el archivo `groupMatches.js` directamente desde el cliente para calcular si un partido bloqueó**: se descartó porque esa lógica viviría únicamente en el cliente y podría ser bypasseada. La fuente de verdad para bloqueos debe estar en el servidor.

**Almacenar kickoff en una columna separada por zona horaria (Lima + UTC)**: se descartó por redundancia; UTC es suficiente y es el estándar para almacenamiento de timestamps en sistemas distribuidos.

## Consecuencias

- Las políticas RLS usan `kickoff_at > now()` directamente, sin conversiones de zona horaria en la query.
- La tabla `public.matches` debe poblarse antes de que comience la quiniela y mantenerse actualizada si la FIFA modifica horarios oficiales.
- El id de cada partido en `public.matches` debe coincidir con el id usado en `predictions_group` y `predictions_ko` para que el JOIN de las políticas RLS funcione correctamente.
- Si el servidor de Supabase cambia su configuración de `TimeZone`, `TIMESTAMPTZ` lo maneja correctamente al convertir siempre a UTC internamente.
