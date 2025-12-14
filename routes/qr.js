const { 
    giftedId,
    removeFile
} = require('../gift');
const QRCode = require('qrcode');
const express = require('express');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns');
const {
    default: giftedConnect,
    useMultiFileAuthState,
    Browsers,
    delay,
    downloadContentFromMessage, 
    generateWAMessageFromContent, 
    normalizeMessageContent,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const sessionDir = path.join(__dirname, "session");


router.get('/', async (req, res) => {
    const id = giftedId();
    let responseSent = false;
    let sessionCleanedUp = false;

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            await removeFile(path.join(sessionDir, id));
            sessionCleanedUp = true;
        }
    }

    async function GIFTED_QR_CODE() {
        const { version } = await fetchLatestBaileysVersion();
        console.log(version);
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));
        try {
            let Gifted = giftedConnect({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            Gifted.ev.on('creds.update', saveCreds);
            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                
                if (qr && !responseSent) {
                    const qrImage = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.send(` <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>G| QR CODE</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        /* Body & Container */
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            font-family: 'Orbitron', sans-serif;
            color: #00ffe7;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        }
        .container {
            width: 100%;
            max-width: 600px;
        }

        /* Logo */
        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 10px auto;
            border-radius: 50%;
            box-shadow: 0 0 10px #00ffe7, 0 0 20px #00ffe7 inset;
        }

        /* Header */
        h1 {
            color: #00ffe7;
            font-size: 30px;
            font-weight: 900;
            margin-bottom: 20px;
            text-shadow: 0 0 15px #00ffe7, 0 0 30px #00ffe7, 0 0 60px #00ffe7;
        }

        /* QR Code */
        .qr-container {
            position: relative;
            margin: 20px auto;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .qr-code {
            width: 300px;
            height: 300px;
            padding: 10px;
            background: linear-gradient(145deg, #000, #111);
            border-radius: 20px;
            box-shadow: 0 0 20px #00ffe7, 0 0 40px #00ffe7 inset;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: pulse 2s infinite;
        }
        .qr-code img {
            width: 100%;
            height: 100%;
            border-radius: 15px;
        }

        /* Text */
        p {
            color: #00ffe7aa;
            font-size: 16px;
            margin: 20px 0;
        }

        /* Back Button */
        .back-btn {
            display: inline-block;
            padding: 12px 25px;
            margin-top: 15px;
            background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
            color: #fff;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        /* Pulse animation */
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(0, 255, 231, 0.4);
            }
            70% {
                box-shadow: 0 0 0 25px rgba(0, 255, 231, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(0, 255, 231, 0);
            }
        }

        /* Copyright Footer */
        .footer {
            margin-top: 25px;
            font-size: 12px;
            color: #00ffe7aa;
        }

        @media (max-width: 480px) {
            .qr-container {
                width: 260px;
                height: 260px;
            }
            .qr-code {
                width: 220px;
                height: 220px;
            }
            h1 {
                font-size: 24px;
            }
            .logo {
                width: 50px;
                height: 50px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Garfield Logo -->
        <img src="https://raw.githubusercontent.com/Zenoixnoize/GARFIELD-WHATSAPP-BOT-v8/asdf/Cloud/PicsArt_22-04-15_10-13-49-205.png" alt="Garfield Logo" class="logo">

        <h1>GARFIELD BOT QR CODE</h1>

        <div class="qr-container">
            <div class="qr-code">
                <img src="${qrImage}" alt="QR Code"/>
            </div>
        </div>

        <p>Scan this QR code with your phone to connect</p>
        <a href="./" class="back-btn">Back</a>
        <div class="footer">© 2025 GARFIELD TECH</div>
    </div>

    <script>
        const backBtn = document.querySelector('.back-btn');
        backBtn.addEventListener('mousedown', () => {
            backBtn.style.transform = 'translateY(1px)';
            backBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        });
        backBtn.addEventListener('mouseup', () => {
            backBtn.style.transform = 'translateY(-2px)';
            backBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        });
    </script>
</body>
</html>

                        `);
                        responseSent = true;
                    }
                }

                if (connection === "open") {
                    
 
                    await delay(10000);

                    let sessionData = null;
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    while (attempts < maxAttempts && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) {
                                    sessionData = data;
                                    break;
                                }
                            }
                            await delay(2000);
                            attempts++;
                        } catch (readError) {
                            console.error("Read error:", readError);
                            await delay(2000);
                            attempts++;
                        }
                    }

                    if (!sessionData) {
                        await cleanUpSession();
                        return;
                    }

                    try {
                        let compressedData = zlib.gzipSync(sessionData);
                        let b64data = compressedData.toString('base64');
                        const Sess = await sendButtons(Gifted, Gifted.user.id, {
            title: '',
            text: 'Xnodes~' + b64data,
            footer: `> *GARFIELD BOT*`,
            buttons: [
                { 
                    name: 'cta_copy', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: 'Copy Session', 
                        copy_code: 'Xnodes~' + b64data 
                    }) 
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Github',
                        url: 'https://github.com/xnodesdevelopers/GARFIELD-WHATSAPP-BOT-v10'
                    })
                }
            ]
        });

                        await delay(2000);
                        await Gifted.ws.close();
                    } catch (sendError) {
                        console.error("Error sending session:", sendError);
                    } finally {
                        await cleanUpSession();
                    }
                    
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    GIFTED_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Main error:", err);
            if (!responseSent) {
                res.status(500).json({ code: "QR Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
        }
    }

    try {
        await GIFTED_QR_CODE();
    } catch (finalError) {
        console.error("Final error:", finalError);
        await cleanUpSession();
        if (!responseSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
