# Documentación — La Quiniela Mundialista 2026

Índice de toda la documentación del proyecto.

## Arquitectura

| Archivo | Contenido |
|---------|-----------|
| [architecture/overview.md](./architecture/overview.md) | Diagramas C4: contexto y contenedores del sistema |
| [architecture/sequences/user-flow.md](./architecture/sequences/user-flow.md) | Flujo completo del jugador (registro → pronósticos → ranking) |
| [architecture/sequences/admin-flow.md](./architecture/sequences/admin-flow.md) | Flujo del admin (ingreso de resultados y sincronización) |

## Decisiones de Arquitectura (ADRs)

| Archivo | Contenido |
|---------|-----------|
| [adr/README.md](./adr/README.md) | Índice de ADRs y plantilla |
| [adr/frontend/001-generacion-imagenes-cliente.md](./adr/frontend/001-generacion-imagenes-cliente.md) | Generación de imágenes en el cliente con html-to-image |
| [adr/frontend/002-timezone-display-only.md](./adr/frontend/002-timezone-display-only.md) | Selector de zona horaria solo afecta el display |
| [adr/frontend/003-kickoff-timer-hook.md](./adr/frontend/003-kickoff-timer-hook.md) | Hook useKickoffTimer para bloqueo automático de pronósticos |
| [adr/frontend/004-portal-modales.md](./adr/frontend/004-portal-modales.md) | Modales de compartir usando ReactDOM.createPortal |
| [adr/backend/001-rls-kickoff-predictions.md](./adr/backend/001-rls-kickoff-predictions.md) | RLS sobre predicciones con validación de kickoff_at |
| [adr/backend/002-matches-table-utc.md](./adr/backend/002-matches-table-utc.md) | Tabla public.matches con kickoff en UTC |
| [adr/backend/003-access-code-rpc.md](./adr/backend/003-access-code-rpc.md) | Validación de código de acceso via RPC en Supabase |

## Referencia

| Archivo | Contenido |
|---------|-----------|
| [reference/er-diagram.md](./reference/er-diagram.md) | Diagrama entidad-relación de la base de datos |
| [reference/requirements.md](./reference/requirements.md) | Requerimientos funcionales y no funcionales |
