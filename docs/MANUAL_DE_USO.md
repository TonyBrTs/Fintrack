# 📘 Manual de Uso de la Aplicación Web — FinTrack

Bienvenido a **FinTrack**, tu plataforma integral de gestión y salud financiera personal. Este manual detalla paso a paso todas las funciones del sistema web, diseñado para ser intuitivo, rápido, seguro y adaptable tanto a computadoras de escritorio como a dispositivos móviles y tabletas.

---

## 📑 Tabla de Contenidos

1. [Acceso al Sistema y Seguridad](#1-acceso-al-sistema-y-seguridad)
   - [Inicio de Sesión y Registro](#inicio-de-sesión-y-registro)
   - [Cuenta de Pruebas / Demostración](#cuenta-de-pruebas--demostración)
   - [Cierre de Sesión](#cierre-de-sesión)
2. [Navegación e Interfaz General](#2-navegación-e-interfaz-general)
   - [Encabezado y Barra de Navegación](#encabezado-y-barra-de-navegación)
   - [Selector de Moneda e Idioma](#selector-de-moneda-e-idioma)
   - [Tema Claro y Oscuro](#tema-claro-y-oscuro)
   - [Instalación como Aplicación (PWA)](#instalación-como-aplicación-pwa)
3. [Panel Principal (Resumen / Dashboard)](#3-panel-principal-resumen--dashboard)
   - [Selector de Período](#selector-de-período)
   - [Tarjetas de Métricas Clave (KPIs)](#tarjetas-de-métricas-clave-kpis)
   - [Gráficos Financieros Interactivos](#gráficos-financieros-interactivos)
   - [Carrusel de Transacciones Recientes](#carrusel-de-transacciones-recientes)
   - [Resumen de Metas de Ahorro](#resumen-de-metas-de-ahorro)
   - [Consejos Financieros Inteligentes](#consejos-financieros-inteligentes)
4. [Módulo de Gastos](#4-módulo-de-gastos)
   - [Historial y Tabla de Gastos](#historial-y-tabla-de-gastos)
   - [Cómo Registrar un Nuevo Gasto](#cómo-registrar-un-nuevo-gasto)
   - [Búsqueda y Filtros Avanzados](#búsqueda-y-filtros-avanzados)
   - [Detalle, Edición y Eliminación de Gastos](#detalle-edición-y-eliminación-de-gastos)
   - [Gastos Fijos y Recurrentes](#gastos-fijos-y-recurrentes)
5. [Módulo de Ingresos](#5-módulo-de-ingresos)
   - [Historial y Tabla de Ingresos](#historial-y-tabla-de-ingresos)
   - [Cómo Registrar un Nuevo Ingreso](#cómo-registrar-un-nuevo-ingreso)
   - [Búsqueda y Filtros de Fuentes](#búsqueda-y-filtros-de-fuentes)
   - [Detalle, Edición y Eliminación](#detalle-edición-y-eliminación)
   - [Ingresos Fijos y Recurrentes](#ingresos-fijos-y-recurrentes)
6. [Módulo de Metas de Ahorro](#6-módulo-de-metas-de-ahorro)
   - [Creación de una Nueva Meta](#creación-de-una-nueva-meta)
   - [Cómo Realizar Aportes a una Meta](#cómo-realizar-aportes-a-una-meta)
   - [Retiro de Fondos y Cumplimiento](#retiro-de-fondos-y-cumplimiento)
7. [Módulo de Reportes y Libro Contable](#7-módulo-de-reportes-y-libro-contable)
   - [Filtros de Tiempo y Rangos Personalizados](#filtros-de-tiempo-y-rangos-personalizados)
   - [Exportación a PDF / Imprimir](#exportación-a-pdf--imprimir)
   - [Exportación a Excel (.xlsx) y CSV](#exportación-a-excel-xlsx-y-csv)
8. [Administración de Categorías Personalizadas](#8-administración-de-categorías-personalizadas)
   - [Crear una Categoría con Color Identificador](#crear-una-categoría-con-color-identificador)
   - [Eliminación Segura y Reasignación](#eliminación-segura-y-reasignación)
9. [Solución de Problemas Frecuentes](#9-solución-de-problemas-frecuentes)

---

## 1. Acceso al Sistema y Seguridad

### Inicio de Sesión y Registro
1. Ingresa a la URL de la aplicación (por ejemplo: `https://fintrack-six-opal.vercel.app/login`).
2. Si ya tienes una cuenta:
   - Introduce tu **Correo electrónico**.
   - Introduce tu **Contraseña**.
   - Haz clic en **Iniciar Sesión**.
3. Si eres un usuario nuevo:
   - Haz clic en la pestaña o enlace **Registrarse**.
   - Ingresa tu correo electrónico y una contraseña segura (mínimo 6 caracteres).
   - Completa el registro. Tu cuenta quedará lista para usar inmediatamente.

### Cuenta de Pruebas / Demostración
Para evaluar la plataforma con datos cargados previamente (gastos, ingresos, metas y suscripciones recurrentes):
* **Correo**: `admin@gmail.com`
* **Contraseña**: `admin`

### Cierre de Sesión
Para cerrar tu sesión de forma segura:
* En computadoras: Haz clic en el botón con tu perfil o ícono de salida en la esquina superior derecha del encabezado.
* En móviles: En la barra de navegación inferior, dirígete al menú o perfil y pulsa **Cerrar Sesión**.

> [!NOTE]
> La aplicación cuenta con persistencia inteligente de sesión: puedes cambiar entre pestañas del navegador o minimizar la app sin que se produzcan recargas o desconexiones inesperadas.

---

## 2. Navegación e Interfaz General

### Encabezado y Barra de Navegación
* **Logotipo FinTrack**: Al hacer clic en el isotipo o logotipo en cualquier momento, volverás a la pantalla de **Resumen**.
* **Menú Superior (Escritorio)**: Acceso directo a las 5 secciones principales:
  1. **Resumen** (`/`)
  2. **Gastos** (`/expenses`)
  3. **Ingresos** (`/incomes`)
  4. **Metas** (`/goals`)
  5. **Reportes** (`/reports`)
* **Barra Inferior (Móvil)**: En pantallas pequeñas, dispones de una barra de navegación rápida fija en la parte inferior para alternar de forma cómoda con una sola mano.

### Selector de Moneda e Idioma
En la barra de navegación o menú de configuración puedes personalizar:
* **Moneda**:
  * `CRC (₡)` — Colones costarricenses (por defecto).
  * `USD ($)` — Dólares estadounidenses.
  * `EUR (€)` — Euros.
  * Los montos se formatean automáticamente con separador de miles y dos decimales en tiempo real.
* **Idioma**:
  * **Español (`es`)**: Vocabulario, fechas y meses en formato latino (`15 set.`, `30 oct.`).
  * **Inglés (`en`)**: Adaptación completa bilingüe.

### Tema Claro y Oscuro
FinTrack incluye un modo oscuro (*Dark Mode*) diseñado para descansar la vista en entornos de poca luz y ahorrar batería en pantallas OLED:
* Haz clic en el interruptor de sol/luna (☀️ / 🌙) ubicado en el encabezado.
* El sistema recordará tu preferencia en futuras sesiones.

### Instalación como Aplicación (PWA)
FinTrack está optimizado como *Progressive Web App*:
* **En Chrome / Edge (PC o Mac)**: Haz clic en el ícono de instalación (ordenador con flecha hacia abajo) en la barra de direcciones del navegador.
* **En Android**: Pulsa el menú de 3 puntos en Chrome y selecciona **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
* **En iPhone / iPad**: Pulsa el botón **Compartir** en Safari y selecciona **"Añadir a la pantalla de inicio"**.

---

## 3. Panel Principal (Resumen / Dashboard)

Al iniciar sesión serás recibido por el Dashboard general, diseñado para que en menos de 5 segundos conozcas el estado exacto de tu economía.

### Selector de Período
En la esquina superior derecha encontrarás el selector de fecha:
* **Mes Actual**: Muestra los movimientos del mes en curso.
* **Meses Anteriores**: Puedes consultar meses específicos de los últimos 12 meses.
* **Todo el tiempo**: Totaliza el acumulado histórico de tu cuenta.

### Tarjetas de Métricas Clave (KPIs)
1. **Balance Total**: Tu patrimonio disponible en el período (`Ingresos Totales - Gastos Totales`).
   * *Verde / Óptimo*: Tus ingresos superan tus gastos.
   * *Rojo / Negativo*: Estás gastando más de lo que ingresas.
2. **Total en Ingresos**: Suma total de sueldos, trabajos extra y demás entradas con el número de transacciones registradas.
3. **Total en Gastos**: Suma de consumos, pagos y aportes a metas.
4. **Tasa de Ahorro (%)**: Porcentaje neto de tus ingresos que lograste retener en el período. Si superas el 20%, el sistema te otorgará un indicador de *Excelente*.

### Gráficos Financieros Interactivos
* **Gastos por Categoría (Gráfico Circular / Dona)**:
  * Cada rebanada representa una categoría y adopta **su color oficial asignado**.
  * Al pasar el cursor o pulsar sobre una rebanada, verás el monto exacto acumulado y el porcentaje relativo.
* **Ingresos vs Gastos Mensuales (Gráfico de Barras)**:
  * Compara mes a mes las barras verdes (entradas) contra las barras rojas (salidas) a lo largo del año.

### Carrusel de Transacciones Recientes
* Muestra de forma cronológica tus últimos 8 movimientos.
* **Punto de color de categoría**: Cada tarjeta identifica visualmente la categoría con su color distintivo.
* **Diferenciador visual**:
  * `+` en verde para ingresos.
  * `-` en rojo para gastos comunes.
  * Ícono de meta en ámbar para aportes a metas de ahorro.
* Cuenta con auto-desplazamiento suave y barra indicadora de progreso. Al hacer clic en cualquier tarjeta, te dirigirá directamente al módulo correspondiente.

### Resumen de Metas de Ahorro
* Tarjeta ubicada a la derecha de transacciones recientes en computadoras.
* Contiene una lista optimizada con desplazamiento vertical (`scroll`) para visualizar múltiples metas sin descuadrar la cuadrícula del panel.
* Muestra el porcentaje de cumplimiento (`%`), el monto actual vs meta final y una barra de progreso animada.

### Consejos Financieros Inteligentes
* Módulo con análisis automatizado que evalúa tu balance y gastos para ofrecerte recomendaciones prácticas de ahorro y control presupuestario.

---

## 4. Módulo de Gastos

Accede desde el menú superior pulsando **Gastos**.

### Historial y Tabla de Gastos
En la pestaña principal **"Historial de Gastos"** verás:
* Resumen de total gastado en el mes y categoría principal con mayor impacto.
* Tabla completa con:
  * **Fecha y Método de Pago**: Día de realización y medio empleado (Efectivo, Tarjeta, SINPE Móvil, etc.).
  * **Descripción**: Nombre del concepto. Si fue generado por una regla recurrente, incluirá el ícono de repetición (`🔁`). Si es un aporte a meta, indicará claramente `Aporte a meta: [Nombre]`.
  * **Categoría**: Insignia interactiva (`CategoryBadge`) con el color configurado por ti y un punto indicador.
  * **Monto**: Cifra destacada en tono rojizo (`-₡X,XXX.XX`).

### Cómo Registrar un Nuevo Gasto
1. Haz clic en el botón azul **"+ Registrar Gasto"** en la parte superior.
2. Completa los campos en el modal:
   * **Monto**: Escribe la cantidad. El campo formatea los números con comas de miles automáticamente a medida que escribes.
   * **Concepto / Descripción**: Nombre de la compra o servicio (ej. *"Supermercado semanal"*, *"Cena familiar"*).
   * **Categoría**: Elige una de las categorías existentes o pulsa **"Añadir categoría"** para crear una nueva al instante.
   * **Fecha**: Por defecto coloca el día de hoy, pero puedes seleccionar cualquier fecha pasada en el calendario.
   * **Método de Pago**: Efectivo, Tarjeta de Débito, Tarjeta de Crédito, Transferencia Bancaria, u Otros.
3. Haz clic en **"Guardar Gasto"**.
4. Recibirás una confirmación emergente (*Toast*) en la esquina superior derecha y la tabla se actualizará de inmediato.

### Búsqueda y Filtros Avanzados
* **Buscador en Vivo**: Escribe palabras clave en la barra de búsqueda para filtrar al instante por descripción, comercio o método de pago.
* **Filtro por Categoría**: Despliega el menú para aislar gastos de una categoría particular (ej. solo *"Alimentación"* o solo *"Transporte"*). Cada opción del menú incluye su respectivo punto de color.

### Detalle, Edición y Eliminación de Gastos
1. Haz clic en cualquier fila de la tabla de gastos para abrir el **Comprobante Digital (Sheet)**.
2. En este panel podrás:
   * Copiar el ID único de la transacción al portapapeles con un solo clic en el botón de copiado.
   * Ver fecha completa, categoría con su badge de color y método de pago.
   * **Editar**: Haz clic en el botón con ícono de lápiz para modificar monto, categoría o descripción.
   * **Eliminar**: Haz clic en el botón de papelera roja. Se solicitará confirmación antes de borrar el registro para evitar pérdidas accidentales.

---

### Gastos Fijos y Recurrentes
Accede pulsando la pestaña **"Gastos Fijos"** dentro de la sección de Gastos. Esta herramienta automatiza tus pagos periódicos obligatorios (como suscripciones, alquileres o servicios públicos).

#### 1. Configurar un Gasto Fijo
1. Haz clic en **"+ Nuevo Gasto Fijo"**.
2. Ingresa el monto y el concepto (ej. *"Netflix"*, *"Alquiler departamento"*).
3. Selecciona la **Frecuencia**:
   * **Quincenal**: Elige entre:
     * *15 y fin de mes* (ideal para salarios de quincena estándar).
     * *Cada 15 días continuos*.
   * **Mensual**: Elige el día del mes exacto en que vence (del 1 al 31, o el último día).
   * **Semanal**: Se ejecutará cada 7 días.
   * **Anual**: Se ejecutará una vez al año.
4. Elige el **Modo de Cobro**:
   * **Automático**: Cuando llegue la fecha de vencimiento y abras la aplicación, el gasto se registrará por sí solo en tu historial.
   * **Manual**: Te notificará la fecha de vencimiento pero requerirá que pulses el botón de registro.
5. Guarda el registro.

#### 2. Pausar o Reactivar Gastos Fijos
* Tanto en computadoras como en celulares, cada gasto fijo cuenta con un interruptor **Switch**.
* Para pausar temporalmente un gasto (por ejemplo, si cancelaste un servicio un mes): desactiva el switch. La fila se atenuará y no generará gastos automáticos.
* Para reactivarlo, vuelve a activar el switch en cualquier momento.

#### 3. Ejecución Anticipada ("Ejecutar Ahora")
* Si pagaste un servicio antes de su fecha programada, abre las opciones del gasto fijo y haz clic en **"Ejecutar Ahora"** para asentar el gasto en el historial sin esperar al día de corte.

> [!IMPORTANT]
> **Sincronización con Zona Horaria Local:**
> FinTrack sincroniza las quincenas y fechas fijas basándose en la hora local de tu dispositivo (`UTC-6`). Por ejemplo, durante la noche del día 14 nunca se aplicará indebidamente un gasto programado para el día 15.

---

## 5. Módulo de Ingresos

Accede desde el menú superior pulsando **Ingresos**.

### Historial y Tabla de Ingresos
* Funciona de forma análoga al módulo de gastos, destacando tus entradas con números verdes (`+₡X,XXX.XX`).
* Muestra la **Fuente** de dinero (Salario, Freelance, Inversiones, Regalo, etc.) con su etiqueta de color `CategoryBadge`.

### Cómo Registrar un Nuevo Ingreso
1. Haz clic en **"+ Registrar Ingreso"**.
2. Ingresa el monto (con formateo en vivo), descripción (ej. *"Pago de nómina primera quincena"*), fuente de ingreso, fecha y medio de recepción.
3. Guarda el ingreso para impactar positivamente tu balance general.

### Ingresos Fijos y Recurrentes
* En la pestaña **"Ingresos Fijos"** puedes programar cobros periódicos como tu salario quincenal o rentas mensuales.
* Ofrece los mismos controles de activación con interruptor *Switch*, frecuencias quincenales/mensuales y modo automático al vencer.

---

## 6. Módulo de Metas de Ahorro

Accede desde el menú superior pulsando **Metas**.

Las metas te permiten separar dinero mental y financieramente para objetivos específicos (un viaje, comprar un auto, fondo de emergencias, etc.).

### Creación de una Nueva Meta
1. Pulsa en **"+ Nueva Meta"**.
2. Rellena los datos:
   * **Nombre de la Meta**: Ej. *"Vacaciones en Cancún"*, *"Prima del Carro"*.
   * **Monto Objetivo**: La cantidad total que necesitas alcanzar.
   * **Monto Inicial**: Si ya tienes algún dinero reservado para este fin.
   * **Fecha Límite (*Deadline*)**: La fecha en la que planeas haber completado el ahorro.
   * **Categoría**: Clasificación general del objetivo.
3. Haz clic en **"Crear Meta"**.

### Cómo Realizar Aportes a una Meta
Cuando dispongas de dinero para ahorrar:
1. En la tarjeta de la meta correspondiente, haz clic en el botón **"+ Aportar"** (o ícono de alcancía/billetera).
2. Ingresa la cantidad que deseas aportar hoy.
3. El sistema realizará dos acciones simultáneas con total consistencia:
   * Sumará el monto al avance de la meta y actualizará su porcentaje de cumplimiento.
   * Creará automáticamente un registro en tus gastos categorizado como `Metas: Aporte a meta: [Nombre de la meta]` para que tu saldo en el panel principal coincida con la realidad de tu bolsillo.

### Retiro de Fondos y Cumplimiento
* Si necesitas utilizar parte del dinero guardado en una meta antes de tiempo, puedes abrir el menú de la meta y seleccionar **"Retirar Fondos"**.
* Cuando alcances el 100% del monto objetivo, la meta se marcará con una insignia de completada y podrás archivarla o eliminarla con confirmación.

---

## 7. Módulo de Reportes y Libro Contable

Accede desde el menú superior pulsando **Reportes**.

Diseñado para contabilidad personal, declaraciones tributarias o revisiones periódicas con un formato limpio y profesional.

### Filtros de Tiempo y Rangos Personalizados
En la barra de herramientas superior dispones de filtros predefinidos:
* **Este Mes**
* **Mes Anterior**
* **Últimos 30 Días**
* **Este Año**
* **Todo el Tiempo**
* **Rango Personalizado**: Abre un calendario interactivo para elegir libremente la fecha inicial y la fecha final del reporte.

### Exportación a PDF / Imprimir
1. Configura el rango de fechas deseado.
2. Haz clic en el botón **"Imprimir / PDF"**.
3. El sistema activará el asistente de impresión del navegador con estilos optimizados:
   * Se ocultan automáticamente barras de navegación, botones y elementos no imprimibles.
   * Se incluye el membrete formal de FinTrack, fecha de emisión, totales de ingresos, gastos, balance neto y el desglose contable ordenado.
4. En el destino de impresión de tu navegador, selecciona **"Guardar como PDF"** para obtener un documento digital listo para archivar o enviar por correo.

### Exportación a Excel (.xlsx) y CSV
* **Botón Excel (.xlsx)**: Genera una hoja de cálculo con fórmulas nativas, celdas formateadas en moneda y encabezados destacados, lista para abrir en Microsoft Excel, Google Sheets o LibreOffice.
* **Botón CSV**: Descarga un archivo de texto separado por comas estándar para procesar en herramientas de analítica o bases de datos.

---

## 8. Administración de Categorías Personalizadas

FinTrack no te limita a categorías fijas; puedes crear tantas categorías como requiera tu estilo de vida.

### Crear una Categoría con Color Identificador
1. En el módulo de **Gastos** o de **Ingresos**, haz clic en el botón con ícono de etiqueta **"Categorías"** (o selecciona *"Añadir nueva categoría..."* en los selectores).
2. Se abrirá la ventana de **Administrar Categorías**.
3. Pulsa **"Añadir categoría de gasto"** (o de ingreso).
4. Escribe el nombre (ej. *"Gimnasio"*, *"Veterinaria"*, *"Educación"*).
5. Selecciona uno de los **8 colores vibrantes** disponibles:
   * Azul (`blue`)
   * Esmeralda (`emerald`)
   * Púrpura (`purple`)
   * Ámbar (`amber`)
   * Rosa (`rose`)
   * Cian (`cyan`)
   * Índigo (`indigo`)
   * Gris (`slate`)
6. Guarda la categoría.

### Persistencia Total del Color
El color seleccionado se reflejará de forma unificada en:
* Las etiquetas e insignias de las tablas principales.
* Los filtros desplegables de búsqueda.
* Los paneles de detalle de cada transacción.
* Las rebanadas del gráfico de pastel/dona del panel de resumen.
* Las tarjetas del carrusel de transacciones recientes.

### Eliminación Segura y Reasignación
Para proteger la integridad de tus finanzas:
* Si intentas eliminar una categoría que **ya está asignada a transacciones existentes**, FinTrack detectará el conflicto y te avisará cuántas transacciones están vinculadas.
* Te ofrecerá la opción de **"Reasignar a 'Otros' y Eliminar"**, garantizando que ninguna transacción quede huérfana ni se alteren tus balances históricos.

---

## 9. Solución de Problemas Frecuentes

| Situación | Causa Común | Solución Recomendada |
| :--- | :--- | :--- |
| **Los montos no cargan al abrir una página** | El servidor en la nube (Render) entra en suspensión tras inactividad en planes gratuitos. | Espera unos 15 a 30 segundos en la pantalla de carga. Si persiste, pulsa el botón *"Reintentar conexión"* en pantalla. |
| **No veo las alertas o notificaciones** | Están ubicadas en la esquina superior derecha. | Verifica que no tengas extensiones del navegador bloqueando popups. FinTrack muestra alertas *Toast* limpias arriba a la derecha. |
| **Un gasto fijo no se aplicó automáticamente** | El switch del gasto fijo está en estado *Pausado*. | Ingresa a Gastos > Gastos Fijos y asegúrate de que el switch esté encendido (azul/verde) y que el modo esté en *Automático*. |
| **La fecha de quincena parecía adelantada** | Diferencia horaria entre el servidor en la nube (UTC) y tu país. | Ya solucionado en la versión actual: el sistema utiliza siempre la fecha local de tu navegador (`client_date`) y zona `UTC-6`. |
| **Deseo cambiar de Colones a Dólares** | Configuración de moneda por defecto. | En el menú superior o de configuración, pulsa el selector de moneda y selecciona `USD ($)`. Toda la plataforma convertirá la simbología de inmediato. |

---

*Manual elaborado para el equipo y usuarios de FinTrack. Versión Web 1.0.*
