## Estructura del proyecto

```
cuentas-por-pagar-modulo/
├── database/
│   ├── SCRIPT_GENERAL.sql                         # Paso 0: modelo completo del proyecto (todos los modulos)
│   ├── DEPENDENCIAS_EXTERNAS/                     # Paso 1 (TEMPORAL): tablas y datos de OTROS modulos
│   │   ├── README.md                              #   por que existe y como reemplazarlo al integrar
│   │   ├── 01_SETUP_DEPENDENCIAS.sql              #   NOM_* (Nomina), PROVEEDOR (Compras), ARTICULO (Inventarios)
│   │   ├── 02_DATOS_DEPENDENCIAS.sql              #   sucursales, empleados, proveedores, articulos
│   │   └── RUN_DEPENDENCIAS.sql                   #   ejecuta 01 y 02
│   ├── 00_MASTER_SETUP.sql                        # Paso 2: tablas CP_* + vista + paquetes PL/SQL
│   ├── RUN_ALL_SEEDS.sql                          # Paso 3: datos de prueba de CxP (usa los procedimientos)
│   ├── Pasos.SQL.txt                              # Orden de ejecucion (pasos a seguir)
│   ├── CajaChica/
│   │   └── SEED_DATA.sql
│   ├── CajaChicaMovimiento/
│   │   └── SEED_DATA.sql
│   ├── Cheque/
│   │   └── SEED_DATA.sql
│   ├── ContrasenaPago/
│   │   └── SEED_DATA.sql
│   ├── FacturaProveedor/
│   │   └── SEED_DATA.sql
│   ├── FacturaProveedorDetalle/
│   │   ├── paquete_factura_proveedor_detalle.sql
│   │   └── paquete_tipo_unidad_medida.sql
│   ├── Retencion/
│   │   └── SEED_DATA.sql
│   └── UnidadMedida/
│       └── SEED_DATA.sql
│
├── backend/
│   ├── src/
│   │   ├── entities/
│   │   │   ├── CajaChica.ts
│   │   │   ├── CajaChicaMovimiento.ts
│   │   │   ├── Cheque.ts
│   │   │   ├── ContrasenaPago.ts
│   │   │   ├── FacturaProveedor.ts
│   │   │   ├── FacturaProveedorDetalle.ts
│   │   │   ├── Retencion.ts
│   │   │   └── UnidadMedida.ts
│   │   ├── handlers/
│   │   │   ├── cajaChica.handler.ts
│   │   │   ├── cajaChicaMovimiento.handler.ts
│   │   │   ├── cheque.handler.ts
│   │   │   ├── contrasenaPago.handler.ts
│   │   │   ├── facturaProveedor.handler.ts
│   │   │   ├── facturaProveedorDetalle.handler.ts
│   │   │   ├── retencionHandler.ts
│   │   │   └── unidadMedidaHandler.ts
│   │   ├── routes/
│   │   │   ├── cajaChica.routes.ts
│   │   │   ├── cajaChicaMovimiento.routes.ts
│   │   │   ├── cheque.routes.ts
│   │   │   ├── contrasenaPago.routes.ts
│   │   │   ├── facturaProveedor.routes.ts
│   │   │   ├── facturaProveedorDetalle.routes.ts
│   │   │   ├── retencionRoutes.ts
│   │   │   └── unidadMedidaRoutes.ts
│   │   ├── data-source.ts
│   │   ├── router.ts
│   │   ├── server.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Alert.tsx
│   │   │       ├── AppShell.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── ConfirmModal.tsx
│   │   │       ├── FormField.tsx
│   │   │       ├── IconBtn.tsx
│   │   │       ├── KpiCard.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── SH.tsx
│   │   │       ├── SearchContext.tsx
│   │   │       ├── SearchInput.tsx
│   │   │       ├── SearchableSelect.tsx
│   │   │       ├── StandaloneToast.tsx
│   │   │       ├── Table.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── index.tsx
│   │   ├── pages/
│   │   │   ├── CajaChica/
│   │   │   │   ├── CajaChicaPage.tsx
│   │   │   │   ├── cajaChica.api.ts
│   │   │   │   ├── cajaChica.types.ts
│   │   │   │   └── useCajaChica.ts
│   │   │   ├── CajaChicaMovimiento/
│   │   │   │   ├── CajaChicaMovimientoPage.tsx
│   │   │   │   ├── cajaChicaMovimiento.api.ts
│   │   │   │   ├── cajaChicaMovimiento.types.ts
│   │   │   │   └── useCajaChicaMovimiento.ts
│   │   │   ├── Cheque/
│   │   │   │   ├── ChequePage.tsx
│   │   │   │   ├── cheque.api.ts
│   │   │   │   ├── cheque.types.ts
│   │   │   │   └── useCheque.ts
│   │   │   ├── ContrasenaPago/
│   │   │   │   ├── ContrasenaPagoPage.tsx
│   │   │   │   ├── contrasenaPago.api.ts
│   │   │   │   ├── contrasenaPago.types.ts
│   │   │   │   └── useContrasenaPago.ts
│   │   │   ├── Dashboard/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── Dashboard.css
│   │   │   ├── FacturaProveedor/
│   │   │   │   ├── FacturaProveedorPage.tsx
│   │   │   │   ├── facturaProveedor.api.ts
│   │   │   │   ├── facturaProveedor.types.ts
│   │   │   │   └── useFacturaProveedor.ts
│   │   │   ├── FacturaProveedorDetalle/
│   │   │   │   ├── FacturaProveedorDetallePage.tsx
│   │   │   │   ├── facturaProveedorDetalle.api.ts
│   │   │   │   ├── facturaProveedorDetalle.types.ts
│   │   │   │   ├── unidadMedidaCatalogo.api.ts
│   │   │   │   └── useFacturaProveedorDetalle.ts
│   │   │   ├── Retencion/
│   │   │   │   ├── RetencionPage.tsx
│   │   │   │   ├── retencion.api.ts
│   │   │   │   ├── RetencionTypes.ts
│   │   │   │   └── useRetencion.ts
│   │   │   └── Unidad_Medida/
│   │   │       ├── UnidadMedidaPage.tsx
│   │   │       ├── unidadMedida.api.ts
│   │   │       ├── UnidadMedidaTypes.ts
│   │   │       └── useUnidadMedida.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   │   └── format.ts
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── kit.css
│   │   │   ├── shell.css
│   │   │   ├── theme.css
│   │   │   └── tokens.css
│   │   ├── router/
│   │   │   ├── AppRouter.tsx
│   │   │   └── navigation.config.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tsconfig.node.json
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## Requisitos previos

- Node.js 18+ y npm
- **Oracle Instant Client** (en modo *Thin* de oracledb 6+ normalmente no hace falta).

---

## Configuración

### Backend (`backend/.env`)

```
PORT=SU_PUERTO
DB_USER=SU_USUARIO
DB_PASSWORD=SU_CONTRASEÑA
DB_CONNECT_STRING=localhost:1521/SU_CONTENEDOR
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:SU_PUERTO/api
```

---

## Cómo correr el BACKEND

```bash
cd backend
npm install
npm run dev
```

- Arranca en `http://localhost:SU_PUERTO`
- API base: `http://localhost:SU_PUERTO/api`
- Endpoints: `http://localhost:SU_PUERTO/api/contrasenas-pago`

---

## Cómo correr el FRONTEND

```bash
cd frontend
npm install
npm run dev
```

- Arranca en `http://localhost:5173`

---

## Flujo de trabajo con Git

```bash
git pull
git add .
git commit -m "Guardar cambos y especificar que fue lo actualizado"
git push (se utiliza para subir los cambios, cuidado con usarlo)
```
