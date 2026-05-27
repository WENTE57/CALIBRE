# Calibre Desktop (Comida Rápida)

Este proyecto es una aplicación de escritorio nativa desarrollada con **React (Vite)** para la interfaz visual y **Node.js (Express)** para el servidor backend, todo empaquetado mediante **Electron**. Está diseñada para administrar el sistema de un local de comida rápida.

La base de datos utilizada es **PostgreSQL**.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada. Probado en v25.2.1)
- [PostgreSQL](https://www.postgresql.org/) corriendo localmente.

---

## 🚀 Guía de Configuración y Arranque

Cualquier desarrollador que clone este repositorio puede levantar el proyecto en su máquina local siguiendo estos pasos:

### 1. Clonar el repositorio e instalar dependencias

Abre una consola e instala las dependencias de ambas carpetas:

```bash
# Instalar dependencias del Backend
cd backend
npm install

# Instalar dependencias del Frontend (y Electron)
cd ../frontend
npm install
```

### 2. Configurar la Base de Datos y Variables de Entorno

1. Abre PostgreSQL y crea una base de datos vacía llamada `calibre`:
   ```sql
   CREATE DATABASE calibre;
   ```
2. En la carpeta `backend`, duplica el archivo `.env.example` y renómbralo como `.env`:
   - En Windows/Linux puedes hacerlo manualmente o por consola:
     ```bash
     cp .env.example .env
     ```
3. Edita el archivo `.env` recién creado y coloca tu contraseña de PostgreSQL en la variable `DB_PASSWORD`:
   ```env
   DB_PASSWORD=tu_contraseña_aqui
   ```

### 3. Ejecutar las Migraciones (Crear tablas y semilla de usuario)

Para crear automáticamente la tabla de usuarios e insertar un usuario administrador de prueba sin necesidad de importar archivos SQL complejos, ejecuta el siguiente comando desde la carpeta `backend`:

```bash
cd backend
npm run db:setup
```

Esto creará automáticamente la tabla `usuarios` y registrará las siguientes credenciales de prueba:
* **Usuario:** `Juan Pérez`
* **Contraseña:** `mi_contrasena_segura`

---

## 💻 Ejecución en Modo de Desarrollo

Ya no es necesario levantar el backend y el frontend por separado en dos terminales. Electron se encarga de todo.

1. Navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Ejecuta el script de desarrollo de escritorio:
   ```bash
   npm run electron:dev
   ```

Este comando:
- Arrancará el servidor de desarrollo de Vite.
- Levantará de forma automática el servidor backend en segundo plano (puerto 5000).
- Abrirá la ventana nativa de escritorio de Electron cargando el login.

---

## 🔒 Seguridad en Git

Los archivos sensibles como `.env` (que contienen contraseñas de bases de datos) y carpetas pesadas como `node_modules` están protegidos por el archivo `.gitignore` en la raíz del proyecto para evitar que se suban accidentalmente a GitHub.
