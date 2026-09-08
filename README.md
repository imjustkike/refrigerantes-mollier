# Diagramas Termodinámicos de Refrigerantes (log(p)–h Mollier)

Aplicación de escritorio profesional en español desarrollada con **React 19**, **TypeScript**, **Tauri 2** y motor termodinámico nativo en **Rust + CoolProp 8.0** para la consulta de diagramas Mollier, trazado de ciclos frigoríficos, cálculo riguroso de propiedades de estado y procesos termodinámicos.

---

## 🚀 Características Principales

- **Diagrama log(p)–h Interactivo Vectorial**:
  - Eje de presiones en escala logarítmica ($P\ [\text{bar(a)}]$) y entalpía lineal ($h\ [\text{kJ/kg}]$).
  - Campana de saturación con líneas de líquido ($Q=0$) y vapor ($Q=1$).
  - Familias activables de curvas: Isotermas ($T$), Isentrópicas ($s$), Isócoras ($v$) y Líneas de título de vapor ($x = 10\% \dots 90\%$).
  - Zoom con rueda del ratón, paneo fluido y botón de ajuste automático al dominio del refrigerante.
  - Inspector de cursor en tiempo real mostrando $(P, T, h, s, v, \text{fase})$ en cualquier posición.

- **Cálculo Termodinámico Riguroso (CoolProp 8.0 Nativo)**:
  - Presión en **$\text{bar(a)}$**, Entalpía en **$\text{kJ/kg}$**, Volumen específico en **$\text{m}^3/\text{kg}$** ($v = 1/\rho$), Temperatura en **$^\circ\text{C}$**, Entropía en **$\text{kJ/(kg}\cdot\text{K)}$**, Densidad en **$\text{kg/m}^3$**.
  - Soporte para fluidos puros, mezclas zeotrópicas con deslizamiento de temperatura (glide) y estados supercríticos ($\text{CO}_2$ / R744).
  - Validación de indeterminaciones (p. ej. en saturación pura donde $P$ y $T$ están acopladas).

- **Gestión de Puntos y Ciclos Frigoríficos**:
  - Creación por clic sobre el diagrama o por formulario numérico ($P\text{-}h, P\text{-}T, P\text{-}s, P\text{-}Q, T\text{-}Q, P\text{-}v$).
  - Arrastre interactivo de puntos con actualización dinámica.
  - Etiquetas visibles en el gráfico con $T$, $h$, $v$ y $P$ con desplazamiento manual independiente.
  - Trazado de procesos y ciclos cerrados con cálculo de $\Delta h$ ($q$ o $w$), $\Delta T$, $\Delta P$ y $\Delta s$.
  - 4 ciclos frigoríficos de ejemplo integrados (R134a estándar, R744 transcrítico, R717 amoníaco industrial y R407C con glide).

- **Guardado y Exportación**:
  - Guardar y abrir proyectos en JSON versionado (`.mollier.json`).
  - Exportación de la tabla de puntos a CSV con unidades normalizadas.
  - Exportación de la gráfica a PNG de alta resolución con título, ejes, curvas, puntos y etiquetas.

---

## 🏛️ Decisiones de Arquitectura

### Elección del Backend: Rust Nativo FFI (`coolprop-sys`) vs Python
Se ha implementado una integración **nativa directa en Rust mediante FFI C (`coolprop-sys 8.0.0`)**:
1. **Rendimiento extremo**: Los cálculos de estado se resuelven en microsegundos y la generación de mallas de curvas completas toma menos de 25 ms mediante paralelización con `Rayon`.
2. **Distribución 100% autónoma y sin dependencias**: A diferencia de soluciones basadas en Python (que requieren empaquetar un runtime de ~100 MB mediante PyInstaller o venv, aumentando el riesgo de fallos de arranque en el cliente), el ejecutable Tauri es un binario nativo compilado de tamaño mínimo que funciona offline en cualquier equipo.
3. **Seguridad y sincronización de memoria**: Se utiliza la frontera de sincronización de `CoolPropLib` para garantizar llamadas concurrentes seguras desde el pool de subprocesos.

---

## 📊 Matriz de Cobertura de Refrigerantes (CoolProp 8.0)

