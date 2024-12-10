# Matcha

Full Stack Matcha dating app

## Check out the documentation
[Documentation](https://matcha-ashen.vercel.app)

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
# development@v2

## Host
PROTOCOL=http
HOST=mockhost
PORT=1234
BASE_URL=http://mockhost:1234

## Database
DB_HOST=mock-db-host.database.com
DB_PORT=1234
DB_NAME=mockdb
DB_USER=mockuser
DB_PASSWORD=mockpassword
DB_MAX=10

## Mail
BREVO_API_KEY=xkeysib-mockapikey1234567890abcdef1234567890abcdef1234567890abcdef12345678
BREVO_SENDER_EMAIL=mockemail@mockdomain.com
BREVO_SENDER_NAME=MockName

EMAIL_VERIFICATION=true

DEFAULT_FILTER=true
DEFAULT_SORT=false

# JWT
JWT_SECRET=mocksecret
JWT_EXPIRES_IN=2d
JWT_ISSUER=mockapp
JWT_AUDIENCE=mockapp
JWT_EXPIRES_IN=15

# Cookie Parser
COOKIE_SECRET=mockcookiesecret

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstu123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-mockgoogleclientsecret

# Facebook OAuth
FACEBOOK_CLIENT_ID=9876543210987654
FACEBOOK_CLIENT_SECRET=mockfacebookclientsecret
```
