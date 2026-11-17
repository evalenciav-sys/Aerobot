# AEROBOT V9 — 40 misiones guiadas, Python libre y 20 planetas

Versión V9, evolución de AEROBOT V5, con cambios acumulados. **Mantiene** las 40 misiones en tres etapas (10 básicas, 10 intermedias y 20 avanzadas), los 20 planetas y el diseño general. Se conservan las claves de progreso de V5 en el mismo navegador.

## Mejoras de esta versión

1. **AstroRover: ciclos obligatorios desde el planeta 8.** El juego limita el **número de bloques**, además de los pasos. Una flecha ocupa un bloque; repetirla ×2 o ×3 permite recorrer varias casillas con una sola orden. Sin ciclos, las rutas de los planetas 8–20 no caben en el presupuesto. Un solucionador de rutas calcula los límites para garantizar que todos los mapas siguen teniendo solución.
2. **Laboratorio de Python libre.** Es un módulo independiente de la calificación de misiones. Permite escribir programas Python de varias líneas: variables, condiciones, `for`, `while`, funciones, listas, diccionarios, clases, etc. Los datos para `input()` se escriben en un campo, **uno por línea**. Incluye ejemplos de código y consola con salidas y mensajes de error.
3. **Motor de Python reforzado.** Continúa usando Pyodide en un Web Worker, con carga automática de paquetes de su distribución cuando se detectan imports compatibles, salida/error controlados, tiempo máximo y botón para detener la ejecución del laboratorio. La carga inicial requiere conexión a internet.
4. **Pruebas ampliadas.** Comprueban contenido, casos, solvencia de los 20 planetas y que 13 planetas requieren repeticiones. En la revisión local, `npm run test:content` aprobó 10/10 pruebas.

## Instalación en Windows (Visual Studio Code)

Descomprime el ZIP y abre en VS Code la carpeta que contiene `package.json`. Necesitas Node.js con npm.

```powershell
npm install
npm run dev
```

Abre la dirección que muestre Vite (normalmente `http://localhost:5173`).

Para las pruebas y la versión de producción:

```powershell
npm run test:content
npm run build
npm run preview
```

## Publicación en GitHub Pages

El archivo `vite.config.js` define rutas relativas. El proyecto incluye el flujo `.github/workflows/deploy.yml` para compilar y publicar con GitHub Actions. Verifica la ruta del Web Worker y la descarga de Pyodide después de publicar.

## Limitaciones importantes

- **Python compatible con navegador, no cualquier programa de escritorio.** Pyodide soporta gran parte del lenguaje Python y numerosos paquetes, pero no todos los módulos nativos, entornos gráficos de escritorio, procesos del sistema, recursos ilimitados ni acceso irrestricto a los archivos del equipo. La carga automática de imports cubre paquetes de la distribución Pyodide, **no todos los paquetes de PyPI**.
- La ejecución dentro del Worker **no es un sandbox de seguridad fuerte** ante código malicioso. No debe presentarse como un servicio público de ejecución segura de código no confiable sin auditoría adicional.
- El código libre se ejecuta sin nota y sin comparar salidas esperadas. Las misiones guiadas sí aplican sus propias reglas.
- El progreso se guarda en `localStorage`, por navegador y origen. Sin cuenta ni base de datos remota. Conserva las claves `aerobot-progress-v5` y `aerobot-rover-v5` para mantener el avance de la versión anterior.
- Se ejecutó la **suite de pruebas de Node.js** en el entorno de revisión. No se logró instalar las dependencias de npm aquí, por lo que **no pudo validarse `npm run build` ni una prueba interactiva real con Pyodide en navegador**. Ejecuta ambos pasos antes de entregar o publicar.

## Archivos principales

- `src/data.js` — currículo de 40 misiones.
- `src/missionValidation.js` — verificación de soluciones.
- `src/roverLevels.js` — mapas de 20 planetas.
- `src/roverEngine.js` — reglas de presupuesto y solvencia con ciclos.
- `src/main.jsx` — interfaz React (misiones, laboratorio, juego y logros).
- `src/style.css` — diseño responsive y estilos V6.
- `public/python-worker.js` — ejecución de Python en Pyodide.
- `tests/` — pruebas automatizadas.

Se incluye por separado la tesis en Word y PDF, con el mismo alcance técnico y resultados disponibles.

## Cambios concretos V9

- Los 40 retos aceptan resultados equivalentes sin exigir copiar las frases ni los nombres de variables de los ejemplos (excepto los casos cuyo objetivo es crear una variable concreta). Se conservan verificaciones por múltiples entradas, cálculos y estructuras cuando son el objetivo de la misión.
- Ahora se aceptan secuencias de números escritas como lista/tupla o por líneas, si coinciden el orden y los valores; también salidas con unidades legibles sin cambiar el valor.
- El segundo compilador incorpora ejemplos adicionales de `while`, cadenas, `statistics` y manejo de excepciones, además de operaciones, calculadora, funciones, diccionarios y listas.
- AstroRover mantiene los límites de bloques para exigir ciclos desde el planeta 8; los 20 planetas conservan rutas solucionables.
- El intérprete es Pyodide en el navegador, con conexión requerida al inicio. No permite ejecutar literalmente cualquier biblioteca nativa o aplicación de escritorio.

Pruebas: `npm run test:content`. Compilación para publicar: `npm install && npm run build`.
