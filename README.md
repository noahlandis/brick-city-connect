# Brick City Connect

Brick City Connect is a platform for Rochester Institute of Technology students to video chat with one another.

## Local Setup

Follow these steps to set up and run the project:

1. **Navigate to the `client` directory:**
   - Run `cd client` to move into the frontend codebase.

2. **Start the frontend:**
   - Run `npm start` to start the React development server.

3. **Navigate to the `server` directory:**
   - Open a new terminal and run `cd server` to move into the backend directory.

4. **Start the backend:**
   - Use the command `docker-compose -p brick-city-connect up --build` to start the backend services.

5. **Linting (Optional):**
   - To check for code style issues: `npm run lint`
   - To automatically fix code style issues: `npm run lint:fix`