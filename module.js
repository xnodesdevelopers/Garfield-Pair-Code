import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import qrRouter from './qr.js'; // new QR-based router

const app = express();
const __dirname = path.resolve(); // current working dir
const PORT = process.env.PORT || 8000;

// Increase max listeners to avoid warnings
require('events').EventEmitter.defaultMaxListeners = 500;

// Serve the QR route
app.use('/qr', qrRouter);

// Serve your frontend HTML
app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html')); // your old HTML
});

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start server
app.listen(PORT, () => {
    console.log(`
✅ Deployment Successful!
Gifted-Session-Server Running on http://localhost:${PORT}
`);
});

export default app;
