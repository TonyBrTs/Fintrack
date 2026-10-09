# FinTrack — Design Direction & System

> **Documento de Identidad y Dirección Visual (R-37 antislop)**  
> Este documento establece el alma estética, personalidad, paleta, tipografía y reglas de artesanía de FinTrack para evitar estilos genéricos por defecto.

---

## 1. Identidad y Propósito

- **Producto:** FinTrack (Control Financiero y Patrimonial Personal).
- **Esencia:** Claridad contable, honestidad numérica y control sin fricción. No es un juego ni un casino de criptomonedas: es una herramienta seria para personas que quieren entender a dónde va su dinero.
- **Tono y Voz:** Directo, sobrio, respetuoso y centrado en la acción. Sin rodeos corporativos ni metáforas infladas de IA.

---

## 2. Tipografía y Números

- **Familia tipográfica principal:** `Inter`, `sans-serif` para interfaces, encabezados y navegación.
- **Números y Datos Contables:** Tipografía monospace con cifras tabulares (`font-mono` / `tabular-nums`) para montos, referencias seriales, fechas ISO y hashes de auditoría. Permite alinear columnas contables con precisión milimétrica.
- **Escala de Jerarquía:**
  - `Display / KPI`: `text-2xl` a `text-3xl font-extrabold`
  - `Títulos de sección`: `text-sm` a `text-base font-bold text-foreground`
  - `Cuerpo de datos`: `text-xs` a `text-sm font-medium`
  - `Etiquetas auxiliares / Metadatos`: `text-[10px]` a `text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`

---

## 3. Paleta Cromática Intencional

FinTrack utiliza una paleta contenida donde cada color tiene un rol semántico inmutable:

| Rol Semántico | Claro (Light) | Oscuro (Dark) | Propósito |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `#F8FAFC` (`slate-50`) | `#060911` / Deep Slate | Superficie base de baja fatiga visual |
| **Superficie de Tarjetas** | `#FFFFFF` (`white`) | `#0B101D` / Card dark | Contenedores de KPIs y transacciones |
| **Bordes y Delimitadores** | `slate-200/80` | `slate-800/70` | Definición sutil sin saturar la vista |
| **Acción Primaria** | Blue 600 (`#2563EB`) | Blue 500 (`#3B82F6`) | Botones de guardado, submit y llamadas de acción |
| **Ingresos / Positivo** | Emerald 600 (`#059669`) | Emerald 400 (`#34D399`) | Entradas de dinero, ahorro y metas alcanzadas |
| **Gastos / Pasivos** | Rose 600 (`#E11D48`) | Rose 400 (`#FB7185`) | Salidas de capital, pagos y deudas |
| **Alertas / Advertencia** | Amber 600 (`#D97706`) | Amber 400 (`#FBBF24`) | Vencimientos cercanos y umbrales de presupuesto |

---

## 4. Reglas de Artesanía e Iconografía (Anti-Slop Locks)

1. **Sin íconos decorativos o de IA:** Se prohíbe el uso de `Sparkles` como relleno mágico. Los íconos deben comunicar función financiera real (`ArrowDownRight`, `ArrowUpRight`, `Wallet`, `Target`, `ShieldCheck`).
2. **Contraste Mínimo WCAG AA (4.5:1):** Queda prohibido el uso de `text-slate-400` sobre fondos blancos. Los textos secundarios en tema claro deben usar como mínimo `text-slate-600` o tokens semánticos contrastados (`text-muted-foreground`).
3. **Objetivos Táctiles Ergonómicos:** En dispositivos móviles, todo elemento interactivo (botones de acción, eliminar, cerrar, alternar) debe ofrecer un área táctil mínima de 44x44px (`min-h-[44px]` o padding ergonómico con `touch-manipulation`).
4. **Puntualidad en Copys:** No utilizar guiones largos em dash (`—`) en textos y resúmenes. Usar signos de puntuación naturales (`:`, `-`, `,`).
5. **Comentarios de Código con Alta Razón Señal/Ruido:** Prohibidos banners ASCII decorativos o comentarios que simplemente parafrasean la siguiente línea de código.
