# DevFlow
Real-time developer collaboration API: projects, Kanban tasks, chat, notifications, activity feed, GitHub integration, analytics.
**Stack:** Node, Express, MongoDB/Mongoose, JWT + bcrypt, Socket.IO. Frontend: React + Vite.

## Run
```bash
cd backend && npm install && cp .env.example .env   # set JWT_SECRET, start MongoDB
npm run dev          # API on :5000
npm run seed         # optional demo data: demo@devflow.dev / demo12345
```
## API
`/api/auth` `/api/users?q=` `/api/projects` `/api/projects/:id/{members,tasks,activity,messages,analytics,github}` `/api/tasks/:id/{move,comments}` `/api/notifications` `/api/github/lookup?repo=owner/name` `/api/dashboard` `/api/activity`
## Socket.IO
Connect with `io(URL, { auth: { token } })`. Emit `project:join`, `chat:send`, `chat:typing`. Listen for `task-created|updated|deleted|moved`, `member-added|removed`, `notification-created`, `message-created`, `presence`, `activity-created`, `comment-created`.

## Frontend
```bash
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api and /socket.io to :5000)
```
React + Vite + React Router + Axios + Socket.IO client, plain CSS. Set `VITE_API_URL` / `VITE_SOCKET_URL` for production builds (see `frontend/.env.example`).
