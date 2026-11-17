# Registro de cambios — AEROBOT V6

## Cambios solicitados

- [x] Conservar currículo de 40 misiones y 20 planetas de V5.
- [x] Desde el planeta 8, usar **límite de bloques** para obligar a repeticiones ×2 o ×3.
- [x] Verificar con un algoritmo de búsqueda que todos los planetas tengan soluciones válidas.
- [x] Agregar panel explicativo de ciclos y contadores de bloques/pasos.
- [x] Añadir laboratorio independiente de Python libre, sin calificación.
- [x] Permitir programas multilineales con `input()` y salida/error visibles.
- [x] Cargar automáticamente imports de paquetes compatibles de Pyodide.
- [x] Añadir botón para detener ejecuciones prolongadas en el laboratorio.
- [x] Conservar claves y avance de V5 en localStorage.

## Verificación ejecutada

- `npm run test:content`: **10/10 pruebas aprobadas**.
- Parser JSX de TypeScript: **0 errores sintácticos**.
- Ejecución local del script de captura de Python (CPython): `print()`, `input()`, `for` y errores: **correcta**.

## Pendiente por comprobar en el equipo de destino

- `npm install` y `npm run build`, debido a la indisponibilidad de dependencias npm en el entorno de revisión.
- Pruebas funcionales de Pyodide en navegadores reales y GitHub Pages, y pruebas responsive con tableta/laptop/celular.

Importante: Pyodide no puede ejecutar absolutamente todos los programas y bibliotecas de Python de escritorio. La compatibilidad depende del navegador y de la disponibilidad de paquetes compilados para WebAssembly.
