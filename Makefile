# Variables
FRONTEND_DIR=frontend/react-app
BACKEND_DIR=backend/express-server

# Default: Build backend and frontend in production mode
default: prod

# Production tasks
build-frontend:
	npm install && cd $(FRONTEND_DIR) &&  npm install && npm run build

build-backend:
	cd $(BACKEND_DIR) && npm install

start-backend-prod:
	cd $(BACKEND_DIR) && npm run db:up && npm run dev 

prod: build-frontend build-backend start-backend-prod
	@echo "App is running in production mode. Access it at http://localhost:3000"

# Development tasks
start-frontend-dev:
	cd $(FRONTEND_DIR) && npm install && npm run dev

start-backend-dev:
	cd $(BACKEND_DIR) && npm install && npm run dev

dev: start-frontend-dev start-backend-dev
	@echo "App is running in development mode with hot-reloading. Access the frontend at http://localhost:5173 and backend at http://localhost:3000"

del:
	@cd $(BACKEND_DIR) && npm run db:down