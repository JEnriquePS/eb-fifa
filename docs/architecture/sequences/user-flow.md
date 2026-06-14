# Flujo del Jugador

## Flujo completo — desde la invitación hasta el ranking

```mermaid
flowchart TD
    A([Recibe invitación\npor WhatsApp]) --> B[Abre el link\nen el navegador]
    B --> C{¿Tiene sesión\nactiva?}

    C -->|Sí| H
    C -->|No| D[Pantalla de login\ningresa su correo]

    D --> E[Supabase envía\nmagic link al correo]
    E --> F[Abre el correo\ny hace clic en el link]
    F --> G{¿Primera vez?}

    G -->|Sí| H2[Ingresa su nombre\nde pantalla]
    G -->|No| H

    H2 --> H[Ve la app completa\nTab: Grupos]

    H --> I{¿El partido\nya inició?}

    I -->|No — partido pendiente| J[Ingresa pronóstico\ngoles local y visitante]
    J --> K[App guarda en local\ninstantáneamente]
    K --> L[Debounce 900ms\nsincroniza a Supabase]
    L --> M[Aparece ✓ guardado\nbajo los inputs]

    I -->|Sí — partido iniciado| N[Inputs bloqueados\ntooltip: pronóstico cerrado 🔒]

    M --> O{¿Quiere pronosticar\neliminatorias?}
    O -->|Sí| P[Tab: La Llave\nSelecciona ganadores\ndel bracket]
    P --> Q[Picks guardados\nen Supabase]

    O -->|No| R
    Q --> R[Tab: Tabla\nRanking en tiempo real]

    R --> S{¿Se ingresan\nnuevos resultados?}
    S -->|Sí — real-time| T[Tabla se actualiza\nautomáticamente\nsin recargar]
    T --> R
    S -->|No| U([Espera el\nsiguiente partido])
```

---

## Flujo de autenticación (detalle)

```mermaid
sequenceDiagram
    actor U as Jugador
    participant App as App React
    participant SB as Supabase Auth
    participant Email as Correo

    U->>App: Ingresa correo y envía
    App->>SB: signInWithOtp(email)
    SB->>Email: Envía magic link
    Email-->>U: Correo con botón "Entrar a la polla"

    U->>App: Clic en magic link
    App->>SB: Procesa token del link
    SB-->>App: Sesión JWT activa
    App->>SB: getProfile(userId)

    alt Primera vez
        SB-->>App: perfil: null
        App-->>U: Pantalla "¿Cómo vas a aparecer?"
        U->>App: Ingresa nombre
        App->>SB: upsertProfile(userId, nombre)
        SB-->>App: Perfil creado
    else Ya tiene perfil
        SB-->>App: perfil existente
    end

    App-->>U: Muestra la app completa
```

---

## Flujo de pronóstico (detalle)

```mermaid
sequenceDiagram
    actor U as Jugador
    participant App as App React
    participant Local as Estado Local
    participant SB as Supabase DB
    participant RT as Real-time

    U->>App: Ingresa goles (ej: 2 - 1)
    App->>Local: Actualiza localGroupScores[matchId]
    App-->>U: Input muestra valor inmediatamente

    Note over App: Debounce 900ms
    App->>SB: upsertGroupPred(userId, matchId, 2, 1)
    App-->>U: ✓ guardado (bajo los inputs)

    SB->>RT: Evento: predictions_group cambió
    RT->>App: reload() — recarga todos los datos
    App->>SB: fetchAll()
    SB-->>App: Datos actualizados
    Note over App: localGroupScores mantiene el valor\nhasta que DB confirma → sin parpadeo
```
