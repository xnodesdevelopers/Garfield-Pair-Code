import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import code from './pair.js'; // Ensure your pair.js is also ESM

const app = express();

// Allow more listeners
EventEmitter.defaultMaxListeners = 500;

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// Routes
app.use('/code', code);

app.use('/', async (req, res, next) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start server
app.listen(PORT, () => {
  console.log(`
Deployment Successful!

Gifted-Session-Server Running on http://localhost:${PORT}
  `);
});

// Export app for testing or other modules
export default app;
