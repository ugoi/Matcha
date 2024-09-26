# Matcha

Full Stack Matcha dating app

## Start the project

This command will build the frontend to the `dist` folder and start the express server.
The express server will serve the frontend from the `dist` folder and provide the API.

```bash
cd backend/express-server
npm run dev
```

## Backend

The backend is built with Express and is located in the `backend/express-server` folder.
All API routes are prefixed with `/api`.
They are defined in the `backend/express-server/routes/api.js` folder.
The backend is accessible at `http://localhost:3000/api`.

## Frontend

The frontend is built with React and is located in the `frontend/react-app` folder.
React Router is used for routing which is client-side routing.
All routes are defined in the `frontend/react-app/src/routes` folder.
The frontend is accessible at `http://localhost:3000`.
