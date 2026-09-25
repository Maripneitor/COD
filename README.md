# NexusCOD - Center of Data Vault

NexusCOD es una plataforma de gestión avanzada diseñada para organizar, editar y copiar rápidamente sistemas de clases y códigos jerárquicos (Modos > Clases > Objetos > Códigos). Cuenta con un diseño moderno "Glassmorphism" y permite edición en línea en tiempo real, respaldada por una API robusta y una base de datos.

## 🚀 Características Principales

*   **Edición en Línea (Inline Editing):** Haz doble clic en el nombre de cualquier Modo, Clase, Objeto o Código para editarlo en tiempo real. Los cambios se guardan instantáneamente en la base de datos.
*   **Interfaz Premium:** Diseño moderno utilizando Tailwind CSS con efectos Glassmorphism, desenfoque (blur) de fondo, luces de neón y animaciones fluidas.
*   **Búsqueda Rápida:** Filtra instantáneamente las clases, objetos y códigos escribiendo en la barra de búsqueda.
*   **Copiado Rápido:** Copia códigos compuestos (Ej: `Motor-A1B2C3D4E5`) al portapapeles con un solo clic.
*   **Soporte Multi-Base de Datos:** El backend está configurado para conectarse tanto a **MongoDB (Atlas)** como a **PostgreSQL**, utilizando el Patrón de Repositorio (Repository Pattern) para intercambiar de controlador según la configuración.

## 🛠️ Tecnologías

### Frontend
*   **React** (Vite)
*   **TypeScript**
*   **Tailwind CSS v4** (Utilidades de diseño, Glassmorphism, gradientes)
*   **Lucide Icons** (Si se integran en el futuro)

### Backend
*   **Node.js & Express** (REST API)
*   **TypeScript** (Ejecutado con `tsx`)
*   **Mongoose** (Controlador para MongoDB)
*   **pg** (Controlador para PostgreSQL)
*   **dotenv** (Gestión de variables de entorno)

## 📁 Estructura del Proyecto

El proyecto está dividido en un monorepositorio:

```text
COD-Classes/
├── backend/                  # API REST
│   ├── src/
│   │   ├── config/           # Conexiones a DB (mongo.ts, postgres.ts)
│   │   ├── repositories/     # Patrón Repositorio (Factory, Mongo, PG)
│   │   ├── types/            # Interfaces de TypeScript compartidas
│   │   └── server.ts         # Endpoints y configuración de Express
│   ├── .env                  # Credenciales de base de datos
│   └── package.json          # Dependencias y scripts (npm run dev)
│
└── frontend/                 # Aplicación React
    ├── src/
    │   ├── components/       # Componentes UI (CodManager, InlineEditable)
    │   ├── App.tsx           # Componente Raíz
    │   ├── main.tsx          # Punto de entrada
    │   └── index.css         # Estilos globales y Tailwind
    └── package.json          # Dependencias y scripts (npm run dev)
```

## ⚙️ Instalación y Uso Local

Sigue estos pasos para arrancar el proyecto en tu entorno local.

### 1. Configurar y arrancar el Backend

Abre una terminal y navega a la carpeta `backend`:

```bash
cd backend
npm install
```

Configura tus credenciales. Crea un archivo `.env` en la carpeta `backend/` si no existe:
```env
PORT=3001
DB_DRIVER=mongodb # Cambiar a 'postgres' para usar PostgreSQL

# --- MongoDB ---
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/nexuscod

# --- PostgreSQL ---
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=cod_db
PG_PASSWORD=tu_password
PG_PORT=5432
```

Inicia el servidor en modo desarrollo:
```bash
npm run dev
```

*(Opcional)*: Si tu base de datos MongoDB está vacía, puedes usar el botón **"Rellenar con Datos de Prueba"** en la interfaz para añadir datos simulados.

### 2. Configurar y arrancar el Frontend

Abre **otra** terminal y navega a la carpeta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Abre tu navegador en el enlace que te indica Vite (generalmente `http://localhost:5173`).

## ✏️ ¿Cómo usar la interfaz?

1.  **Navegación:** Usa la barra lateral izquierda para seleccionar los diferentes Modos.
2.  **Filtrado:** Usa el buscador superior para encontrar clases, objetos o códigos específicos.
3.  **Edición:** Da **doble clic** sobre cualquier texto blanco o cian (nombre del modo, título de la clase, nombre del código o su valor alfanumérico) para editarlo. Presiona `Enter` para guardar.
4.  **Copiar:** Pasa el cursor por encima del código (Ej: `Motor - A1B2C...`) para revelar el botón `COPIAR`.

## 🤝 Contribuciones y Evolución
Este sistema está diseñado para ser la base de una plataforma de gestión documental robusta y puede ser fácilmente desplegado en servicios gratuitos como Render (Backend) y Vercel (Frontend), usando MongoDB Atlas como alojamiento en la nube.
