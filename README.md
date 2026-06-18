# 🍔 Calibre Desktop — Food System

Este proyecto es una aplicación de escritorio nativa diseñada y desarrollada para administrar el sistema de un local de comida rápida. Está construida usando una arquitectura integrada por **React (Vite)** para el frontend, **Node.js (Express)** para el servidor backend, **PostgreSQL** para la persistencia de datos y **Electron** como el entorno de ejecución de escritorio nativo.

La aplicación destaca por su diseño premium y adaptable, que incluye soporte tanto para un tema claro (con tonos cálidos y elegantes) como para un tema oscuro (estilo Obsidian, con tonos café y acentos naranjas), los cuales pueden alternarse en tiempo real mediante un interruptor de tema flotante de alta fidelidad visual.

---

## ✨ Características Principales

*   **Autenticación y Roles:** Sistema de login seguro con roles diferenciados (ej. Administrador).
*   **Gestión Dinámica de Categorías (CRUD):** Creación, edición y eliminación de categorías en tiempo real. La eliminación de categorías reasigna de manera segura los productos a la categoría por defecto (`Otros`).
*   **Catálogo de Productos y Recetas:** Registro completo de productos con nombre, precio, emoji representativo, categoría e ingredientes asociados indicando la cantidad exacta requerida.
*   **Inventario de Ingredientes:** Control del stock y almacenamiento de ingredientes de cocina individuales.
*   **Registro de Pedidos (Comandas):** Flujo de venta que registra transaccionalmente el ticket en la base de datos vinculando múltiples productos, cantidades, el empleado que atiende y el total.
*   **Descuento Automático de Stock:** Al registrar una venta, el backend calcula la receta de cada producto y descuenta automáticamente los ingredientes consumidos de la tabla de inventario.
*   **Insignias de Entrega y Notas:** Soporte para elegir tipo de entrega (**Para Servir** / **Para Llevar**) mediante botones en recuadros modernos y agregar notas opcionales para cocina (ej. *"sin cebolla"*).
*   **Comanda en Pantalla (Formato Ticket):** Visualización interactiva que simula un ticket de compra de impresora térmica detallando cliente, local ("Calibre 25"), número de ticket, fecha/hora, tabla de productos con subtotales, empleado, nota y el total.
*   **Historial de Pedidos Simplificado:** Panel administrativo interactivo para listar todos los tickets registrados mostrando solo su número, fecha/hora y entrega. Al hacer clic sobre cualquier ticket se despliega la comanda detallada en pantalla.
*   **Diálogos e Interfaces Modales Premium:** Sistema de alertas y confirmaciones integrado en React que sustituye por completo los diálogos nativos del sistema, solucionando los problemas de bloqueo de foco en el cliente de Electron en sistemas Windows.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
*   [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada. Probado en v25.2.1)
*   [PostgreSQL](https://www.postgresql.org/) con el servidor activo localmente.

---

## 🚀 Guía de Configuración y Arranque

Sigue estos sencillos pasos para levantar el proyecto en tu máquina local desde cero:

### 1. Clonar el repositorio e instalar dependencias

Clona este repositorio en tu sistema y luego ingresa a cada una de las carpetas para instalar las dependencias de Node:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd "proyecto calibre 25"

# 2. Instalar dependencias del Backend
cd backend
npm install

# 3. Instalar dependencias del Frontend
cd ../frontend
npm install
```

### 2. Configurar la Base de Datos y Entorno

1.  Abre tu terminal de PostgreSQL (o herramienta de administración como pgAdmin/DBeaver) y crea una base de datos vacía llamada `calibre`:
    ```sql
    CREATE DATABASE calibre;
    ```
2.  En la carpeta `backend`, duplica el archivo `.env.example` y renómbralo a `.env`:
    *   **Windows (PowerShell):**
        ```powershell
        copy .env.example .env
        ```
    *   **Linux/macOS/Git Bash:**
        ```bash
        cp .env.example .env
        ```
3.  Edita el archivo `backend/.env` y reemplaza los campos correspondientes a tu usuario y contraseña de PostgreSQL:
    ```env
    PORT=5000
    DB_USER=postgres
    DB_PASSWORD=tu_contraseña_aqui
    DB_HOST=localhost
    DB_PORT=5432
    DB_DATABASE=calibre
    ```

### 3. Ejecutar las Migraciones y Cargar Semillas

Para crear la estructura completa de tablas e insertar datos iniciales de prueba (usuarios, categorías base, ingredientes y recetas), ejecuta el siguiente script en la carpeta `backend`:

```bash
cd backend
npm run db:setup
```

Esto generará automáticamente:
*   Las tablas `usuarios`, `categorias`, `productos`, `ingredientes`, `producto_ingredientes`, `pedidos` y `pedido_productos`.
*   El **Usuario Administrador por defecto**:
    *   **Usuario:** `Juan Perez`
    *   **Contraseña:** `123456`
*   Categorías iniciales (`General`, `Acompañamientos`, `Bebestibles`, `Otros`).
*   Ingredientes semilla (Pan, Carne de Res, Queso Cheddar, etc.).
*   Productos base (con sus ingredientes correspondientes asociados).

---

## 💻 Ejecución en Modo de Desarrollo

Para iniciar el flujo de desarrollo integrado (servidores + cliente de escritorio), navega a la carpeta del frontend y arranca el entorno:

```bash
cd frontend
npm run electron:dev
```

Este comando automatizado:
1.  Inicia el servidor de desarrollo de Vite para el Frontend.
2.  Levanta el servidor Express del Backend en segundo plano (puerto `5000`).
3.  Abre el contenedor de escritorio nativo de **Electron** apuntando a la aplicación.

---

## 🔒 Estructura y Seguridad en Git

*   **Exclusión de Datos Sensibles:** Los archivos `.env` locales (que guardan contraseñas y accesos a bases de datos) están protegidos mediante el archivo `.gitignore` en la raíz del proyecto. **Nunca** deben ser subidos al repositorio público.
*   **Exclusión de Dependencias:** Las carpetas `node_modules/` de todas las secciones del proyecto están debidamente ignoradas. Cada desarrollador las descarga localmente con `npm install`.
*   **Portabilidad:** Toda configuración específica o base de datos local no es guardada físicamente en el repositorio Git. Toda la estructura y datos de partida se recrean dinámicamente usando el comando `npm run db:setup`.
