---
id: 001
title: Generación de imágenes en el cliente con html-to-image
date: 2026-06-17
status: accepted
---

## Contexto

La app permite a los usuarios compartir su tarjeta de pronósticos y su posición en el ranking como imagen. Se necesita convertir un componente React (DOM) a un PNG descargable o compartible directamente desde el navegador.

## Decisión

Usar la librería `html-to-image` (función `toPng`) para capturar nodos del DOM y exportarlos como PNG en el cliente. No se involucra ningún servicio de backend para la generación de imágenes.

Dado que `html-to-image` renderiza el DOM tal como está, y Tailwind CSS genera clases que dependen de una hoja de estilos cargada en el documento principal, los componentes capturados fuera del flujo normal del DOM (nodos fuera de pantalla o montados temporalmente) requieren **estilos en línea** para garantizar que el resultado visual sea fiel.

## Alternativas consideradas

**Servicio de captura de pantalla en el servidor** (ej. Puppeteer, screenshot-api.com): se descartó porque añade latencia de red, requiere infraestructura adicional, y el volumen de capturas no justifica el costo operativo. La app es un SPA estático en GitHub Pages sin backend propio.

**Canvas API manual**: se descartó por la complejidad de reproducir fielmente el layout y los estilos de los componentes React.

## Consecuencias

- No se requiere backend ni función serverless para esta funcionalidad.
- Las tarjetas de compartir deben usar estilos en línea (o un subconjunto mínimo de Tailwind con purge desactivado para esos componentes) en lugar de clases de Tailwind puras, para asegurar que el PNG generado sea visualmente correcto.
- El procesamiento ocurre en el hilo principal del navegador; en dispositivos de baja gama puede haber un retardo perceptible al generar imágenes complejas.
- No existe dependencia de servicios externos de terceros para esta función.
