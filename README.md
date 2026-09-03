# CloudShield

Demo de **monitoreo predictivo de infraestructura cloud** con alertas basadas en Machine Learning.
Dashboard web en tiempo real (telemetría simulada) con servicios, métricas CPU/MEM, alertas
predictivas ML, riesgo global y cobertura por región.

## Stack (objetivo del producto)

Go (agentes) · React (dashboard) · Prometheus (métricas) · Grafana (visualización) · Docker.

Este repo contiene el **frontend demo** (React + Next.js + Tailwind) autocontenido.

## Ejecución local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy en Coolify (app única, Dockerfile)

1. New Resource → App → build pack **Dockerfile**.
2. Repo público `https://github.com/cesargarrido/cloudshield`, rama `main`.
3. Base Directory vacío · Dockerfile `Dockerfile` · Port `3000`.
4. Dominio propuesto: `https://cloudshield.evoluciondigitalia.cl`.

## Estructura

```
app/           Rutas Next (layout, página)
components/    Dashboard (telemetría simulada, alertas ML)
Dockerfile     Contenedor único (Next standalone)
```
