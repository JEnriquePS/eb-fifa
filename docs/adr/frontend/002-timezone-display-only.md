---
id: 002
title: Selector de zona horaria solo afecta el display
date: 2026-06-17
status: accepted
---

## Contexto

El Mundial 2026 tiene sede en Norteamérica, pero el público objetivo de la quiniela es latinoamericano. Los horarios de los partidos deben ser comprensibles para usuarios en distintos países de Sudamérica. Al mismo tiempo, la lógica de bloqueo de pronósticos depende de la hora de inicio de cada partido, y esa lógica debe ser inequívoca y no manipulable por el usuario.

## Decisión

Los horarios de inicio de los partidos se almacenan y razonan internamente en **hora de Lima (UTC-5)**, que es el horario de referencia del proyecto. El selector de zona horaria disponible en la interfaz **solo afecta el display**: transforma la hora de Lima a la zona horaria seleccionada usando `Intl.DateTimeFormat` únicamente para mostrarla en pantalla.

Toda la lógica de bloqueo (determinar si un partido ya comenzó y los pronósticos deben cerrarse) usa la hora de Lima directamente, independientemente de la zona horaria seleccionada por el usuario.

El selector incluye zonas horarias correspondientes a **12 países de Sudamérica**. La elección del usuario se persiste en `localStorage`.

## Alternativas consideradas

**Almacenar los horarios en la zona horaria del usuario**: se descartó porque la lógica de comparación para bloquear pronósticos se volvería compleja y propensa a errores (offsets variables por DST, comparaciones entre timestamps en distintas zonas, etc.). Lima (UTC-5) no observa horario de verano, lo que elimina esa fuente de ambigüedad.

**Mostrar siempre en UTC**: se descartó porque la experiencia de usuario sería peor para el público latinoamericano, que no razona en UTC.

## Consecuencias

- La lógica de bloqueo es simple y predecible: una sola zona horaria de referencia sin ajustes por DST.
- El cambio de zona horaria en la UI no tiene ningún efecto secundario en datos ni en reglas de negocio.
- Si el usuario cambia su zona horaria en el selector, los horarios se actualizan visualmente de forma inmediata.
- La preferencia de zona horaria sobrevive recargas de página gracias a `localStorage`, pero no se sincroniza entre dispositivos.
- El array `TIMEZONES` debe mantenerse actualizado si se amplía la cobertura geográfica de la quiniela.
