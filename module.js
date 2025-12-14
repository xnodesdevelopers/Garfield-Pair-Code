import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import code from './pair.js'; // pair.js MUST be ESM

const app = express();

// ✅ ESM-safe max listeners
EventEmitter.defaultMaxListeners = 500;

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/code', code);

app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
Deployment Successful!

Gifted-Session-Server Running on http://localhost:${PORT}
`);
});

export default app;
