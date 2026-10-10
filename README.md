# Feedback System

A full-stack student feedback and evaluation portal built with **React**, **Vite**, **Express**, and **MongoDB**.

## Features

- **Authentication & Roles**: Student and Admin/Faculty role management with JWT and Bcrypt.
- **Feedback Collection**: Interactive forms for submitting course/subject feedback.
- **Reporting & Exports**: Export feedback and analytics to PDF, Word (`.docx`), and Excel (`.xlsx`).
- **Modern UI**: Styled with Tailwind CSS / Framer Motion and Lucide icons.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Framer Motion, React Router v7
- **Backend**: Express 5, Node.js, Mongoose, JSONWebToken, Multer, Bcrypt.js
- **Database**: MongoDB Atlas

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance or MongoDB Atlas cluster connection string

### 2. Installation

Clone the repository:
```bash
git clone git@github.com:karthikeya39g-af/Feedback-system.git
cd Feedback-system
```

Install dependencies:
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
PORT=5002
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_connection_string
```

### 4. Running the Application

Run the backend server:
```bash
npm run server
```

In a separate terminal, run the Vite frontend development server:
```bash
npm run dev
```

The application will typically be accessible at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5002`

---

## Build for Production

```bash
npm run build
```
This generates the optimized static build files in the `dist` folder.