| Grupo | Refrigerante | Identificador Motor | Estado | Tipo / Notas Termodinámicas |
|---|---|---|---|---|
| **Naturales** | R717 (Amoníaco) | `R717` | ✅ Disponible | Puro natural ($T_c = 132.41\ ^\circ\text{C}, P_c = 113.33\ \text{bar}$) |
| | R744 ($\text{CO}_2$) | `R744` | ✅ Disponible | Puro natural ($T_c = 30.98\ ^\circ\text{C}, P_c = 73.77\ \text{bar}$) |
| | R290 (Propano) | `R290` | ✅ Disponible | Hidrocarburo puro ($T_c = 96.74\ ^\circ\text{C}, P_c = 42.51\ \text{bar}$) |
| | R600a (Isobutano) | `R600a` | ✅ Disponible | Hidrocarburo puro ($T_c = 134.66\ ^\circ\text{C}, P_c = 36.29\ \text{bar}$) |
| | R600 (Butano) | `R600` | ✅ Disponible | Hidrocarburo puro ($T_c = 151.98\ ^\circ\text{C}, P_c = 37.96\ \text{bar}$) |
| | R1270 (Propileno) | `R1270` | ✅ Disponible | Hidrocarburo puro ($T_c = 91.06\ ^\circ\text{C}, P_c = 45.55\ \text{bar}$) |
| **HFC y mezclas** | R134a | `R134a` | ✅ Disponible | HFC puro ($T_c = 101.06\ ^\circ\text{C}, P_c = 40.59\ \text{bar}$) |
| | R32 | `R32` | ✅ Disponible | HFC puro ($T_c = 78.11\ ^\circ\text{C}, P_c = 57.82\ \text{bar}$) |
| | R125 | `R125` | ✅ Disponible | HFC puro ($T_c = 66.03\ ^\circ\text{C}, P_c = 36.18\ \text{bar}$) |
| | R143a | `R143a` | ✅ Disponible | HFC puro ($T_c = 72.71\ ^\circ\text{C}, P_c = 37.61\ \text{bar}$) |
| | R152a | `R152a` | ✅ Disponible | HFC puro ($T_c = 113.26\ ^\circ\text{C}, P_c = 45.20\ \text{bar}$) |
| | R404A | `R404A` | ✅ Disponible | Mezcla casi azeotrópica ($T_c = 72.12\ ^\circ\text{C}, P_c = 37.32\ \text{bar}$) |
| | R407A | `R407A.mix` | ✅ Disponible | Mezcla zeotrópica con glide ($T_c = 82.25\ ^\circ\text{C}$) |
| | R407C | `R407C` | ✅ Disponible | Mezcla zeotrópica con glide ($T_c = 86.20\ ^\circ\text{C}, P_c = 46.32\ \text{bar}$) |
| | R407F | - | ❌ No disponible | No parametrizado en CoolProp estándar sin REFPROP |
| | R410A | `R410A` | ✅ Disponible | Mezcla casi azeotrópica ($T_c = 71.34\ ^\circ\text{C}, P_c = 49.01\ \text{bar}$) |
| | R507A | `R507A` | ✅ Disponible | Mezcla azeotrópica ($T_c = 70.61\ ^\circ\text{C}, P_c = 37.05\ \text{bar}$) |
| **HFO y bajo GWP** | R1234yf | `R1234yf` | ✅ Disponible | HFO puro ($T_c = 94.70\ ^\circ\text{C}, P_c = 33.82\ \text{bar}$) |
| | R1234ze(E) | `R1234ze(E)` | ✅ Disponible | HFO puro ($T_c = 109.36\ ^\circ\text{C}, P_c = 36.35\ \text{bar}$) |
| | R1233zd(E) | `R1233zd(E)` | ✅ Disponible | HFO puro ($T_c = 165.71\ ^\circ\text{C}, P_c = 35.71\ \text{bar}$) |
| | R448A / R449A | - | ❌ No disponible | Requiere biblioteca REFPROP |
| | R450A | `R450A.mix` | ✅ Disponible | Mezcla zeotrópica ($T_c = 105.38\ ^\circ\text{C}$) |
| | R452A / R454B | - | ❌ No disponible | Requiere biblioteca REFPROP |
| | R454C | `R454C.mix` | ✅ Disponible | Mezcla zeotrópica ($T_c = 87.64\ ^\circ\text{C}$) |
| | R455A / R513A | - | ❌ No disponible | Requiere biblioteca REFPROP |
| **Históricos** | R22 | `R22` | ✅ Disponible | HCFC puro ($T_c = 96.15\ ^\circ\text{C}, P_c = 49.90\ \text{bar}$) |
| | R23 | `R23` | ✅ Disponible | HFC ultra baja T ($T_c = 26.14\ ^\circ\text{C}, P_c = 48.32\ \text{bar}$) |
| | R123 | `R123` | ✅ Disponible | HCFC puro ($T_c = 183.68\ ^\circ\text{C}, P_c = 36.62\ \text{bar}$) |
| | R124 | `R124` | ✅ Disponible | HCFC puro ($T_c = 122.28\ ^\circ\text{C}, P_c = 36.24\ \text{bar}$) |
| | R12 | `R12` | ✅ Disponible | CFC histórico ($T_c = 111.97\ ^\circ\text{C}, P_c = 41.36\ \text{bar}$) |
| | R502 | - | ❌ No disponible | Requiere biblioteca REFPROP |

---

## 🛠️ Instrucciones de Instalación y Ejecución

### Requisitos Previos
- **Node.js**: v18 o superior (`npm`)
- **Rust toolchain**: `cargo` y `rustc` instalados (`rustup`)

### Desarrollo Local
1. Instalar dependencias del frontend:
   ```bash
   npm install
   ```
2. Ejecutar la aplicación en modo desarrollo (Tauri + Vite hot-reload):
   ```bash
   npm run tauri dev
   ```

### Pruebas Unitarias de Termodinámica (Rust)
Para ejecutar la suite de pruebas unitarias que verifican propiedades termodinámicas reales, fluidos puros, mezclas, $\text{CO}_2$ supercrítico y $v = 1/\rho$:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### Empaquetado y Generación del Instalador de Producción
Para generar el ejecutable e instalador de escritorio nativo:
```bash
npm run tauri build
```
Los instaladores generados se ubicarán en `src-tauri/target/release/bundle/`.
