# Backend API - GovJobs Hub

Node.js/Express backend with MySQL database.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Initialize database:**
```bash
node database/init.js
```

3. **Start server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=gopikarthik2003
DB_NAME=govapp
JWT_SECRET=govjobs-secret-key-2024
```

## Default Admin

- Username: `admin`
- Password: `admin123`

## API Endpoints

See main README.md for complete API documentation.



