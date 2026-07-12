# transitOps

transitOps is a full-stack fleet and logistics operations platform for managing vehicles, drivers, trips, maintenance, fuel expenses, analytics, notifications, and organization settings. The application uses a React frontend, an Express.js REST API, MongoDB persistence, JWT authentication, and role-based access control for operational workflows.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Role-Based Access](#role-based-access)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [API Modules](#api-modules)
- [Verification](#verification)
- [Operational Notes](#operational-notes)

## Overview

transitOps helps logistics teams operate a transport fleet from one dashboard:

- Managers can administer the fleet, drivers, maintenance records, expenses, trips, settings, and analytics.
- Dispatchers can coordinate trip operations while viewing fleet and driver availability.
- Safety officers can monitor fleet, driver, and maintenance information relevant to safety workflows.
- Financial analysts can monitor expenses, fleet cost metrics, ROI, and analytics.

The system is designed around modular domain areas so each workflow has its own API routes, data model, validation rules, and frontend page.

## Core Features

### Authentication and User Roles

- JWT-based authentication.
- Login, registration, logout, profile, and password reset flows.
- Supported roles:
  - `manager`
  - `dispatcher`
  - `safety_officer`
  - `financial_analyst`
- Protected routes on both frontend and backend.
- Role-aware sidebar navigation.

### Dashboard

- Operational overview for authenticated users.
- Fleet, driver, trip, and expense summary data.
- Quick insight cards for day-to-day transport operations.

### Fleet Management

- Vehicle inventory with search, filters, pagination, and status tracking.
- Vehicle attributes include type, model, license plate, fuel type, capacity, odometer, acquisition cost/date, region, color, and notes.
- Vehicle states include `available`, `on_trip`, `in_shop`, and `retired`.
- Manager-only vehicle create, update, delete, and status transitions.
- Read-only fleet visibility for non-manager roles.

### Driver Management

- Driver directory with contact information, license status, assigned vehicle, safety score, ratings, trip counts, and completion rate.
- Search and status filtering.
- Driver states include `on_duty`, `on_trip`, `off_duty`, and `suspended`.
- Driver add, update, and delete actions are restricted to managers.
- Non-manager roles can view driver data without edit actions.

### Trip Operations

- Trip creation and dispatch workflow.
- Draft, dispatched, completed, and cancelled trip states.
- Vehicle and driver assignment validation.
- Odometer tracking when trips are completed.
- Driver rating after trip completion.
- Trip status actions for dispatch, completion, and cancellation.
- Manager and dispatcher write access.

### Maintenance Management

- Maintenance records by vehicle.
- Service types such as oil change, brake service, tire rotation, inspection, engine repair, electrical, body work, and general service.
- Maintenance states include `scheduled`, `in_progress`, and `completed`.
- Vehicle status is updated during maintenance workflows.
- Manager-only maintenance create, update, and delete actions.

### Fuel and Expense Management

- Expense tracking for fuel, maintenance, insurance, and other costs.
- Expense filters, pagination, totals, and vehicle-level cost views.
- Fuel-specific fields such as liters and odometer support cost and efficiency analytics.
- High-value expense notification support through settings thresholds.
- Expense delete is manager-only.

### Analytics and Reporting

- Fleet utilization analytics.
- Fuel efficiency reporting.
- Vehicle ROI reporting.
- Cost per kilometer reporting.
- CSV export support for vehicles, maintenance, trips, and expenses.
- Analytics access is restricted to managers and financial analysts.

### Notifications

- Role-targeted operational notifications.
- Unread notification count in the navigation bar.
- Notification list with read/read-all actions.
- Automated checks for events such as license expiry, maintenance, utilization, safety score, and expense approval alerts.
- Scheduler service powered by `node-cron`.

### Settings

- Shared organization settings such as depot name, currency, distance unit, and operational thresholds.
- Settings read access for authenticated users.
- Settings update access for managers.

### API Validation and Error Handling

- Request validation using `express-validator`.
- Central validation middleware.
- Structured domain validators for auth, vehicles, drivers, trips, maintenance, expenses, and settings.
- Centralized authentication and authorization middleware.

## Role-Based Access

The UI and API enforce role-aware behavior. The current access model is:

| Module | Manager | Dispatcher | Safety Officer | Financial Analyst |
| --- | --- | --- | --- | --- |
| Dashboard | View | View | View | View |
| Fleet | Manage | View | View | View |
| Drivers | Manage | View | View | View |
| Trips | Manage | Manage | Limited API view | Limited API view |
| Maintenance | Manage | API read | View | API read |
| Fuel and Expenses | Manage | API access | No sidebar access | View / create |
| Analytics | View | No access | No access | View |
| Notifications | View | View | View | View |
| Settings | Manage | View | View | View |

Notes:

- `Manage` means create, update, delete, or perform workflow actions where available.
- Sidebar navigation intentionally shows only the pages each role should use in the UI.
- Backend routes still protect each operation independently; the frontend is not the only authorization layer.

## Technology Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Lucide React icons
- Recharts
- jsPDF, jsPDF AutoTable, and html2canvas for export/reporting support
- CSS modules/files organized by page and shared components

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- express-validator
- node-cron scheduled jobs
- Nodemailer email service support

### Infrastructure

- Docker Compose for local MongoDB
- Postman collection for API exploration

## Architecture

```text
frontend/ React + Vite
   |
   | HTTP requests through Axios
   v
backend/ Express REST API
   |
   | Mongoose models
   v
MongoDB
```

Backend modules follow a consistent structure:

- `routes/` define HTTP endpoints and role authorization.
- `controllers/` handle request/response flow.
- `models/` define MongoDB schemas.
- `validators/` validate external input.
- `services/` contain reusable domain services such as settings, notifications, email, scheduler, and exports.
- `middleware/` contains authentication, authorization, validation, and error handling concerns.

Frontend modules follow a route/page layout:

- `pages/` contain workflow screens.
- `components/common/` contains reusable UI elements such as buttons, inputs, and tables.
- `components/layout/` contains protected layout, sidebar, and navbar.
- `context/AuthContext.jsx` owns authentication state and role helpers.
- `services/api.js` centralizes API client configuration.

## Project Structure

```text
transitOps/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- validators/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- services/
|   |-- package.json
|   `-- vite.config.js
|-- docker-compose.yml
|-- transitOps.postman_collection.json
`-- README.md
```

## Prerequisites

Install the following before running the project locally:

- Node.js 20 or newer recommended
- npm
- Docker Desktop, if using the provided MongoDB container
- Git

## Environment Variables

Backend environment values are documented in [backend/.env.example](backend/.env.example).

Create a local backend environment file:

```bash
cd backend
copy .env.example .env
```

Required backend values:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend server port. Defaults to `3000` in the example file. |
| `NODE_ENV` | Runtime environment such as `development` or `production`. |
| `MONGO_URL` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign JWTs. Replace the example value before production use. |
| `EMAIL_USER` | Email account used by the email service. |
| `EMAIL_CLIENT_ID` | OAuth client ID for email delivery. |
| `EMAIL_CLIENT_SECRET` | OAuth client secret for email delivery. |
| `EMAIL_REFRESH_TOKEN` | OAuth refresh token for email delivery. |

Frontend API configuration:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Optional frontend API base URL. Use it when the backend is not available at the default API URL. |

Do not commit `.env` files or production secrets.

## Deployment

The production deployment is hosted on Render:

- Live app: [https://transitops-k2qw.onrender.com](https://transitops-k2qw.onrender.com)

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/hemhalatha/TransitOps-odoo.git
cd TransitOps-odoo
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
copy .env.example .env
```

Edit `.env` with local values. For Docker-based local MongoDB, the example `MONGO_URL` can be used as-is.

### 4. Start the backend

With Docker-managed MongoDB:

```bash
npm run dev
```

This command starts the MongoDB container through `docker-compose.yml` and then starts the API with Nodemon.

If MongoDB is already running separately:

```bash
npm run dev:api
```

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Vite will print the local frontend URL in the terminal.

## API Modules

The backend is mounted under `/api` and includes these module routes:

| Module | Base Path | Description |
| --- | --- | --- |
| Auth | `/api/auth` | Registration, login, logout, current user, password flows. |
| Dashboard | `/api/dashboard` | Dashboard summary metrics. |
| Vehicles | `/api/vehicles` | Fleet inventory, vehicle stats, vehicle CRUD, status changes. |
| Drivers | `/api/drivers` | Driver directory, performance data, manager-only write operations. |
| Trips | `/api/trips` | Trip creation, updates, dispatch, completion, cancellation. |
| Maintenance | `/api/maintenance` | Vehicle service history and maintenance workflow. |
| Expenses | `/api/expenses` | Fuel and expense records, totals, vehicle expense history. |
| Analytics | `/api/analytics` | Utilization, fuel efficiency, ROI, cost-per-km, CSV export. |
| Notifications | `/api/notifications` | Notification list, unread count, mark read/read all. |
| Settings | `/api/settings` | Shared organization settings. |

A Postman collection is available at [transitOps.postman_collection.json](transitOps.postman_collection.json).

## Verification

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd backend
node --check server.js
```

The backend `npm test` script is currently a placeholder and does not run an automated test suite.

## Operational Notes

- Docker Compose defines a local MongoDB service named `transitops-mongodb` on port `27017`.
- The backend `npm run dev` script starts MongoDB before launching Nodemon.
- The scheduler service depends on `node-cron` and supports automated notification checks.
- Authorization is enforced server-side with `authMiddleware` and `authorize(...)` middleware.
- Frontend role checks are used for navigation and UI affordances, but backend authorization remains the source of enforcement.
- Keep secrets in environment files only; never commit real credentials.