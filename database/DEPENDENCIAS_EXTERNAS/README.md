# Dependencias externas (tablas de otros módulos)

> **Esta carpeta es TEMPORAL.** Contiene tablas y datos de prueba que **no son de Cuentas por Pagar**, sino de otros módulos del proyecto (Nómina, Compras e Inventarios). Existe solo para que podamos desarrollar y probar nuestro módulo **antes** de que esos equipos se integren. Cuando lo hagan, se dejan de ejecutar estos scripts y se usan los de ellos.

## ¿Por qué hay que ejecutar esto?

Cuentas por Pagar no funciona sola: varias de sus vistas necesitan datos que **le pertenecen a otros módulos**. En el modelo completo del proyecto (`SCRIPT_GENERAL.sql`) esas relaciones están así:

| Tabla de Cuentas por Pagar | Necesita | Módulo dueño |
|---|---|---|
| `CP_FACTURA_PROVEEDOR` | proveedor que emite el DTE | **Compras** (`PROVEEDOR`) |
| `CP_FACTURA_PROVEEDOR_DETALLE` | artículo de la línea (opcional) | **Inventarios** (`ARTICULO`) |
| `CP_CONTRASENA_PAGO` | empleado que autoriza el pago | **Nómina** (empleados) |
| `CP_CAJA_CHICA` | sucursal y empleado responsable | **Nómina** (sucursales, empleados) |

Si esas tablas **no existen**, el `00_MASTER_SETUP.sql` no puede crear sus paquetes (quedan inválidos) y se detiene con un aviso.

Si existen pero están **vacías**, la aplicación arranca, pero no se puede probar:

| Vista | Sin estos datos… |
|---|---|
| **Facturas Proveedor** | El selector de proveedor sale vacío y **no se puede registrar ninguna factura** (el proveedor se valida en la base de datos). |
| **Contraseñas de Pago** | El selector "Empleado que autoriza" sale vacío. |
| **Caja Chica** | No hay sucursales ni responsables: **no se puede crear ninguna caja**. |
| **Movimientos de Caja** | Sin cajas, no hay movimientos que probar. |
| **Cheques / Retenciones** | Dependen de que existan facturas y contraseñas (ver arriba). |

Además, los datos de prueba de Cuentas por Pagar (`RUN_ALL_SEEDS.sql`) buscan proveedores, empleados y artículos **por su código o NIT**. Si no existen, se detienen con un mensaje que indica ejecutar esta carpeta.

## Qué crea

| Archivo | Contenido |
|---|---|
| `01_SETUP_DEPENDENCIAS.sql` | **Estructura** (se crea solo si no existe): `NOM_DEPARTAMENTO`, `NOM_PUESTO`, `NOM_SUCURSAL`, `NOM_EMPLEADO` (Nómina), `PROVEEDOR` (Compras), `CATEGORIA_ARTICULO`, `ARTICULO` (Inventarios). |
| `02_DATOS_DEPENDENCIAS.sql` | **Datos de prueba**: 4 departamentos, 5 puestos, 16 sucursales (`SUC-001`…`SUC-016`), 54 empleados (`EMP-001`…`EMP-054`), 8 proveedores (1 inactivo), 4 categorías y 5 artículos (`ART-2001`…`ART-2009`). |
| `RUN_DEPENDENCIAS.sql` | Ejecuta los dos anteriores en orden. |

- **No borra nada** y se puede ejecutar **varias veces**: cada tabla se crea solo si no existe y cada fila se inserta solo si no existe (por su código, NIT o nombre).
- `PROVEEDOR`, `CATEGORIA_ARTICULO` y `ARTICULO` también los crea `SCRIPT_GENERAL.sql` (paso 0), con la **misma definición**. Si ya existen, aquí no se tocan; solo se cargan los datos de prueba.
- Los empleados y sucursales usan el prefijo `NOM_` porque así los consume el código de Cuentas por Pagar. Antes vivían dentro de `00_MASTER_SETUP.sql` y de `CajaChica/SEED_DATA.sql`; se movieron aquí para separar lo nuestro de lo ajeno.

## Orden de ejecución

```
0. database/SCRIPT_GENERAL.sql                          modelo completo
1. database/DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql  ← ESTA CARPETA (correr desde aquí)
2. database/00_MASTER_SETUP.sql                         estructura y código de CxP
3. database/RUN_ALL_SEEDS.sql                           datos de prueba de CxP (correr desde database/)
```

Va **antes** del master porque los paquetes, la vista y las llaves foráneas de Cuentas por Pagar leen estas tablas.

## Datos de prueba útiles

| Para probar… | Usa |
|---|---|
| Facturas de un proveedor activo | NIT `1234567-8` (El Estudiante, 30 días de crédito), `5678901-2` (TecnoStore, 60 días), etc. |
| Que un proveedor inactivo **no** aparezca | NIT `8901234-5` (Proveedor Inactivo de Prueba) |
| Empleado que autoriza | `EMP-001`, `EMP-002`, `EMP-003` |
| Responsables de Caja Chica | `EMP-001`…`EMP-016` (uno por sucursal; `EMP-017`…`EMP-054` son custodios adicionales) |
| Artículo en una línea de factura | `ART-2001` (papel), `ART-2003` (bobinas), `ART-2006` (NAS), `ART-2007` (licencia), `ART-2009` (tóner) |

## Cuando los otros módulos se integren

1. **Dejar de ejecutar** esta carpeta. Ejecutar en su lugar los scripts y datos reales del equipo dueño (Nómina, Compras o Inventarios), **antes** de `00_MASTER_SETUP.sql`.
2. Si sus tablas tienen **otro nombre o columnas** (por ejemplo, Nómina entrega `EMPLEADO` y `SUCURSAL` en vez de `NOM_EMPLEADO` y `NOM_SUCURSAL`), actualizar las referencias en Cuentas por Pagar:

   | Tabla | Dónde la usa Cuentas por Pagar |
   |---|---|
   | Sucursales | `00_MASTER_SETUP.sql`: verificación de la Fase 1, `FK_CP_CAJA_CHICA_SUC` (Fase 3), `PKG_CAJA_CHICA` (`SP_LISTAR_SUCURSALES` y listados de cajas) |
   | Empleados | `00_MASTER_SETUP.sql`: verificación de la Fase 1, `FK_CP_CAJA_CHICA_EMP` (Fase 3), `PKG_CAJA_CHICA` (`SP_LISTAR_EMPLEADOS` y listados), `PKG_CP_CONTRASENA_PAGO.VALIDAR_EMPLEADO` |
   | `PROVEEDOR` | `00_MASTER_SETUP.sql`: vista `VW_CP_FACTURA_PROVEEDOR`, `PKG_CP_FACTURA_PROVEEDOR` (`VALIDAR_CABECERA`, `SP_LISTAR_PROVEEDORES`) |
   | `ARTICULO` | Solo los datos de prueba (`FacturaProveedor/SEED_DATA.sql` busca artículos por `CODIGO`) |
   | Todas | Los `SEED_DATA.sql` de Cuentas por Pagar buscan por `CODIGO_EMPLEADO`, `CODIGO` de sucursal, `NIT` y `CODIGO` de artículo; si los datos reales usan otros códigos, ajustar esos valores. |

3. Borrar esta carpeta cuando ya no se use, y quitar el paso 1 de `database/Pasos.SQL.txt`.
