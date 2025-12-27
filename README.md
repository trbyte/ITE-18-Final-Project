# Drive Smart

A 3D interactive road safety simulation game built with Three.js, featuring user authentication, score tracking, and an immersive driving experience.

------------------------------------------------------
INSTALLATION & SETUP
------------------------------------------------------
**Prerequisites:**
- Node.js (version 18.0.0 or higher)
- npm (comes with Node.js)
- PostgreSQL database (or Neon DB account)

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd road-safety-simulator
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
   This will install all required packages including Express, PostgreSQL client, JWT, bcrypt, etc.

3. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```
   This will install frontend dependencies if any are required.

4. Setup environment variables:
   Create a `.env` file in the `server` folder with the following credentials:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_MlisGo3pyIc1@ep-delicate-river-aha074dk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   NODE_ENV=development
   JWT_SECRET=b8542b31e6fb8ff70632567cefda43eaf06970b67f9b564abfefbc28efcc63aff5aba84c72989a512e7c074a95c2325cd0471c9b22cccbe1bfe6693bbb5884e8
   PORT=5000
   ```
   
   **Note:** These are test credentials provided for development and testing purposes. Copy the above credentials exactly into your `.env` file.
   
   ⚠️ **Security Warning:** These credentials are for testing only. For production deployments, use your own secure database connection and generate a new JWT_SECRET.

5. Database Setup:
   - Create a PostgreSQL database (recommended: Neon DB)
   - Run the following SQL to create required tables:
   
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

6. Running the Project:
   - Start the backend server:
     ```bash
     cd server
     node index.js
     ```
     Or, if using nodemon for development:
     ```bash
     npm run dev
     ```
     You should see: `Server running on http://localhost:5000`
   
   - Open the frontend in browser:
     - Use Live Server extension or web server
     - Open `client/index.html` → login
     - Open `client/register.html` → new user registration
     - Open `client/game3d.html` → 3D game (requires login)

------------------------------------------------------
PROJECT STORY & CONCEPT
------------------------------------------------------
Drive Smart is an educational 3D driving game designed to promote safe driving practices through interactive gameplay. The game combines realistic 3D graphics with engaging mechanics to create an immersive learning experience.

**Concept:**
The game challenges players to navigate a 3D road environment while avoiding obstacles and maintaining safe driving practices. As players progress, the difficulty increases with faster speeds, creating a dynamic and challenging experience. The game emphasizes the importance of road safety through gameplay mechanics that reward careful driving and penalize collisions.

**Key Objectives:**
- Educate players about road safety through interactive gameplay
- Provide an engaging 3D driving simulation experience
- Track player progress and encourage improvement through scoring
- Create a scalable platform for future road safety education features

------------------------------------------------------
DEVELOPMENT STACK
------------------------------------------------------
### Backend
- **Node.js** (v18.0.0+) - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** (Neon DB) - Relational database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **Three.js** - 3D graphics library
- **Vanilla JavaScript** - Game logic and interactions
- **HTML5/CSS3** - User interface and styling
- **GLTF Loader** - 3D model loading

### Development Tools
- **nodemon** - Development server with auto-reload
- **npm** - Package management

------------------------------------------------------
PROJECT STRUCTURE
------------------------------------------------------
```
road-safety-simulator/
├── server/              # Backend API server
│   ├── index.js         # Express server and routes
│   ├── db.js            # Database connection
│   ├── package.json     # Server dependencies
│   └── .env             # Environment variables
├── client/              # Frontend application
│   ├── components/      # 3D game components
│   │   ├── car.js       # Car controller
│   │   ├── road.js      # Road manager
│   │   ├── barrier.js   # Barrier manager
│   │   ├── camera.js    # Camera controller
│   │   └── scene.js     # Scene manager
│   ├── index.html       # Login page
│   ├── register.html    # Registration page
│   ├── game.html        # 2D game
│   ├── game3d.html       # 3D game
│   ├── auth.js          # Authentication logic
│   └── package.json     # Client dependencies
└── assets/              # 3D models and textures
    └── models/          # GLTF 3D models
```

------------------------------------------------------
FEATURES
------------------------------------------------------
- **3D Game Environment** - Immersive 3D road simulation with realistic graphics
- **User Authentication** - Secure registration and login system with JWT tokens
- **Score Tracking** - Save and track your progress across sessions
- **Progressive Difficulty** - Speed increases gradually as score increases
- **Interactive Driving** - Realistic car controls and road interactions
- **Progress System** - Track your level and score over time
- **3D Assets** - Detailed 3D models including cars, roads, barriers, and streetlights
- **Collision Detection** - Real-time collision detection with barriers
- **Dynamic Camera** - Smooth camera following system

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
DEVELOPERS & TEAM ROLES
------------------------------------------------------
- **Lavieen Alvarez** - Frontend Developer
  - Integrated existing 3D models into the game
  - Developed scene and environment
  - Implemented game functionalities
  - Car controller and game mechanics

- **Joshua Kyle Cabalan** - Backend Developer
  - Database design and implementation
  - API development and server configuration
  - Authentication and security features

- **Eian Gabriel Aguilar** - UI/UX Developer & Documentation
  - User interface design and implementation
  - Frontend styling and layout
  - Game UI components 
  - User experience optimization and responsive design
  - Project documentation and README maintenance

------------------------------------------------------
DEPLOYMENT
------------------------------------------------------
This project can be deployed to Vercel. See `DEPLOYMENT.md` for detailed deployment instructions.

**Quick Deploy to Vercel:**
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Deploy!

For detailed steps, see `DEPLOYMENT.md`.

------------------------------------------------------
TROUBLESHOOTING
------------------------------------------------------
- **Module not found errors**: Make sure you've run `npm install` in both `server` and `client` directories
- **Database connection errors**: Verify your `DATABASE_URL` in the `.env` file is correct
- **CORS errors**: Ensure the server is running and the frontend is accessing the correct API endpoint
- **Authentication errors**: Check that `JWT_SECRET` is set in your `.env` file
- **3D models not loading**: Verify that the `assets` folder is properly served by the server

------------------------------------------------------
LICENSE
------------------------------------------------------
See individual license files in the `assets/models/` directories for 3D model licenses.