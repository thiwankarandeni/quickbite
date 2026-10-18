# QuickBite: a food ordering learning project

A small but complete food ordering app built to **learn by reading code**:

| Layer    | Tech                                                        | Folder      |
| -------- | ----------------------------------------------------------- | ----------- |
| Frontend | React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS | `frontend/` |
| Backend  | FastAPI, Pydantic, JWT auth                                 | `backend/`  |
| Database | MongoDB Atlas (via PyMongo's async API)                     | (cloud)     |

**Customers** browse the menu, fill a cart, sign up / log in, place orders and track their status.
**Admins** manage menu items, move orders through `pending → preparing → ready → delivered`, and see sales stats.

👉 Once it runs, read **[LEARNING.md](LEARNING.md)** for a guided tour of the code.

```
Browser ──▶ Next.js server (pages, Server Actions) ──▶ FastAPI ──▶ MongoDB Atlas
            holds the JWT in an httpOnly cookie        verifies JWT, owns all data rules
```

---

## 1. Set up MongoDB Atlas (one time, ~5 min)

1. Sign up at <https://www.mongodb.com/cloud/atlas> and create a **free (M0) cluster**.
2. **Database Access** → add a database user with a username and password.
3. **Network Access** → *Add IP Address* → *Add current IP address* (or `0.0.0.0/0` for anywhere, fine for learning only).
4. **Database → Connect → Drivers** → copy the connection string. It looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   and you replace `<password>` with your real password.

You don't need to create a database or collections. MongoDB creates them on first write.

## 2. Run the backend (FastAPI)

Requires Python 3.11+.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
# edit .env: paste your MONGODB_URI and set JWT_SECRET to a long random string
python seed.py                    # sample menu + admin user
uvicorn app.main:app --reload
```

Open **<http://localhost:8000/docs>**: interactive API docs. Click **Authorize** and log in with
`admin@example.com` / `admin123` to try the admin endpoints.

## 3. Run the frontend (Next.js)

Requires Node.js 20+. In a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env.local      # API_URL=http://localhost:8000
npm run dev
```

Open **<http://localhost:3000>**.

## Try it

1. Sign up as a customer, add dishes to the cart, check out.
2. In a private window, log in as `admin@example.com` / `admin123` → **Admin → Orders** → change the status.
3. Back as the customer, open the order and press **↻ Refresh** to see the new status and history.

## Useful commands

| Where       | Command                         | What it does                       |
| ----------- | ------------------------------- | ---------------------------------- |
| `backend/`  | `uvicorn app.main:app --reload` | API with auto-reload on file save  |
| `backend/`  | `python seed.py`                | Reset menu items, (re)create admin |
| `frontend/` | `npm run dev`                   | Dev server with hot reload         |
| `frontend/` | `npm run build`                 | Production build + type check      |
| `frontend/` | `npm run lint`                  | ESLint                             |

## Troubleshooting

- **"Can't reach the API"** in the browser: the backend isn't running on port 8000, or `API_URL` is wrong.
- **Backend fails at startup with a timeout**: Atlas *Network Access* doesn't include your current IP.
- **`bad auth : authentication failed`**: wrong DB user/password in `MONGODB_URI` (special characters in the password must be URL-encoded).
- **Logged out unexpectedly**: the JWT expired (24h) or you changed `JWT_SECRET`.
