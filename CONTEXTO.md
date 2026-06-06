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

## Cambios recientes (sesión junio 2026)

### Inicio rediseñado
- Dashboard con barra de progreso de quincena y días restantes
- KPIs: litros hoy, total quincena, estimado a pagar ($1.900/L ref.), proveedores activos
- Gráfica de barras CSS por día (sin librerías)
- `App.jsx` ya importa `Inicio` correctamente en la ruta `/`

### Grupos de Rinde (feature nueva)
Nueva entidad `GrupoRinde` con tablas: `grupos_rinde`, `grupo_rinde_rutas`, `grupo_rinde_empresas`

**Campos:** nombre, tipoLeche (vaca|bufala|null=todos), rutaIds (List<Long>), empresas (List<String>)

**Endpoints:** `GET|POST|PUT|DELETE /api/grupos-rinde`, `GET /api/grupos-rinde/vista-completa/{quincenaId}`

**Lógica:** Cada grupo define qué rutas de proveedores suman al "recogido" y qué empresas suman al "entregado". El rinde = entregado - recogido, separado por grupo.

**Nuevos archivos backend:**
- `entity/GrupoRinde.java`
- `repository/GrupoRindeRepository.java`
- `service/GrupoRindeService.java` — métodos: `listar`, `guardar`, `eliminar`, `calcularRindePorGrupo`, `calcularVistaCompleta`
- `controller/GrupoRindeController.java`
- `dto/GrupoCompactoDTO.java`, `DiaCompletoDTO.java`, `DiaGrupoDTO.java`, `TransporteCompletoDTO.java`, `RindeGrupoDTO.java`

**Empresas distintas:** `GET /api/recibos/empresas` devuelve nombres únicos de recibos (fix 400: `/{id:[0-9]+}` en `ReciboEmpresaController`)

### Transporte rediseñado
- Con grupos configurados: tabla unificada estilo Excel con TODAS las empresas como columnas + columnas ENT/REC/RINDE por grupo + RINDE TOTAL
- Las empresas configuradas en un grupo se resaltan con el color del grupo
- Empresas no asignadas a ningún grupo aparecen en sección "Otros recibos"
- Sin grupos: vista global anterior (sin cambios)
- Panel "⚙ Grupos de Rinde" colapsable con CRUD de grupos
- Modal de grupo: nombre, tipoLeche, rutas (checkboxes), empresas (chips desde recibos existentes + campo para nueva), **precioRinde** ($/litro que paga la empresa para valorizar el rinde)

### Filas de resumen financiero en tabla de Transporte
Debajo de los datos diarios aparecen estas filas adicionales:
- **TOTAL L.** — litros totales por empresa + rinde litros por grupo
- **$/TRANS** — precio transporte por empresa (último visto en recibos)
- **TOTAL TRANS** — litros × precioTransporte → columna derecha muestra `TRANS: $X`
- **$/LECHE** — precio a proveedor (precioLitro − precioTransporte) por empresa; en columna RINDE del grupo: `precioRinde` configurado
- **TOTAL LECHE** — litros × precio leche por empresa; en columna RINDE del grupo: rinde litros × precioRinde → columna derecha muestra `RINDE: $X`
- **TOTAL $** — litros × precioLitro completo (lo que paga la empresa) → columna derecha muestra `PAGO: $X`
- **RINDE + TRANSPORTE** — fila final con el total que gana el operador

### Campo precioRinde en GrupoRinde
- Entidad `GrupoRinde` tiene campo `precioRinde` (Double, nullable) = precio configurado por litro de rinde
- El servicio usa `g.getPrecioRinde()` directamente; si es null → muestra `—` y rinde = $0
- Al editar el grupo se pre-llena este campo

### Fix 400 en /recibos/empresas
- `/{id}` en `ReciboEmpresaController` usa regex `/{id:[0-9]+}` para no capturar rutas literales

### Tip IDE
Si el Java Language Server muestra "Duplicate method" sin que exista duplicado real → `Ctrl+Shift+P` → "Java: Clean Java Language Server Workspace"
