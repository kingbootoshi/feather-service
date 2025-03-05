import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import agentRoutes from './routes/agentRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import uiRoutes from './routes/uiRoutes';

// Import database
import { initDatabase } from './db/database';

// Initialize environment variables
dotenv.config();

// Initialize the database
initDatabase();

// Initialize the express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Set the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/', uiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the Feather Agent Service`);
});