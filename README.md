# Matcha

Full Stack Matcha dating app

## Quick Start for Production

This will build the frontend to the `frontend/react-app/dist` folder and start the backend server.
The backend serves the static files from the `frontend/react-app/dist` folder.
It is accessible at `http://localhost:3000`.
With this approach, life reload for the frontend is not supported. You will have to rebuild the frontend to see changes.


1. Build the fornend
```bash
cd frontend/react-app
npm install
npm run build
````

2. Start the backend

```bash
cd backend/express-server
npm install
npm run dev
```

## Quick Start for Development

This will start the frontend and backend seperately so that you can take advantage of hot reloading for the frontend and backend.
The backend is accessible at `http://localhost:3000`. The frontend is accessible at `http://localhost:5173`.

1. Start the frontend

```bash
cd frontend/react-app
npm install
npm run dev
```

2. Start the backend

```bash
cd backend/express-server
npm install
npm run dev
```

## Frontend

The frontend is built with React and is located in the `frontend/react-app` folder.
React Router is used for routing which is client-side routing.
All routes are defined in the `frontend/react-app/src/routes` folder.
The frontend is accessible at `http://localhost:3000`.

## Backend

The backend is built with Express and is located in the `backend/express-server` folder.
All API routes are prefixed with `/api`.
They are defined in the `backend/express-server/routes/api.js` folder.
The backend is accessible at `http://localhost:3000/api`.

## Database

The database is a PostgreSQL database.
It's hosted on Supabase but you can use any PostgreSQL database. Just update .env file in the backend folder with your database credentials.


## Example .env file for the backend

Place this in `backend/express-server/.env` file.

```bash
## Database
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_MAX=your_database_connection_limit

## Mail
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=your_sender_name

## JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=your_jwt_expiration
JWT_ISSUER=your_jwt_issuer
JWT_AUDIENCE=your_jwt_audience
```
