---
id: 003
title: Hook useKickoffTimer para bloqueo automático de pronósticos
date: 2026-06-17
status: accepted
---

## Contexto

Los inputs de pronóstico deben bloquearse automáticamente en el momento exacto en que comienza un partido, sin que el usuario tenga que recargar la página. El bloqueo depende de la hora de kickoff de cada partido, y hay múltiples partidos con distintos horarios de inicio.

## Decisión

Implementar el hook `useKickoffTimer()` que programa un `setTimeout` para forzar un re-render del componente exactamente cuando ocurre el próximo kickoff no procesado. Al dispararse el timeout, el hook calcula el siguiente kickoff pendiente y vuelve a programar el timer, encadenando los bloqueos de manera precisa y sin intervención del usuario.

## Alternativas consideradas

**Polling periódico (ej. `setInterval` cada minuto)**: se descartó porque genera re-renders innecesarios cada minuto durante toda la sesión, independientemente de si hay un kickoff próximo o no. El hook basado en `setTimeout` solo actúa cuando es necesario, reduciendo el trabajo del navegador.

**Recargar la página al detectar inactividad o al volver al foco**: se descartó porque no garantiza el bloqueo en el momento exacto y depende del comportamiento del usuario.

**Depender de Supabase Realtime para notificar bloqueos**: se descartó porque el bloqueo es determinista (basado en el tiempo de kickoff ya conocido en el cliente), por lo que no requiere una señal del servidor.

## Consecuencias

- Los inputs se bloquean en el momento exacto del kickoff sin recargar la página.
- Si hay `N` partidos pendientes, el hook programa exactamente `N` timeouts a lo largo de la sesión, uno por vez.
- El hook debe limpiar el timeout activo en su función de cleanup (`useEffect` return) para evitar memory leaks si el componente se desmonta.
- Si el usuario deja el tab en segundo plano, los navegadores pueden throttlear los timers; el bloqueo podría aplicarse con un pequeño retraso al volver al tab. Esta inexactitud es aceptable dado que RLS en Supabase garantiza el bloqueo real en el servidor.
