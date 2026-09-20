# Tasks CRUD — Docker Practice

A simple full-stack Tasks app for practicing Docker deployment.

- **Frontend:** React (Vite), served by Nginx in production
- **Backend:** Node.js + Express
- **Database:** MySQL 8

## Run with Docker Compose

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api/tasks
- MySQL: localhost:3306 (user `root`, password `root`, db `tasksdb`)

Stop and remove:

```bash
docker compose down          # keeps db volume
docker compose down -v       # also wipes the db
```

## Run locally (without Docker)

Backend:

```bash
cd backend
cp .env.example .env         # edit DB_HOST=localhost if MySQL is local
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## API

| Method | Path             | Body                                  |
|--------|------------------|---------------------------------------|
| GET    | /api/tasks       | —                                     |
| GET    | /api/tasks/:id   | —                                     |
| POST   | /api/tasks       | `{ title, description?, completed? }` |
| PUT    | /api/tasks/:id   | `{ title, description, completed }`   |
| DELETE | /api/tasks/:id   | —                                     |

## Project layout

```
.
├── backend/           # Express API + Dockerfile
├── frontend/          # React app + Dockerfile + nginx.conf
└── docker-compose.yml # db + backend + frontend
```
