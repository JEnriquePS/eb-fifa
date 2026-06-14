# Flujo del Admin

## Flujo completo del administrador

```mermaid
flowchart TD
    A([El organizador\nse registra como jugador]) --> B[Ejecutar SQL en Supabase\npara asignar rol admin]
    B --> C["UPDATE profiles\nSET is_admin = true\nWHERE email = '...'"]
    C --> D[Vuelve a la app\nRecarga la página]

    D --> E[Ve la tab\nResultados desbloqueada]

    E --> F{¿Cómo quiere\ningresar resultados?}

    F -->|Manual| G[Tab: Resultados\nBusca el partido]
    G --> H[Ingresa marcador\ngoles local y visitante]
    H --> I[Guarda en\nresults_group]

    F -->|Sincronización| J[Clic en botón Sincronizar\nen tab Resultados]
    J --> K[App llama\nEdge Function sync-results]
    K --> L[Edge Function consulta\nfuente externa de resultados]
    L --> M[Upsert en\nresults_group / results_ko]

    I --> N[Real-time notifica\na todos los jugadores]
    M --> N

    N --> O[Tabla de posiciones\nse recalcula en vivo]
    O --> P([Todos los jugadores\nven el ranking actualizado])

    E --> Q[Tab: Resultados\nEliminatorias]
    Q --> R[Selecciona ganador\nde cada partido KO]
    R --> S[Guarda en\nresults_ko]
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
    participant Ext as Fuente externa\nde resultados
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

El puntaje se calcula en el frontend (`src/lib/scoring.js`) comparando el pronóstico del jugador contra el resultado oficial:

| Escenario | Puntos |
|-----------|--------|
| Marcador exacto en grupos | 3 |
| Resultado correcto (1X2) sin exacto | 1 |
| Ganador correcto en octavos | 2 |
| Ganador correcto en cuartos | 4 |
| Ganador correcto en semis | 6 |
| Ganador correcto en 3er puesto | 8 |
| Ganador correcto en final | 10 |
| Pronóstico incorrecto o en blanco | 0 |
