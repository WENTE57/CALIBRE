# 🍔 Calibre Desktop — Food System

Este proyecto es una aplicación de escritorio nativa diseñada y desarrollada para administrar el sistema de un local de comida rápida. Está construida usando una arquitectura integrada por **React (Vite)** para el frontend, **Node.js (Express)** para el servidor backend, **SQLite** para la persistencia de datos local y ultraligera, y **Electron** como el entorno de ejecución de escritorio nativo.

La aplicación destaca por su diseño premium y adaptable, que incluye soporte tanto para un tema claro (con tonos cálidos y elegantes) como para un tema oscuro (estilo Obsidian, con tonos café y acentos naranjas), los cuales pueden alternarse en tiempo real mediante un interruptor de tema flotante de alta fidelidad visual.

---

## ✨ Características Principales

*   **Autenticación y Roles:** Sistema de login seguro con roles diferenciados (ej. Administrador y Empleado).
*   **Gestión Dinámica de Categorías (CRUD):** Creación, edición y eliminación de categorías en tiempo real. La eliminación de categorías reasigna de manera segura los productos a la categoría por defecto (`Otros`).
*   **Catálogo de Productos y Recetas:** Registro completo de productos con nombre, precio, emoji representativo, categoría e ingredientes asociados indicando la cantidad exacta requerida.
*   **Inventario de Ingredientes:** Control del stock y almacenamiento de ingredientes de cocina individuales.
*   **Registro de Pedidos (Comandas):** Flujo de venta que registra transaccionalmente el ticket en la base de datos vinculando múltiples productos, cantidades, el empleado que atiende y el total.
*   **Descuento Automático de Stock:** Al registrar una venta, el backend calcula la receta de cada producto y descuenta automáticamente los ingredientes consumidos de la tabla de inventario.
*   **Insignias de Entrega y Notas:** Soporte para elegir tipo de entrega (**Para Servir** / **Para Llevar**) mediante botones modernos y agregar notas opcionales para cocina (ej. *"sin cebolla"*).
*   **Comanda en Pantalla e Impresión de Tickets:** Visualización interactiva que simula un ticket de compra de impresora térmica detallando cliente, local ("Calibre 25"), número de ticket, fecha/hora, tabla de productos con subtotales, empleado, nota y el total, con soporte para impresoras térmicas POS (Sewoo / ESC-POS).
*   **Historial de Pedidos Simplificado:** Panel administrativo interactivo para listar todos los tickets registrados mostrando solo su número, fecha/hora y entrega. Al hacer clic sobre cualquier ticket se despliega la comanda detallada en pantalla.
*   **Reportes y Exportación:** Generación y envío de reportes de cierre/ventas por correo electrónico y exportación a Excel.
*   **Diálogos e Interfaces Modales Premium:** Sistema de alertas y confirmaciones integrado en React que sustituye por completo los diálogos nativos del sistema, solucionando los problemas de bloqueo de foco en el cliente de Electron en sistemas Windows.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
*   [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada).
*   No requiere instalar gestores de bases de datos externos; el sistema funciona con **SQLite** embebido de manera autónoma.

---

## 🚀 Guía de Configuración y Arranque

Sigue estos sencillos pasos para levantar el proyecto en tu máquina local:

### 1. Clonar el repositorio e instalar dependencias

Clona este repositorio en tu sistema e instala las dependencias:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd CALIBRE

# 2. Instalar todas las dependencias (Backend y Frontend)
npm run install:all
```

*(Alternativamente puedes instalar de forma manual ingresando a cada carpeta: `cd backend && npm install` y luego `cd ../frontend && npm install`).*

### 2. Configurar la Base de Datos y Semillas

Para inicializar la base de datos SQLite y cargar los datos iniciales de prueba (usuarios, categorías base, ingredientes y recetas), ejecuta:

```bash
cd backend
npm run db:setup
```

Esto generará automáticamente:
*   El archivo de base de datos `backend/database.sqlite`.
*   Las tablas: `usuarios`, `categorias`, `productos`, `ingredientes`, `producto_ingredientes`, `pedidos` y `pedido_productos`.
*   El **Usuario Administrador por defecto**:
    *   **Usuario:** `Juan Perez`
    *   **Contraseña:** `123456`
*   Categorías iniciales (`General`, `Acompañamientos`, `Bebestibles`, `Otros`).
*   Ingredientes semilla (Pan, Carne de Res, Queso Cheddar, etc.).
*   Productos base con sus recetas asociadas.

---

## 💻 Ejecución en Modo de Desarrollo

Para iniciar el flujo de desarrollo integrado (servidores + cliente de escritorio):

```bash
# Desde la raíz del proyecto:
npm start

# O directamente desde la carpeta frontend:
cd frontend
npm run electron:dev
```

Este comando automatizado:
1. Inicia el servidor de desarrollo de Vite para el Frontend (`http://127.0.0.1:5173`).
2. Levanta el servidor Express del Backend en segundo plano (puerto `5000`).
3. Abre el contenedor de escritorio nativo de **Electron** conectado en tiempo real.

---

## 📦 Compilación y Generación del Ejecutable (.exe)

Puedes empaquetar la aplicación completa como un ejecutable autónomo para Windows utilizando **electron-builder**:

```bash
# Desde la raíz del proyecto:
npm run build:exe

# O desde la carpeta frontend:
cd frontend
npm run build:exe
```

### ¿Dónde queda el ejecutable?
Al finalizar la compilación, encontrarás los binarios listos en:
```text
frontend/dist-electron/win-unpacked/
└── Calibre Desktop.exe
```

> [!IMPORTANT]
> **Exclusión en Git:** La carpeta `dist-electron/` (y la carpeta `dist/`) contiene los binarios empaquetados de Electron, Chromium y Node.js, superando los 200 MB de tamaño. Esta carpeta está explícitamente ignorada en `.gitignore` y **no debe subirse al repositorio Git**. Cualquier miembro del equipo puede generar el instalador o ejecutable localmente en segundos con el comando `npm run build:exe`.

---

## 🔒 Estructura y Seguridad en Git

*   **Exclusión de Ejecutables y Compilaciones:** Las carpetas `dist-electron/` y `dist/`, así como cualquier binario (`*.exe`, `*.zip`, `*.msi`, etc.), están ignoradas en el `.gitignore` para mantener el repositorio ligero y limpio.
*   **Exclusión de Base de Datos Local:** Los archivos de base de datos SQLite (`database.sqlite`, `*.db`) se mantienen fuera del repositorio para evitar sobreescribir datos operativos entre desarrolladores.
*   **Exclusión de Datos Sensibles:** Los archivos `.env` locales (que guardan credenciales de correo o puertos) están protegidos mediante el archivo `.gitignore`. **Nunca** deben ser subidos al repositorio público.
*   **Exclusión de Dependencias:** Las carpetas `node_modules/` de todas las secciones del proyecto están debidamente ignoradas. Cada desarrollador las descarga localmente con `npm run install:all`.
