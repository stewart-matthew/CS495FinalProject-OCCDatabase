# How to Modify and Extend the Software

This document explains how developers can update, extend, and maintain the OCC Database application after installation.

---

## 1. Making Changes After Installation

Once the application is installed and running locally, developers can update the system by modifying the source code and, if necessary, adjusting Supabase database resources.

### 1. Clone and Open the Project

- Clone the repository onto your machine  
- Open it in a code editor (such as VS Code)  
- All application logic and UI code live inside the project directory  

### 2. Modify the User Interface / Behavior

- Update existing React pages by editing files in:

```
src/pages
```

- Update shared UI components in:

```
src/components
```

- To create new pages or features, add a new file inside `src/pages` and follow the same structure and routing patterns as existing pages.

### 3. Modify Data and Business Logic

- To change tables, relationships, or stored data, use the Supabase SQL Editor.  
- Any database changes should also be reflected in React code that reads from or writes to Supabase through:

```
src/supabaseClient.js
```

### 4. Update Security and Access Rules

- If new tables or roles are added, update Supabase **Row-Level Security (RLS)** policies.  
- RLS must be consistent with the existing role and area team structure to avoid permissions issues.

### 5. Test and Redeploy

- After updates, run the application locally to verify functionality.  
- When ready, rebuild and redeploy using the same Docker process described in the installation documentation.

---

## 2. Compiler, Languages, Build Management, Dependencies, and Automated Builds

The OCC application is built using modern web technologies and does not require a traditional compiler.

### Languages Used

- **JavaScript/JSX** — frontend logic and UI  
- **SQL** — Supabase database schema and RLS policies  

### Framework / Compiler

The project uses **Create React App**, powered internally by:

- **Babel** — compiles JSX  
- **Webpack** — bundles the application  

This process happens automatically when you run:

```
npm run build
```

### Build Management (npm)

Build and development tasks use **npm**.

Common commands:

```
npm install      # Install all project dependencies
npm run build    # Create an optimized production build
npm start        # Run the production build locally
```

### Dependencies

All dependencies are defined in:

```
package.json
```

This file lists:

- Libraries (React, Supabase, TailwindCSS, etc.)  
- Version numbers  
- Build scripts  

### Automated Builds (Docker)

Docker is used to produce repeatable and consistent builds.

A new Docker image is created using the included `Dockerfile`:

```
docker build .
```

Or build and run together:

```
docker compose up --build
```

No CI/CD pipeline is used — Docker itself handles build automation.

---

## 3. Backlog, Bugs, and Major Maintenance Issues

### Backlog and Bug Tracking

All tasks, backlog items, and bug reports are tracked in the project’s **Backlog Excel document**.

### Major Issues / Technical Call-Outs

#### 1. Database & RLS Retrofitting

Whenever new tables, foreign keys, or roles are added:

- New RLS policies must be created.  
- Permissions must match existing role structures.  
- This is the most common source of required retrofitting.

Examples requiring RLS updates:

- New role types  
- New tables (events, volunteer hours, etc.)  
- New foreign key relationships  

#### 2. Migrating Data to New Schema Versions

Changes to tables such as:

```
team_members
churches
positions
member_positions
```

may require:

- Manual data migration  
- Updating foreign-key relations  
- Updating dashboards and UI components  

Improper schema changes can introduce breaking issues.

#### 3. Supabase Feature Updates

Supabase updates may affect:

- Authentication  
- SQL/PostgreSQL capability  
- Storage policies  
- Supabase JS client API  

Major upgrades may require updating code and policies.

#### 4. Docker Environment Updates

Updating Docker-based environments may require:

- Updating the Node.js version  
- Updating base images  
- Adding new services (Redis, workers, etc.)  

Developers may need to modify the `Dockerfile` or `docker-compose.yml`.

#### 5. Long-Term Scalability Concerns

If the system grows significantly:

- Add indexes for large tables  
- Optimize heavy or repeated queries  
- Upgrade Supabase tiers to handle increased load  

This is a future concern but important for maintainers.

---

## 4. Style Expectations

The OCC application follows consistent coding and UI practices:

- Functional React components  
- `camelCase` for variables and functions  
- `PascalCase` for component names  
- TailwindCSS for styling  

Reusable UI lives in:

```
src/components
```

Full pages live in:

```
src/pages
```

All Supabase logic goes through:

```
supabaseClient.js
```

Code should remain readable, modular, and match existing patterns.

---

## 5. Automated Testing

The project uses Create React App’s default testing setup (**Jest + React Testing Library**).

### Location of Test Files

Main test file:

```
src/App.test.js
```

Testing configuration:

```
src/setupTests.js
```

Additional tests follow the pattern:

```
ComponentName.test.js
```

### Running Tests

Run in watch mode:

```
npm test
```

Run a single test pass (CI mode):

```
CI=true npm test
```

Currently, the project includes only the default tests. More can be added as needed.