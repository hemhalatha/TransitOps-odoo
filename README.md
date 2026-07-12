# transitOps

transitOps is a modular fleet and logistics management application with an Express/MongoDB backend and a Vite React frontend.

## Project Structure

- `backend/` - Express API, MongoDB models, validation, authentication, and domain routes.
- `frontend/` - React application for fleet, driver, trip, maintenance, expense, analytics, and profile workflows.
- `transitOps.postman_collection.json` - Postman collection for API exploration.

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Make sure Docker Desktop is running. `npm run dev` starts the local MongoDB container from `docker-compose.yml` before starting the API. If MongoDB is already running elsewhere, set `MONGO_URL` in `backend/.env` and use `npm run dev:api`.

Required backend environment values are documented in `backend/.env.example`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` if the API is not running at `http://localhost:3000/api`.

## Verification

```bash
cd frontend
npm run lint
npm run build
```

The backend currently has no automated test suite configured.
