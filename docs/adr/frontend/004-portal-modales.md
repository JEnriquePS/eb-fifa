---
id: 004
title: Modales de compartir usando ReactDOM.createPortal
date: 2026-06-17
status: accepted
---

## Contexto

Las filas de partidos pasados (cuyo kickoff ya ocurrió) se renderizan con `opacity-50` para indicar visualmente que están bloqueados. Dentro de estas filas existe un botón para compartir el pronóstico, que abre un modal con la tarjeta de imagen. Sin el uso de portales, el modal hereda la opacidad de su ancestro y aparece semitransparente, arruinando la experiencia de compartir.

## Decisión

Los modales de tarjetas de compartir se renderizan usando `ReactDOM.createPortal` apuntando a `document.body`. Al salir del árbol DOM de la fila del partido, el modal escapa a cualquier transformación CSS (opacidad, transform, filter) aplicada a los ancestros, y se renderiza siempre con opacidad completa sobre el resto de la interfaz.

## Alternativas consideradas

**Reestructurar el árbol de componentes** para que el modal sea hermano de la fila (no hijo), evitando la herencia de opacidad: se descartó porque requería refactorizar la composición de componentes de forma significativa, moviendo el estado del modal y su trigger a un nivel superior, lo que aumentaría la complejidad del estado compartido.

**Eliminar `opacity-50` de las filas bloqueadas y usar otro mecanismo visual** (ej. overlay semitransparente como elemento separado): se descartó porque la opacidad en la fila es el indicador visual más claro y semánticamente correcto para "contenido bloqueado", y cambiarla por otro mecanismo solo para evitar el problema del modal sería una solución al revés.

**Usar `isolation: isolate` o `will-change`**: se descartó porque estas propiedades no evitan que `opacity` se propague a los hijos; solo afectan el contexto de apilamiento.

## Consecuencias

- Los modales se renderizan siempre con opacidad y estilos completos, independientemente del estado visual de la fila que los contiene.
- El portal vive en `document.body`, por lo que el z-index del modal debe gestionarse cuidadosamente para no interferir con otros elementos de la UI (navbar, toasts).
- El componente modal debe gestionar el foco (focus trap) y el cierre con `Escape` por sí mismo, ya que al estar fuera del árbol React del padre, no hereda manejadores de eventos de sus ancestros visuales.
- Es necesario pasar explícitamente los datos necesarios al modal como props, ya que no puede acceder al contexto de su ancestro en el árbol DOM (aunque sí al contexto de React si el portal se renderiza dentro del mismo árbol de React).
