# Contexto del Proyecto - Admin Lechería

> Leer este archivo al inicio de cada conversación para entender el proyecto sin necesidad de re-explicar nada.

---

## ¿Qué es este proyecto?

Sistema de administración de una ruta lechera colombiana con ~36 productores. Maneja recolecciones diarias de leche, liquidaciones quincenales (períodos 1-15 y 16-fin de mes), entregas a empresas compradoras, descuentos a proveedores y resumen de transporte/rinde.

---

## Stack técnico

| Parte | Tecnología |
|---|---|
| Backend | Spring Boot 4.0.6, Java 17, Maven, JPA/Hibernate |
| Frontend | React 19, Vite, Axios, React Router 7, TanStack Query 5 |
| BD local | MySQL 3306, BD `admin_lecheria`, usuario `root/123456` |
| BD prod | PostgreSQL en Neon (via `DATABASE_URL` env var) |
| Backend puerto | 8092 (o `PORT` env var en producción) |
| Deploy | Render (backend) + Vercel (frontend) |

**Estructura de carpetas:**
```
proyecto-lecheria/
├── admin-lecheria/              → Spring Boot backend
│   └── src/main/java/com/smartlech/adminlecheria/
│       ├── entity/              → Entidades JPA
│       ├── repository/          → Spring Data JPA repos
│       ├── service/             → Lógica de negocio
│       ├── controller/          → REST controllers
│       ├── dto/                 → Data Transfer Objects
│       └── config/CorsConfig.java → CORS wildcard (*)
└── admin-lecheria-frontend/     → React frontend
    └── src/
        ├── pages/               → Una carpeta por página
        ├── components/          → Layout, OfflineBanner
        ├── api.js               → Axios con base URL
        └── offlineStore.js      → Cola offline en localStorage
```

---

## Entidades JPA

### Proveedor
```
id, nombre, zona, precioLitro, cuotaLitros, tipoLeche (vaca|bufala), activo
ManyToOne → Ruta
```

### Conductor
```
id, nombre, telefono, activo
```

### Ruta
```
id, nombre, descripcion
```

### Quincena
```
id, fechaInicio, fechaFin, textoQuincena, cerrada
Solo 1 quincena abierta a la vez → findByCerradaFalse()
```

### Recoleccion
```
id, fecha, litrosRecolectados, vale, fechaRegistro, sincronizado
ManyToOne → Quincena, Proveedor, Conductor, Ruta
Validación: no duplicados mismo proveedor+quincena+fecha
```

### ReciboEmpresa
```
id, nombreRecibo, litrosRecibidos, precioLitro, precioTransporte, soloTransporte (boolean), fecha
ManyToOne → Quincena
Validación: no duplicados mismo nombreRecibo+fecha (case-insensitive)
soloTransporte=true → la empresa paga solo transporte, no cuenta para rinde de leche
```

### ReciboDetalle
```
id, litrosAsignados
ManyToOne → ReciboEmpresa, Proveedor
```

### Descuento
```
id, concepto, valor, fecha
ManyToOne → Quincena, Proveedor
```

---

## API REST (base: `/api`)

### Proveedores `/api/proveedores`
- `GET /` — activos
- `GET /todos` — todos (incluyendo inactivos)
- `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}` (soft delete → activo=false)

### Conductores `/api/conductores`
- `GET /`, `GET /todos`, `GET /{id}`, `POST /`, `DELETE /{id}`

### Rutas `/api/rutas`
- `GET /`, `GET /{id}`, `POST /`, `DELETE /{id}`

### Quincenas `/api/quincenas`
- `GET /` — todas
- `GET /abierta` — la quincena actualmente abierta (lanza excepción si no hay)
- `GET /{id}`, `POST /`
- `PUT /{id}/cerrar` — cierra la quincena

### Recolecciones `/api/recolecciones`
- `GET /quincena/{quincenaId}` — recolecciones de la quincena
- `POST /` — crea (valida duplicados)
- `PUT /{id}` — edita litros, vale, conductor
- `DELETE /{id}`
- `GET /resumen/{quincenaId}` — **liquidación completa** (ver DTOs abajo)
- `POST /sincronizar` — batch sync de recolecciones offline
- `GET /pendientes` — recolecciones sin sincronizar

### Recibos `/api/recibos`
- `GET /quincena/{quincenaId}`
- `GET /{id}`
- `POST /` — crea (valida duplicados nombre+fecha)
- `PUT /{id}` — edita campos
- `DELETE /{id}`
- `GET /transporte/{quincenaId}` — **resumen de transporte/rinde** (ver DTOs abajo)

### Descuentos `/api/descuentos`
- `GET /quincena/{quincenaId}`
- `POST /`, `DELETE /{id}`

---

## DTOs clave

### ResumenQuincenaDTO (GET /api/recolecciones/resumen/{id})
```
quincenaId, textoQuincena, fechaInicio, fechaFin
totalProveedores, totalLitros, totalValorBruto
totalDescuentos4x1000, totalOtrosDescuentos, totalValorNeto
proveedores: List<ResumenProveedorDTO>
```

