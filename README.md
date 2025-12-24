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
   
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secret-key-here
   PORT=5000


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
