// qr.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const pino = require('pino');
const { Storage } = require("megajs");
const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers,
    delay,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const router = express.Router();
const sessionDir = path.join(__dirname, "temp");

// Helpers
function randomMegaId(length = 6, numberLength = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

async function uploadCredsToMega(credsPath) {
    const storage = await new Storage({
        email: 'zenoinoize@gmail.com',
        password: 'openacc000'
    }).ready;

    const fileSize = fs.statSync(credsPath).size;
    const uploadResult = await storage.upload({
        name: `${randomMegaId()}.json`,
        size: fileSize
    }, fs.createReadStream(credsPath)).complete;

    const fileNode = storage.files[uploadResult.nodeId];
    const megaUrl = await fileNode.link();
    return megaUrl;
}

function removeFolder(folderPath) {
    if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });
}

// QR route
router.get('/', async (req, res) => {
    const id = Math.random().toString(36).substring(2, 10);
    const tempPath = path.join(sessionDir, id);
    let responseSent = false;

    try {
        fs.mkdirSync(tempPath, { recursive: true });
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(tempPath);

        const client = Gifted_Tech({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS("Safari")
        });

        client.ev.on('creds.update', saveCreds);

        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !responseSent) {
                const qrImage = await QRCode.toDataURL(qr);
                if (!res.headersSent) {
                    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GARFIELD BOT QR</title>
<style>
body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#141414; font-family:sans-serif; color:#00ffe7; text-align:center; }
.container { background: rgba(0,0,255,0.8); padding:30px; border-radius:15px; box-shadow:0 0 20px #00ffe7; }
h1 { margin-bottom:15px; }
input { padding:10px; border-radius:8px; border:none; width:250px; margin-bottom:15px; }
button { padding:10px 20px; border:none; border-radius:8px; background:#25d366; color:white; cursor:pointer; }
button:hover { background:#1da851; }
img { width:300px; height:300px; margin-top:15px; }
</style>
</head>
<body>
<div class="container">
<h1>GARFIELD BOT v10</h1>
<input type="text" placeholder="Your Phone Number" id="phone" value="+94">
<button onclick="alert('Scan the QR below with WhatsApp')">Generate QR</button>
<img src="${qrImage}" alt="QR Code">
<p>Scan this QR code with your WhatsApp app</p>
</div>
</body>
</html>
                    `);
                    responseSent = true;
                }
            }

            // When connected, upload to Mega and send Xnodes ID
            if (connection === 'open') {
                const credsPath = path.join(tempPath, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    try {
                        const megaUrl = await uploadCredsToMega(credsPath);
                        const xnodesId = megaUrl.includes("https://mega.nz/file/") 
                            ? 'Xnodes~' + megaUrl.split("https://mega.nz/file/")[1] 
                            : 'Error: Invalid URL';
                        console.log('Xnodes Session ID:', xnodesId);
                        await client.sendMessage(client.user.id, { text: xnodesId });
                    } catch (e) {
                        console.error("Mega upload failed:", e);
                    }
                }
                await delay(2000);
                await client.ws.close();
                removeFolder(tempPath);
            }

            // Retry on disconnect
            if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                await delay(10000);
            }
        });

        setTimeout(() => {
            if (!responseSent && !res.headersSent) {
                res.send('<h3>QR Timeout</h3>');
                removeFolder(tempPath);
            }
        }, 20000);

    } catch (err) {
        console.error(err);
        removeFolder(tempPath);
        if (!responseSent && !res.headersSent) res.status(500).send('<h3>QR Service Error</h3>');
    }
});

module.exports = router;
