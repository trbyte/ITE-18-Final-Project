# Road Safety Simulator

A 3D interactive road safety simulation game built with Three.js, featuring user authentication, score tracking, and an immersive driving experience.

------------------------------------------------------
INSTALLATION
------------------------------------------------------
1. Clone the repository:
   git clone <your-repo-url>
   cd road-safety-simulator

2. Install server dependencies:
   cd server
   npm install

3. Install client dependencies:
   cd ../client
   npm install

4. Setup environment variables:
   Create a `.env` file in the `server` folder:
   
   DATABASE_URL=postgresql://neondb_owner:npg_MlisGo3pyIc1@ep-delicate-river-aha074dk-pooler.c-3.us-east-1.aws.neon.tech neondb?sslmode=require&channel_binding=require
   NODE_ENV=development
   JWT_SECRET=your_secret_key
   PORT=5000


------------------------------------------------------
DATABASE SETUP
------------------------------------------------------
1. Create a PostgreSQL database (recommended: Neon DB)
2. Run the following SQL to create required tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE player_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Update the `DATABASE_URL` in your `.env` file with your database connection string

------------------------------------------------------
RUNNING THE PROJECT
------------------------------------------------------
1. Start the backend server:
   cd server
   node index.js
   
   Or, if using nodemon for development:
   npm run dev
   
   You should see:
   Server running on http://localhost:5000

2. Open the frontend in browser:
   - Use Live Server extension or web server
   - Open client/index.html → login
   - Open client/register.html → new user registration
   - Open client/game.html → game (requires login)

------------------------------------------------------
FEATURES
------------------------------------------------------
- **3D Game Environment** - Immersive 3D road simulation with realistic graphics
- **User Authentication** - Secure registration and login system with JWT tokens
- **Score Tracking** - Save and track your progress across sessions
- **Interactive Driving** - Realistic car controls and road interactions
- **Progress System** - Track your level and score over time
- **3D Assets** - Detailed 3D models including cars, roads, barriers, and streetlights

------------------------------------------------------
TECH STACK
------------------------------------------------------
### Backend
- **Node.js** with Express.js
- **PostgreSQL** database (Neon DB)
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **Three.js** for 3D graphics
- **Vanilla JavaScript** for game logic
- **HTML5/CSS3** for UI

------------------------------------------------------
PROJECT STRUCTURE
------------------------------------------------------
```
road-safety-simulator/
├── server/          # Backend API server
│   ├── index.js     # Express server and routes
│   ├── db.js        # Database connection
│   └── package.json
├── client/          # Frontend application
│   ├── components/  # 3D game components
│   ├── index.html   # Login page
│   ├── register.html
│   ├── game.html    # 2D game
│   ├── game3d.html  # 3D game
│   └── package.json
└── assets/          # 3D models and textures
```

------------------------------------------------------
API ENDPOINTS
------------------------------------------------------
- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /api/save-score` - Save player score (authenticated)
- `GET /load-progress` - Load player progress (authenticated)
- `GET /health` - Health check
- `GET /test-db` - Database connection test

------------------------------------------------------
PASSWORD REQUIREMENTS
------------------------------------------------------
When registering, passwords must:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number
- Contain at least one special character (!@#$%^&*)

------------------------------------------------------
TROUBLESHOOTING
------------------------------------------------------
- **Module not found errors**: Make sure you've run `npm install` in both `server` and `client` directories
- **Database connection errors**: Verify your `DATABASE_URL` in the `.env` file is correct
- **CORS errors**: Ensure the server is running and the frontend is accessing the correct API endpoint
- **Authentication errors**: Check that `JWT_SECRET` is set in your `.env` file

------------------------------------------------------
LICENSE
------------------------------------------------------
See individual license files in the `assets/models/` directories for 3D model licenses.
