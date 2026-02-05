## Docker / Portainer deployment (Postgres-backed)

This repo includes a Docker Compose stack with:
- carlet (frontend built and served by nginx)
- backend (Express API storing data in PostgreSQL)
- db (Postgres 15)

Quick start (local)
1. Copy `.env.example` to `.env` and adjust if desired.
2. Build & run:
   - docker compose up -d --build
3. Visit http://localhost/ (or server IP)

Portainer
- Create a new stack and paste the contents of docker-compose.yml, make sure the repository files (Dockerfile and backend) are present.
- Deploy. Portainer will build images and start services.

Data & uploads
- Postgres data is persisted in the `db-data` Docker volume.
- Uploaded images are stored in the `uploads` Docker volume and served at /uploads/<filename>.

Notes
- The backend creates tables on first run.
- The seeded admin user is admin@example.com (no password; the frontend uses auth.me only to know a user).
- For production, protect the backend endpoints and add authentication.