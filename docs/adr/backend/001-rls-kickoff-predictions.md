---
id: 001
title: RLS sobre predicciones con validación de kickoff_at
date: 2026-06-17
status: accepted
---

## Contexto

Los usuarios no deben poder enviar ni modificar pronósticos después de que un partido haya comenzado. Esta restricción debe aplicarse en el servidor para ser efectiva: una validación solo en el cliente puede ser bypasseada con herramientas de desarrollo o llamadas directas a la API de Supabase.

## Decisión

Las políticas de Row Level Security (RLS) en las tablas `predictions_group` y `predictions_ko` incluyen una condición que verifica que `kickoff_at > now()` mediante un JOIN a la tabla `public.matches`. El usuario autenticado solo puede hacer INSERT o UPDATE en un pronóstico si el partido al que corresponde aún no ha comenzado según el reloj del servidor.

La tabla `public.matches` es la fuente autoritativa de los horarios de kickoff en UTC. Las políticas de RLS se aplican sobre el rol `authenticated`; el rol `service_role` (usado desde el SQL Editor como superadmin) bypasea RLS por diseño de Supabase.

## Alternativas consideradas

**Validación solo en el cliente (frontend)**: se descartó porque cualquier usuario con conocimientos básicos podría hacer peticiones directas a la API REST de Supabase con su JWT y registrar pronósticos fuera de plazo.

**Función serverless o Edge Function para validar antes de escribir**: se descartó porque RLS logra el mismo objetivo directamente en la capa de base de datos, sin latencia adicional ni infraestructura extra, y es la solución idiomática en Supabase.

**Trigger de base de datos que rechace escrituras tardías**: se descartó en favor de RLS porque las políticas RLS son más explícitas, auditables y gestionables desde el dashboard de Supabase.

## Consecuencias

- El bloqueo de pronósticos está garantizado en el servidor, sin depender del comportamiento del cliente.
- La tabla `public.matches` debe mantenerse sincronizada con los horarios reales de kickoff; un error en esta tabla podría bloquear pronósticos prematuramente o dejarlos abiertos demasiado tiempo.
- Los administradores que usen el SQL Editor de Supabase pueden insertar o modificar pronósticos de cualquier usuario en cualquier momento, lo cual es intencional para correcciones operativas.
- Si se agregan nuevas tablas de predicciones (ej. para fases eliminatorias adicionales), deben replicar el mismo patrón de política RLS con JOIN a `public.matches`.
