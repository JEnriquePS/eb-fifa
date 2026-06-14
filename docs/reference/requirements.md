# Requerimientos

## Requerimientos Funcionales

### RF-01 · Autenticación sin contraseña
El sistema debe permitir que los usuarios accedan mediante un **magic link** enviado a su correo electrónico. No se requieren contraseñas. La sesión debe persistir entre visitas.

### RF-02 · Registro de nombre
Al ingresar por primera vez, el usuario debe elegir un nombre de pantalla que aparecerá en el ranking.

### RF-03 · Pronósticos de fase de grupos
El usuario debe poder ingresar el marcador exacto (goles local y visitante) para cada uno de los **72 partidos** de la fase de grupos.

### RF-04 · Pronósticos de fase eliminatoria
El usuario debe poder seleccionar el ganador de cada uno de los **32 partidos eliminatorios** (desde octavos hasta la final), construyendo su bracket completo.

### RF-05 · Bloqueo de pronósticos al inicio del partido
Los pronósticos de un partido deben bloquearse automáticamente en cuanto comienza (según la hora oficial en Lima, UTC-5). El usuario no puede modificarlos después.

### RF-06 · Tabla de posiciones en tiempo real
El ranking de todos los jugadores debe calcularse y actualizarse en tiempo real cuando el admin ingresa resultados, sin necesidad de recargar la página.

### RF-07 · Ingreso de resultados oficiales (admin)
El usuario con rol admin debe poder ingresar el marcador de cada partido de grupos y el ganador de cada partido eliminatorio.

### RF-08 · Sincronización de resultados
El admin debe poder disparar una sincronización manual que obtiene los resultados oficiales desde una fuente externa y los guarda en la base de datos.

### RF-09 · Tabla de posiciones por grupo
La aplicación debe mostrar la tabla de posiciones de cada grupo calculada a partir de los pronósticos del usuario o, si existen, de los resultados oficiales.

### RF-10 · Confirmación visual de pronóstico guardado
Al ingresar un pronóstico completo, el sistema debe mostrar una confirmación visual al usuario de que su dato quedó registrado.

---

## Requerimientos No Funcionales

### RNF-01 · Disponibilidad y hosting
La aplicación debe estar disponible públicamente a través de **GitHub Pages** sin costos de infraestructura.

### RNF-02 · Capacidad de usuarios concurrentes
El sistema está diseñado para soportar hasta **~15 usuarios** conectados simultáneamente (uso interno de empresa).

### RNF-03 · Despliegue automatizado
Cualquier push a la rama `main` debe desencadenar automáticamente el build y despliegue a producción via **GitHub Actions**.

### RNF-04 · Zona horaria
Todos los horarios de partidos deben mostrarse y calcularse en hora de **Lima, Perú (UTC-5)**. El bloqueo de pronósticos usa este huso horario como referencia.

### RNF-05 · Compatibilidad móvil
La interfaz debe ser completamente funcional en dispositivos móviles (mínimo 375px de ancho). Los controles táctiles deben tener un tamaño mínimo de 44×44px.

### RNF-06 · Persistencia offline parcial
Los pronósticos se guardan primero en estado local y se sincronizan a la base de datos con un debounce de 900ms, de forma que cambios rápidos no generen requests excesivos.

### RNF-07 · Seguridad de datos
- Cada usuario solo puede leer y escribir sus propios pronósticos (Row Level Security en Supabase).
- Solo el usuario con `is_admin = true` puede modificar resultados oficiales.
- Las credenciales de Supabase se gestionan como secretos de GitHub Actions; nunca se incluyen en el repositorio.

### RNF-08 · Consistencia del ranking
El cálculo de puntos debe ser determinista: mismo resultado + mismo pronóstico = mismo puntaje, independientemente del momento o dispositivo.

### RNF-09 · Experiencia de usuario
- Los pronósticos bloqueados deben comunicarse visualmente (inputs desactivados + tooltip explicativo).
- Los partidos pasados deben mostrarse con opacidad reducida.
- El estado de guardado debe ser visible en todo momento.

### RNF-10 · Sin dependencias de servidor propio
El sistema no debe requerir un servidor backend propio. Todo el backend lo gestiona Supabase (BaaS).
