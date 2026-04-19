# AGS Tutorial — Full-Stack Institute Management System

A production-ready MERN stack application for managing students, fees, teachers, and real-time communication.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

---

### 1. Clone & Setup

```bash
# Backend
cd backend
cp .env.example .env          # Fill in your values (see Environment Variables below)
npm install
node seed.js                  # Creates default admin user
npm run dev                   # Starts on http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env          # Set VITE_API_URL if needed
npm install
npm run dev                   # Starts on http://localhost:5173
```

---

## 🔐 Default Admin Login

| Field    | Value              |
|----------|--------------------|
| Username | admin@ags.com      |
| Password | admin123           |
| Role     | Admin              |

> ⚠️ **Change the admin password immediately after first login!**

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                              | Example                          |
|-----------------------|------------------------------------------|----------------------------------|
| `PORT`                | Server port                              | `5000`                          |
| `MONGO_URI`           | MongoDB connection string                | `mongodb+srv://...`             |
| `JWT_SECRET`          | Secret for JWT signing (keep private!)   | `a-long-random-string`          |
| `RAZORPAY_KEY_ID`     | Your Razorpay Key ID                     | `rzp_live_xxxxx`                |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret                 | `xxxxxxxxxxxxxx`                |
| `FRONTEND_URL`        | Frontend URL for CORS                    | `https://ags-tutorial.onrender.com` |

### Frontend (`frontend/.env`)

| Variable               | Description                    | Example                              |
|------------------------|--------------------------------|--------------------------------------|
| `VITE_API_URL`         | Backend API base URL           | `https://ags-api.onrender.com/api`  |
| `VITE_SOCKET_URL`      | Backend Socket.io URL          | `https://ags-api.onrender.com`      |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID (public)       | `rzp_live_xxxxx`                    |

---

## 💳 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys → Generate Key**
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env`
4. Add `VITE_RAZORPAY_KEY_ID` to `frontend/.env`
5. For test mode, use test keys and test UPI `success@razorpay`

---

## 🌐 Deploy on Render

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ags-tutorial.git
git push -u origin main
```

### Step 2: Create MongoDB Atlas Database
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist `0.0.0.0/0` (allow all IPs) for Render
5. Copy the connection string → use as `MONGO_URI`

### Step 3: Deploy Backend on Render
1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `ags-tutorial-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add all environment variables from the table above
5. Set `FRONTEND_URL` = your frontend Render URL (get it from Step 4)
6. Click **Deploy**
7. After deploy, run seed: Go to **Shell** tab → `node seed.js`

### Step 4: Deploy Frontend on Render
1. New → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_API_URL` = `https://ags-tutorial-api.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://ags-tutorial-api.onrender.com`
   - `VITE_RAZORPAY_KEY_ID` = your key
5. Add Redirect/Rewrite Rule: `/* → /index.html` (for React Router)
6. Click **Deploy**

---

## 👥 User Roles & Access

| Feature                  | Admin | Teacher | Student |
|--------------------------|-------|---------|---------|
| View all students        | ✅    | ✅      | ❌      |
| Add students             | ✅    | ✅      | ❌      |
| Edit students            | ✅    | ✅ (limited) | ❌  |
| Delete students          | ✅    | ❌      | ❌      |
| Mark offline payment     | ✅    | ✅      | ❌      |
| Pay online (Razorpay)    | ✅    | ✅      | ✅      |
| Give discount            | ✅    | ❌      | ❌      |
| Add/edit teachers        | ✅    | ❌      | ❌      |
| View charts/analytics    | ✅    | ❌      | ❌      |
| Chat                     | ✅    | ✅      | ❌      |
| View announcements       | ✅    | ✅      | ✅      |
| Create announcements     | ✅    | ✅      | ❌      |
| Force logout sessions    | ✅    | ❌      | ❌      |
| View audit logs          | ✅    | ❌      | ❌      |
| Export Excel             | ✅    | ❌      | ❌      |

---

## 🎓 Student Credentials

When a student is added, the system auto-generates:

- **Roll Number** format: `YYMMCCCSNN`
  - `YY` = admission year last 2 digits
  - `MM` = admission month
  - `CCC` = class code (NUR=100, LKG=200, UKG=300, 1st=001 … 10th=010)
  - `S` = section (0=A, 1=B)
  - `NN` = serial number

- **Username**: Roll Number
- **Password**: Father's first name (capitalized) + `@ags`
  - e.g. Father name "Ramesh Kumar" → password `Ramesh@ags`
  - If no father name, mother's name is used

---

## 📁 Project Structure

```
ags-tutorial/
├── backend/
│   ├── server.js          # Express + Socket.io entry
│   ├── config/db.js       # MongoDB connection
│   ├── models/            # Mongoose schemas
│   ├── controllers/       # Route handlers
│   ├── routes/            # Express routers
│   ├── middleware/        # Auth, role check, logging
│   ├── socket/            # Socket.io handlers
│   ├── utils/             # PDF, Excel, roll number
│   └── seed.js            # Admin user seeder
├── frontend/
│   └── src/
│       ├── pages/         # Full page components
│       ├── components/    # Reusable UI components
│       ├── context/       # Auth & Socket contexts
│       ├── services/      # Axios & Socket.io clients
│       └── utils/         # PDF, constants
└── README.md
```

---

## 📞 Support

**AGS Tutorial**  
A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi  
📞 9839910481  
✉️ agstutorial050522@gmail.com
