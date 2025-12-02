# Installation Guide

This document explains how to install the OCC Database application in your environment.

## Requirements

- Node.js
- Supabase
- Optional: Docker
- Optional: Python for docs

## 1. Running the Web App Locally

### Step 1 — Clone the Repository

```bash
git clone https://github.com/stewart-matthew/CS495FinalProject-OCCDatabase.git
cd CS495FinalProject-OCCDatabase
```

### Step 2 — Install Node Dependencies

```bash
npm install
```

This installs React, Supabase JS, Tailwind, and other dependencies.

### Step 3 — Add Environment Variables

Create a file named `.env` in the root of the project:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4 — Run the Web App Locally

```bash
npm start
```

Then visit: `http://localhost:3000`

---

## 2. Running the Web App with Docker (Recommended)

Docker allows easy deployment of the entire application.

### Step 1 — Build the Docker Image

```bash
docker build -t stewartmatthew6288/occ-site .
```

### Step 2 — Push Image to Docker Hub (Optional)

```bash
docker push stewartmatthew6288/occ-site
```

### Step 3 — Run the Docker Container

```bash
docker run -p 3000:80 stewartmatthew6288/occ-site
```

The website is now available at: `http://localhost:3000`

---

## 3. Documentation Website (MkDocs)

**Important:** Python is only required for the documentation website. The web application itself does not use Python.

### Requirements

- Python 3.10+
- pip (comes with Python)
- mkdocs + mkdocs-material

### Step 1 — Create a Python Virtual Environment

```bash
python -m venv .venv
```

### Step 2 — Activate the Virtual Environment

**PowerShell (Windows):**

```bash
.venv\Scripts\activate
```

**Mac/Linux:**

```bash
source .venv/bin/activate
```

### Step 3 — Install MkDocs and the Theme

```bash
pip install mkdocs mkdocs-material
```

### Step 4 — Run the Documentation Site Locally

```bash
mkdocs serve
```

Then open: `http://127.0.0.1:8000`

### Step 5 — Build the Documentation for Deployment

```bash
mkdocs build
```

This creates a `site/` folder containing static HTML files that you can deploy to Render, GitHub Pages, Netlify, or any static hosting provider.

---

## 4. External Resources Used

- **Supabase** — Free tier database + authentication. Used for members, teams, and profile data.
- **Docker** — Used to containerize and deploy the application. Free Windows/Mac/Linux application.
- **Render** — Recommended for hosting both the web app and documentation.