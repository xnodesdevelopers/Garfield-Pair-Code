// qr.js
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const { default: Gifted_Tech, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, delay } = require('@whiskeysockets/baileys');
const router = express.Router();

router.get('/', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).send({ error: "Number is required" });

    const id = Math.random().toString(36).substring(2, 10); // random session folder
    const tempDir = `./temp/${id}`;

    try {
        fs.mkdirSync(tempDir, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(tempDir);

        const client = Gifted_Tech({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS("Safari")
        });

        client.ev.on('creds.update', saveCreds);

        // Listen for QR code
        client.ev.once('connection.update', async (update) => {
            if (update.qr) {
                // Send the QR as base64 string
                const qrData = update.qr;
                res.send({ qr: qrData });
            } else if (update.connection === 'open') {
                res.send({ qr: null, message: 'Already connected' });
            }
        });

        // Optional: timeout if QR not generated
        setTimeout(() => {
            if (!res.headersSent) {
                res.send({ qr: null, message: 'QR code timeout' });
            }
        }, 15000);

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).send({ qr: null, error: "Server error" });
        }
    }
});

module.exports = router;
