# Admin Lechería — contexto del proyecto

> Este archivo se carga automáticamente en cada conversación. Mantenerlo actualizado cuando se agreguen entidades, endpoints, páginas o reglas de negocio. No hace falta releer todo el código: empezar por aquí y abrir solo los archivos relevantes a la tarea.

## Qué es

Sistema para administrar una ruta lechera en Colombia (~36 proveedores/finqueros). Registra la leche recogida cada día, las entregas a empresas compradoras (recibos), descuentos a proveedores y liquida cada **quincena** (1–15 y 16–fin de mes). También calcula transporte, rinde (sobrante de leche) y cuentas del operador.

El usuario habla español; responder en español. Moneda: pesos colombianos (`toLocaleString('es-CO')`, sin decimales). Zona horaria: America/Bogota (UTC-5).

## Stack y despliegue

| Parte | Tecnología |
|---|---|
| Backend `admin-lecheria/` | Spring Boot 4.0.6, Java 17, Maven (`./mvnw`), JPA/Hibernate, Lombok (`@RequiredArgsConstructor`; las entidades tienen getters/setters manuales) |
| Frontend `admin-lecheria-frontend/` | React 19 + Vite 8, Axios, React Router 7, jsPDF + autotable, PWA (vite-plugin-pwa). TanStack Query está instalado pero **no se usa** |
| BD local | MySQL `localhost:3306/admin_lecheria`, root/123456 (`createDatabaseIfNotExist`) |
| BD prod | PostgreSQL en Neon (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`) |
| Deploy | **Push a `main` en GitHub → Render (backend, Dockerfile) y Vercel (frontend) despliegan solos.** Si un cambio toca backend y frontend, ambos se van con el mismo push |
| Esquema | `ddl-auto=update`: columnas/tablas nuevas se crean solas; no hay migraciones |

Comandos:
```bash
cd admin-lecheria && ./mvnw spring-boot:run        # http://localhost:8092
cd admin-lecheria && ./mvnw -q compile             # verificar que compila
cd admin-lecheria-frontend && npm run dev          # http://localhost:5173
cd admin-lecheria-frontend && npx vite build       # verificar build
```
`VITE_API_URL`: `.env.development` → localhost:8092/api, `.env.production` → `https://admin-lecheria-backend.onrender.com/api`.

## Convenciones de código

- **Backend:** paquete `com.smartlech.adminlecheria` → `entity/`, `repository/`, `service/`, `controller/`, `dto/`, `config/`. Controladores con `@RestController @RequestMapping("/api/...") @CrossOrigin(origins="*")`. Errores con `throw new RuntimeException("mensaje")` (no hay `@ControllerAdvice`; salen como 500). Para PUT parciales se usa `@RequestBody Map<String,Object>` y `((Number) body.get("valor")).doubleValue()`.
- **"Heredar de quincena anterior"**: patrón repetido en varios servicios — busca la quincena con mayor `fechaFin` anterior a `fechaInicio` de la actual y copia registros que aún no existan.
- **Frontend:** una carpeta por página en `src/pages/`, componentes con `useState`/`useEffect` y llamadas directas `api.get/post/put/delete` (`src/api/axios.js`). **Todos los estilos son inline** (`style={{...}}`), sin CSS modules ni librería UI. Colores: primario `#6c63ff`, oscuro `#1a1a2e`, rojo descuentos `#c62828`. Confirmaciones con `confirm()`, errores con `alert()`.
- Edición en línea (fila que se vuelve inputs, Enter guarda / Escape cancela) es el patrón usado en Descuentos, Cuentas Generales e ingresos manuales.
- Comentarios y nombres en español.

## Entidades (tabla)

- **Ruta** (`rutas`): nombre, descripcion.
- **Proveedor** (`proveedores`): nombre, zona, precioLitro, cuotaLitros, tipoLeche (`'vaca'` | `'bufala'` sin tilde), activo, aplica4x1000 (default true), → Ruta.
- **Conductor** (`conductores`): nombre, telefono, activo, rutaIds (Set<Long>, `conductor_rutas`; vacío = todas las rutas).
- **Quincena** (`quincenas`): fechaInicio, fechaFin, textoQuincena, cerrada. Solo debe haber una abierta (`findByCerradaFalse()`).
- **Recoleccion** (`recolecciones`): fecha, litrosRecolectados, vale, fechaRegistro, sincronizado, → Quincena, Proveedor, Conductor, Ruta.
- **ReciboEmpresa** (`recibos_empresa`): nombreRecibo (nombre de la empresa), litrosRecibidos, precioLitro, precioTransporte, soloTransporte, fecha, → Quincena, Ruta (nullable). Un registro por empresa por día. `ReciboDetalle` existe pero casi no se usa.
- **Descuento** (`descuentos`): concepto, valor, fecha, → Quincena, Proveedor. Descuentos a proveedores.
- **ExcedenteProveedor** (`excedentes_proveedor`): valorPorLitro, → Proveedor, Quincena. Pago extra por litro; se resta en el rinde de Cuentas Generales.
- **GrupoRinde** (`grupos_rinde`): nombre, tipoLeche (null = todos), precioRinde, rutaIds (List), empresas (List<String> de nombres de recibo).
- **DescuentoCuenta** (`descuentos_cuenta`): tipo (`TRANSPORTE` | `RINDE`), nombre, valor, rutaContexto, → Quincena. Descuentos de Cuentas Generales.
- **Combustible** (`combustibles`): descripcion, valor, fecha, rutaContexto, → Quincena. Se resta del transporte.
- **CuentaPersonalizada** (`cuentas_personalizadas`): nombre. Sus hijos por quincena: **IngresoCuenta** (nombreRecibo vinculado), **IngresoManualCuenta** (descripcion, valor), **DescuentoCuentaPersonal** (descripcion, valor). `MovimientoCuenta` parece sin uso.

`rutaContexto` = IDs de ruta ordenados y separados por coma (`"1,2"`), identifica para qué combinación de rutas se registró algo en Cuentas Generales.

## API (`/api`)

- `proveedores`: GET `/` (activos), `/todos`, `/{id}`; POST; PUT `/{id}`; PATCH `/{id}/toggle-activo`
- `conductores`: GET `/`, `/todos`, `/{id}`; POST; PUT `/{id}`; DELETE `/{id}` (desactiva)
- `rutas`: GET, GET `/{id}`, POST, DELETE `/{id}`
- `quincenas`: GET, GET `/abierta`, GET `/{id}`, POST (400 si las fechas se cruzan con otra quincena), PUT `/{id}/cerrar`, PUT `/{id}/reabrir`, DELETE `/{id}` (400 con el conteo si tiene datos del usuario; excedentes e ingresos vinculados de cuentas personalizadas, que se heredan solos, se borran con ella)
- `recolecciones`: GET `/quincena/{qId}`, POST, PUT `/{id}` (litros, vale, conductor), DELETE `/{id}`, GET `/resumen/{qId}` (liquidación → `ResumenQuincenaDTO`), POST `/sincronizar`, GET `/pendientes`
- `recibos`: GET `/quincena/{qId}`, GET `/{id:[0-9]+}`, GET `/empresas` (nombres distintos), GET `/transporte/{qId}` (`TransporteResumenDTO`), POST, PUT `/{id}` (propaga precios y ruta a todos los días de esa empresa en la quincena), POST `/quincena/{qId}/heredar`, DELETE `/{id}`
- `descuentos`: GET `/quincena/{qId}`, POST, PUT `/{id}` (concepto, valor, fecha), DELETE `/{id}`
- `excedentes`: GET `/quincena/{qId}`, POST `/quincena/{qId}/heredar`, POST|DELETE `/quincena/{qId}/proveedor/{pId}` (body `{valorPorLitro}`)
- `grupos-rinde`: GET, POST, PUT `/{id}`, DELETE `/{id}`, GET `/transporte/{qId}`, GET `/vista-completa/{qId}?rutaIds=1,2` (`TransporteCompletoDTO`, lo usan Transporte y Cuentas Generales)
- `descuentos-cuenta`: GET `/quincena/{qId}?rutaContexto=`, POST `/quincena/{qId}/heredar?rutaContexto=`, POST, PUT `/{id}` (nombre, valor), DELETE `/{id}`
- `combustibles`: GET `/quincena/{qId}?rutaContexto=`, POST, DELETE `/{id}`
- `cuentas-personalizadas`: GET, POST, DELETE `/{id}`; `/{id}/ingresos?quincenaId=` GET/POST(body `{nombreRecibo}`)/DELETE(`&nombreRecibo=`); POST `/{id}/ingresos/heredar`; `/{id}/ingresos-manual?quincenaId=` GET/POST, PUT|DELETE `/ingresos-manual/{id}`; `/{id}/descuentos?quincenaId=` GET/POST, DELETE `/descuentos/{id}`

## Frontend

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `pages/inicio/Inicio.jsx` | Dashboard: progreso de quincena, KPIs, gráfica de litros por día |
| `/proveedores` | `pages/proveedores/Proveedores.jsx` | CRUD, activar/inactivar |
| `/rutas` | `pages/rutas/Rutas.jsx` | CRUD |
| `/conductores` | `pages/conductores/Conductores.jsx` | CRUD + rutas del conductor |
| `/quincenas` | `pages/quincenas/Quincenas.jsx` | Crear, cerrar, reabrir, eliminar (solo vacías) |
| `/recolecciones` | `pages/recolecciones/Recolecciones.jsx` | Registro diario por tarjeta de proveedor; modo offline |
| `/recibos` | `pages/recibos/Recibos.jsx` | Litros entregados por empresa y día; heredar empresas |
| `/descuentos` | `pages/descuentos/Descuentos.jsx` | Descuentos a proveedores agrupados por proveedor; editar/eliminar |
| `/transporte` | `pages/transporte/Transporte.jsx` | Tabla tipo Excel de entregas por empresa, rinde por grupo, CRUD de grupos de rinde, PDF |
| `/cuentas-generales` | `pages/cuentas/CuentasGenerales.jsx` | Neto transporte (− combustible − descuentos) + neto rinde (− excedentes − descuentos), selector de rutas propio, PDF |
| `/cuentas-personalizadas` | `pages/cuentas/CuentasPersonalizadas.jsx` | Cuentas con ingresos (recibos vinculados + manuales) y descuentos, PDF |
| `/resumen` | `pages/resumen/ResumenQuincena.jsx` | Liquidación por proveedor, excedentes, impresión de lista y recibos |

Compartido: `components/Layout.jsx` (sidebar con selector global de rutas), `context/RutaVistaContext.jsx` (rutas seleccionadas, guardadas en localStorage `ruta_vista_ids`), `components/OfflineBanner.jsx` + `lib/offlineStore.js` (cola offline de recolecciones), `utils/pdf.js` (PDFs de cuentas y transporte), `pages/resumen/ReciboProveedorModal.jsx`. La impresión de recibos/listas usa `window.open` + `document.write`.

## Reglas de negocio

1. Una sola quincena abierta a la vez.
2. Recolecciones: no duplicar proveedor + fecha en la quincena.
3. Recibos: no duplicar empresa + fecha (nombre comparado con trim + minúsculas).
4. Valor bruto proveedor = litros × precioLitro. 4x1000 = bruto × 4/1000 (solo si `aplica4x1000`). Neto = bruto − 4x1000 − descuentos.
5. `soloTransporte = true`: la empresa solo paga flete; esos litros **no** cuentan como entregados para el rinde. Valor de proveedor del recibo = litros × (precioLitro − precioTransporte).
6. Rinde (litros) = entregado (recibos de las empresas del grupo, sin soloTransporte) − recogido (recolecciones de las rutas/tipo de leche del grupo). Rinde ($) = rinde litros × precioRinde del grupo.
7. Cuentas Generales: total = (transporte − combustibles − descuentos TRANSPORTE) + (rinde $ − excedentes − descuentos RINDE).
8. Proveedores y conductores no se borran: `activo = false`.

## Problemas conocidos (revisión 2026-10-12, ordenados por prioridad)

### 🔴 Alta — pueden dar valores de dinero equivocados o perder datos
1. **Excedentes no se pueden quitar si vienen heredados**: `ResumenQuincena.jsx` llama a `/excedentes/.../heredar` en cada carga (también tras borrar), así que al poner 0 se vuelve a copiar de la quincena anterior y se sigue restando en el rinde. También hereda en quincenas viejas/cerradas al abrirlas.
2. **Editar un recibo no valida duplicados**: `PUT /recibos/{id}` permite cambiar nombre/fecha sin revisar empresa + fecha → litros entregados contados doble. Si se renombra a otra empresa existente, `propagarPrecio` sobrescribe los precios de esa otra empresa en toda la quincena.
3. **Sin autenticación y CORS `*`** con backend público en Render: cualquiera con la URL puede leer/modificar/borrar datos.
4. **El backend no impide modificar quincenas cerradas** (recolecciones, recibos, descuentos…).
5. **Fechas "hoy" con `toISOString()` (UTC)**: después de las 7 pm sale el día siguiente (Recolecciones, Recibos, Descuentos, Inicio) → registros con fecha equivocada.

### 🟠 Media — fallos de funcionamiento o descuadres en casos concretos
6. **Modo offline de Recolecciones**: sin internet las tarjetas salen "sin registrar" (no se cachean recolecciones ni se muestran las pendientes); al sincronizar, un 409 borra el pendiente sin avisar aunque los litros sean distintos. Editar sin internet falla (solo se encolan registros nuevos).
7. **Dos quincenas abiertas** con fechas distintas (si no se cierra la anterior) → `/quincenas/abierta` da 500. Las fechas cruzadas ya se bloquean.
8. **`vista-completa` con `rutaIds`**: excluye grupos con rutaIds vacío y recibos sin ruta; además un grupo con rutas 1,2 suma lo recogido de ambas aunque el filtro sea solo la 1 (los recibos sí se filtran) → rinde por ruta descuadrado.
9. **Recolecciones duplicadas por concurrencia**: sin restricción única en BD (proveedor + fecha). El POST da 409 y el botón se bloquea, pero dos peticiones simultáneas aún podrían duplicar. `POST /recolecciones/sincronizar` no valida duplicados (hoy no lo usa el frontend).
10. **Cuentas personalizadas re-heredan ingresos** si se dejan vacías.

### 🟡 Baja — detalles
11. `ResumenQuincena.jsx` compara `tipoLeche === 'búfala'` (con tilde) → la etiqueta Búfala nunca aparece.
12. `PUT /descuentos/{id}` con `valor` vacío → `NullPointerException` (500). La pantalla lo valida antes.
13. ESLint tiene ~38 problemas previos (mayoría `react-hooks`); no bloquean el build.
14. Solo existe el test `contextLoads()`.

## Tip IDE

Si el Java Language Server muestra "Duplicate method" falso → `Ctrl+Shift+P` → "Java: Clean Java Language Server Workspace".
