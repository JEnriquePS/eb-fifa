# Arquitectura del Sistema

## C4 — Nivel 1: Contexto

Muestra quiénes interactúan con el sistema y qué sistemas externos involucra.

```mermaid
graph TB
    jugador(["👤 Jugador\nIngresa pronósticos\ny sigue el ranking"])
    admin(["👤 Admin / Organizador\nIngresa resultados\noficiales"])

    subgraph sistema["La Quiniela Mundialista 2026"]
        app["⚽ App Web\nSPA React"]
    end

    subgraph externos["Sistemas externos"]
        supabase["🗄️ Supabase\nAuth · PostgreSQL\nReal-time · Edge Functions"]
        github["🌐 GitHub Pages\nHosting estático"]
        email["📧 Email (Supabase)\nMagic links de acceso"]
    end

    jugador -->|"HTTPS — usa la app"| app
    admin -->|"HTTPS — usa la app"| app
    app -->|"HTTPS / WSS\nAuth, datos, real-time"| supabase
    supabase -->|"SMTP\nEnvía magic links"| email
    github -->|"Sirve bundle JS/CSS"| app
```

---

## C4 — Nivel 2: Contenedores

Detalla los componentes internos del sistema y cómo se comunican.

```mermaid
graph TB
    jugador(["👤 Jugador"])
    admin(["👤 Admin"])

    subgraph frontend["Frontend — GitHub Pages"]
        spa["SPA React / Vite\n\nFeatures:\n• Auth (magic link)\n• Grupos — pronósticos\n• La Llave — bracket\n• Resultados — admin\n• Tabla — ranking\n• Cómo Jugar — reglas"]
    end

    subgraph supabase["Supabase (Backend as a Service)"]
        auth["Auth Service\nMagic links · JWT\nSesiones persistentes"]
        db["PostgreSQL\n5 tablas:\nprofiles · predictions_group\npredictions_ko\nresults_group · results_ko"]
        realtime["Real-time\nWebSocket\nCambios en tiempo real"]
        edge["Edge Function\nsync-results\nSincroniza resultados\ndesde fuente externa"]
    end

    subgraph cicd["CI/CD"]
        actions["GitHub Actions\ndeploy.yml\nBuild + deploy a Pages"]
    end

    jugador -->|"HTTPS"| spa
    admin -->|"HTTPS"| spa
    spa -->|"REST API"| auth
    spa -->|"REST API\nupsert / delete"| db
    spa <-->|"WebSocket\nsuscripción a cambios"| realtime
    spa -->|"HTTP POST\ntrigger manual (admin)"| edge
    realtime -->|"Notifica cambios"| spa
    edge -->|"upsert resultados"| db
    actions -->|"push main → deploy"| frontend
```

---

## Decisiones de diseño relevantes

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Hosting | GitHub Pages | Gratis, integrado con el repo, sin servidor |
| Backend | Supabase | Auth + DB + real-time en un solo servicio |
| Auth | Magic links (email) | Sin contraseñas, fácil de usar para el equipo |
| Deploy | GitHub Actions | Automatizado al hacer push a `main` |
| Datos estáticos | Archivos JS en el repo | Los fixtures del torneo no cambian |
| Tiempo real | Supabase Realtime (WebSocket) | Ranking actualizado sin recargar |