### ResumenProveedorDTO
```
proveedorId, nombre, zona, tipoLeche, conductores
diasRecolectados, totalLitros, precioLitro, valorBruto, cuotaLitros
descuento4x1000 = valorBruto * 4 / 1000
otrosDescuentos: List<DescuentoDetalleDTO>
totalOtrosDescuentos
valorNeto = valorBruto - descuento4x1000 - totalOtrosDescuentos
recolecciones: List<RecoleccionDiariaDTO>
```

### TransporteResumenDTO (GET /api/recibos/transporte/{id})
```
quincenaId, textoQuincena, fechaInicio, fechaFin
empresas: List<String>  ← nombres distintos de empresas
dias: List<TransporteDiarioDTO>
totalLitrosRecogidos, totalLitrosEntregados, totalRinde
totalValorTransporte, totalValorProveedor
```

### TransporteDiarioDTO
```
fecha, litrosRecogidos, litrosEntregados, rinde = entregados - recogidos
empresas: List<EntregaDiariaEmpresaDTO>
```

### EntregaDiariaEmpresaDTO
```
nombre, litros, precioLitro, precioTransporte
valorTotal = litros * precioLitro
valorTransporte = litros * precioTransporte
valorProveedor = litros * (precioLitro - precioTransporte)
```

---

## Páginas del frontend

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `pages/inicio/Inicio.jsx` | Stats del día, accesos rápidos |
| `/proveedores` | `pages/proveedores/Proveedores.jsx` | CRUD productores |
| `/rutas` | `pages/rutas/Rutas.jsx` | CRUD rutas |
| `/conductores` | `pages/conductores/Conductores.jsx` | CRUD conductores |
| `/quincenas` | `pages/quincenas/Quincenas.jsx` | Gestión de quincenas |
| `/recolecciones` | `pages/recolecciones/Recolecciones.jsx` | Entrada diaria de leche |
| `/recibos` | `pages/recibos/Recibos.jsx` | Entregas a empresas |
| `/descuentos` | `pages/descuentos/Descuentos.jsx` | Deducciones por proveedor |
| `/resumen` | `pages/resumen/ResumenQuincena.jsx` | Liquidación quincena |
| `/transporte` | `pages/transporte/Transporte.jsx` | Rinde diario por empresa |

### Componentes compartidos
- `components/Layout.jsx` — sidebar (desktop) / drawer (mobile), navbar
- `components/OfflineBanner.jsx` — detecta offline, muestra pendientes, auto-sync
- `pages/resumen/ReciboProveedorModal.jsx` — modal de recibo individual + impresión

### Lógica de offline (offlineStore.js)
- `guardarPendiente()` / `getPendientes()` / `eliminarPendiente()` — cola de sync
- `cachearDatos()` / `getDatosCache()` — datos de referencia en localStorage
- Auto-sync al recuperar conexión + botón manual

---

## Reglas de negocio importantes

1. **Solo 1 quincena abierta** a la vez. Las demás están cerradas.
2. **Duplicados en recolecciones**: mismo proveedor + quincena + fecha → error.
3. **Duplicados en recibos**: mismo nombreRecibo + fecha (case-insensitive, trimmed) → error.
4. **soloTransporte**: recibos donde la empresa paga solo el flete, NO cuentan para el rinde de leche en la tabla de transporte.
5. **Descuento 4x1000**: se calcula como `valorBruto * 4 / 1000`, se resta del pago.
6. **Rinde**: `litrosEntregados (recibos sin soloTransporte) - litrosRecogidos (recolecciones)`. Negativo = pérdida.
7. **Soft delete** en Proveedores y Conductores → campo `activo=false`, no se borran de BD.
8. **Formato moneda**: pesos colombianos, `toLocaleString('es-CO')`.

---

## Configuración local para desarrollo

**Backend:**
```bash
cd admin-lecheria
mvn spring-boot:run
# Corre en http://localhost:8092
```

**Frontend:**
```bash
cd admin-lecheria-frontend
npm run dev
# Corre en http://localhost:5173
# VITE_API_URL=http://localhost:8092/api (por defecto)
```

**BD:** MySQL en localhost:3306, BD `admin_lecheria`, usuario `root`, contraseña `123456`

---

## Estado del proyecto (junio 2026)

- Sistema funcional con todas las páginas operativas
- Soporte offline para recolecciones (localStorage + sync)
- Deploy en Render (backend) + Vercel (frontend) + Neon (PostgreSQL prod)
- Sin autenticación (Spring Security excluida)
- CORS wildcard (`*`) para todos los orígenes
- Archivos con cambios pendientes recientes:
  - `admin-lecheria-frontend/src/pages/transporte/Transporte.jsx`
  - `admin-lecheria/src/main/java/com/smartlech/adminlecheria/service/ReciboEmpresaService.java`
