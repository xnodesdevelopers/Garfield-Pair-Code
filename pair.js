import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, fetchLatestBaileysVersion, jidNormalizedUser } from '@whiskeysockets/baileys';
import { delay } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Storage } from 'megajs';

const router = express.Router();

// Remove file/folder helper
function removeFile(path) {
    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
}

// Generate random Mega filename
function randomMegaId(length = 6, numberLength = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

// Upload creds to Mega
async function uploadCredsToMega(credsPath) {
    const storage = await new Storage({
        email: 'zenoinoize@gmail.com',
        password: 'openacc000'
    }).ready;

    const size = fs.statSync(credsPath).size;
    const uploadResult = await storage.upload({ name: `${randomMegaId()}.json`, size }, fs.createReadStream(credsPath)).complete;
    const fileNode = storage.files[uploadResult.nodeId];
    return await fileNode.link();
}

// Main route
router.get('/', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.status(400).send({ error: 'Number required' });

    const sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const tempDir = `./temp/${sessionId}`;
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        const { version } = await fetchLatestBaileysVersion();

        let qrSent = false;
        let megaSent = false;

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Send QR to frontend
            if (!qrSent && qr) {
                qrSent = true;
                const qrDataURL = await QRCode.toDataURL(qr);
                res.send({ qr: qrDataURL, message: 'Scan QR with WhatsApp' });
            }

            // After successful connection
            if (connection === 'open' && !megaSent) {
                megaSent = true;
                console.log('✅ WhatsApp connected! Uploading session to Mega...');
                const credsPath = `${tempDir}/creds.json`;
                if (fs.existsSync(credsPath)) {
                    const megaUrl = await uploadCredsToMega(credsPath);
                    console.log('🔗 Mega URL:', megaUrl);

                    // Send session ID to yourself (optional)
                    const userJid = sock.authState.creds.me?.id ? jidNormalizedUser(sock.authState.creds.me.id) : null;
                    if (userJid) {
                        await sock.sendMessage(userJid, { text: `Session ID: Xnodes~${megaUrl.split("https://mega.nz/file/")[1]}` });
                    }
                }

                // Cleanup temp
                setTimeout(() => removeFile(tempDir), 10000);
            }

            // Handle disconnects
            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode;
                if (code === 401) removeFile(tempDir); // logged out
            }
        });

        // Timeout if QR not generated
        setTimeout(() => {
            if (!qrSent) {
                res.status(408).send({ qr: null, message: 'QR generation timeout' });
                removeFile(tempDir);
            }
        }, 30000);

    } catch (err) {
        console.error('Error:', err);
        removeFile(tempDir);
        if (!res.headersSent) res.status(500).send({ qr: null, error: 'Server error' });
    }
});

export default router;
