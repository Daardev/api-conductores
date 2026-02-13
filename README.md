# API con Express + PostgreSQL: Conductores y Automoviles

Documentacion minima del proyecto del ejercicio.

## Requisitos

- Node.js
- PostgreSQL
- Base de datos cargada con `actividad2.sql`

## Variables de entorno

Crear un archivo `.env` en la raiz:

```env
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=api_conductores
PGUSER=postgres
PGPASSWORD=tu_password
```

Opcional (si el frontend corre en otro puerto):

```env
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

## Instalacion y ejecucion

```bash
npm install
npm start
```

Servidor: `http://localhost:3000`

Frontend: `http://localhost:3000/`

## Endpoints

- `GET /conductores`
- `GET /automóviles`
- `GET /conductoressinauto?edad=<numero>`
- `GET /solitos`
- `GET /auto?patente=<string>`
- `GET /auto?iniciopatente=<letra>`

Respuestas en JSON.  
Codigos usados: `200`, `400`, `404`, `500`.

## Estructura minima

- `index.js`: servidor Express + consultas SQL
- `actividad2.sql`: esquema y datos
- `docs/index.html`: interfaz cliente
- `docs/styles.css`: estilos
- `docs/app.js`: consumo de endpoints
