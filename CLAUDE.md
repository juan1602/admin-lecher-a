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
- `quincenas`: GET, GET `/abierta`, GET `/{id}`, POST, PUT `/{id}/cerrar`, PUT `/{id}/reabrir`
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
| `/quincenas` | `pages/quincenas/Quincenas.jsx` | Crear, cerrar, reabrir |
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

## Problemas conocidos (revisión 2026-10-01, pendientes)

- Sin autenticación y CORS `*` con backend público en Render.
- Se pueden crear dos quincenas abiertas → `/quincenas/abierta` da 500.
- Fechas "hoy" con `toISOString()` (UTC): después de las 7 pm sale el día siguiente (Recolecciones, Recibos, Descuentos, Inicio).
- `vista-completa` con `rutaIds` excluye grupos con rutaIds vacío y recibos sin ruta.
- Sin restricción única en BD para recolecciones (proveedor + fecha). El POST devuelve 409 si es duplicado y el botón Guardar se bloquea mientras guarda, pero dos peticiones simultáneas aún podrían duplicar.
- Cuentas personalizadas re-heredan ingresos si se dejan vacías.
- El backend no impide modificar quincenas cerradas.
- `ResumenQuincena.jsx` compara `tipoLeche === 'búfala'` (con tilde) → la etiqueta nunca aparece.
- ESLint tiene ~38 problemas previos (mayoría `react-hooks`); no bloquean el build.
- Solo existe el test `contextLoads()`.

## Tip IDE

Si el Java Language Server muestra "Duplicate method" falso → `Ctrl+Shift+P` → "Java: Clean Java Language Server Workspace".
