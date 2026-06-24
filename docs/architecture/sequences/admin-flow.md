# Flujo del Admin

## Flujo completo del administrador

```mermaid
flowchart TD
    A([El organizador\nse registra como jugador]) --> B[Ejecutar SQL en Supabase\npara asignar rol admin]
    B --> C["UPDATE profiles\nSET is_admin = true\nWHERE name = 'Nombre'"]
    C --> D[Vuelve a la app\nRecarga la página]

    D --> E[Ve la tab\nResultados desbloqueada]

    E --> F{¿Cómo quiere\ningresar resultados?}

    F -->|Manual| G[Tab: Resultados\nBusca el partido]
    G --> H[Ingresa marcador\nRT / ET / PEN según corresponda]
    H --> I[Guarda en\nresults_group o results_ko]

    F -->|Sincronización| J[Clic en botón Sincronizar\nen tab Resultados]
    J --> K[App llama\nEdge Function sync-results]
    K --> L[Edge Function consulta\nfootball-data.org]
    L --> M[Upsert en\nresults_group / results_ko]

    I --> N[Real-time notifica\na todos los jugadores]
    M --> N

    N --> O[Tabla de posiciones\nse recalcula en vivo]
    O --> P([Todos los jugadores\nven el ranking actualizado])

    E --> Q[Empate en tabla de grupos\nH2H no resuelve]
    Q --> R[Tab: Resultados\nDefine desempate manual]
    R --> S[Guarda en\ngroup_tiebreakers]
    S --> N
```

---

## Flujo de ingreso de resultados (detalle)

```mermaid
sequenceDiagram
    actor A as Admin
    participant App as App React
    participant SB as Supabase DB
    participant RT as Real-time
    participant J as Jugadores (todos)

    A->>App: Abre tab Resultados
    App->>SB: Verifica is_admin = true
    SB-->>App: Acceso confirmado

    A->>App: Ingresa marcador partido N (ej: 3 - 1)
    App->>SB: upsertResultGroup(matchId, 3, 1)
    SB-->>App: OK

    SB->>RT: Evento: results_group cambió
    RT->>App: reload() en cada cliente conectado
    App->>SB: fetchAll()
    SB-->>App: Datos con nuevo resultado

    App->>App: Recalcula puntajes\nupdatedContext = buildContext(results)
    App-->>J: Tabla actualizada en tiempo real
    App-->>A: Tabla de posiciones actualizada
```

---

## Flujo de sincronización automática

```mermaid
sequenceDiagram
    actor A as Admin
    participant App as App React
    participant EF as Edge Function\nsync-results
    participant Ext as football-data.org
    participant SB as Supabase DB
    participant RT as Real-time

    A->>App: Clic en "Sincronizar resultados"
    App->>EF: POST /functions/v1/sync-results
    Note over EF: Autenticado con service_role key

    EF->>Ext: Consulta resultados actualizados
    Ext-->>EF: Lista de partidos con marcadores

    loop Por cada resultado nuevo o actualizado
        EF->>SB: upsertResultGroup / upsertResultKo
    end

    SB->>RT: Eventos de cambio (bulk)
    RT->>App: reload() en cada cliente
    App-->>A: Resultados actualizados en pantalla
```

---

## Cálculo de puntaje (referencia)

El puntaje se calcula en el frontend (`src/lib/scoring.js`) comparando el pronóstico del jugador contra el resultado oficial.

### Grupos y Eliminatorias — misma regla por fase

| Escenario | Puntos |
|-----------|:------:|
| Marcador exacto (ej. 2-1 vs 2-1) | **3** |
| Resultado correcto, marcador distinto | **1** |
| Resultado incorrecto o sin pronóstico | **0** |

En eliminatorias el jugador pronostica el marcador de **tiempo reglamentario (RT)**. Si el partido va a **prórroga (ET)** también pronostica ese marcador, y si va a **penales (PEN)** también. Cada fase puntúa de forma independiente con la misma regla 3/1.

Cada fase del torneo tiene su **propia tabla de clasificación** — grupos, dieciseisavos, octavos, cuartos, semis y final se computan por separado.
