import express from 'express';
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
import { Storage } from 'megajs';
import { giftedid } from './id.js';
import {
  default as Gifted_Tech,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';

const router = express.Router();

/* ───────────── MEGA CONFIG ───────────── */
const MEGA_EMAIL = 'zenoinoize@gmail.com'; // Mega email
const MEGA_PASSWORD = 'openacc000';        // Mega password

/* ───────────── HELPERS ───────────── */
function randomMegaId(length = 6, numberLength = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < length; i++) res += chars[Math.floor(Math.random() * chars.length)];
  return res + Math.floor(Math.random() * 10 ** numberLength);
}

async function uploadCredsToMega(credsPath) {
  const storage = await new Storage({ email: MEGA_EMAIL, password: MEGA_PASSWORD }).ready;
  const size = fs.statSync(credsPath).size;
  const upload = await storage.upload({ name: `${randomMegaId()}.json`, size }, fs.createReadStream(credsPath)).complete;
  const file = storage.files[upload.nodeId];
  return await file.link();
}

function removeFile(path) {
  if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
}

/* ───────────── ROUTE ───────────── */
router.get('/', async (req, res) => {
  const id = giftedid();
  const dir = `./temp/${id}`;
  const phoneNumber = req.query.number?.replace(/\D/g, '');

  if (!phoneNumber) return res.status(400).send({ error: 'Phone number required' });

  async function GIFTED_QR() {
    const { state, saveCreds } = await useMultiFileAuthState(dir);

    try {
      const Gifted = Gifted_Tech({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        logger: pino({ level: 'fatal' }),
        browser: Browsers.macOS('Safari'),
        printQRInTerminal: false
      });

      Gifted.ev.on('creds.update', saveCreds);

      let qrSent = false;

      Gifted.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;

        // ── QR CODE SEND ──
        if (qr && !qrSent && !res.headersSent) {
          qrSent = true;
          const qrImage = await QRCode.toDataURL(qr);
          return res.send({
            qr: qrImage,
            instructions: [
              '1. Open WhatsApp on your phone',
              '2. Go to Settings > Linked Devices',
              '3. Tap "Link a Device"',
              '4. Scan the QR code above'
            ]
          });
        }

        // ── CONNECTED ──
        if (connection === 'open') {
          await delay(5000);
          const credsPath = `${dir}/creds.json`;
          if (!fs.existsSync(credsPath)) return;

          const megaUrl = await uploadCredsToMega(credsPath);
          const xnodesCode = megaUrl.includes('https://mega.nz/file/')
            ? 'Xnodes~' + megaUrl.split('https://mega.nz/file/')[1]
            : 'Invalid Session';

          // Send Xnodes code to WhatsApp number
          await Gifted.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
            text: `🎯 Your Xnodes session code:\n${xnodesCode}`
          });

          const infoText = `▎ ️ＧＡＲＦＩΞ𝖫𝖣 𝖡𝖮Ｔ
▎ Powered by Xnodes
▎ Neural AI v1.00
▎━━━━━━━━━━━━━━━━━━
▎ https://github.com/xnodesdev/GARFIELD-WHATSAPP-BOT-v10
▎━━━━━━━━━━━━━━━━━━
> © Powered by Xnodes`;

          await Gifted.sendMessage(`${phoneNumber}@s.whatsapp.net`, { text: infoText });

          await delay(200);
          await Gifted.ws.close();
          return removeFile(dir);
        }

        // ── RECONNECT ──
        if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
          await delay(10000);
          GIFTED_QR();
        }
      });
    } catch (err) {
      console.error('QR Service Error:', err);
      removeFile(dir);
      if (!res.headersSent) res.send({ error: 'Service Unavailable' });
    }
  }

  return GIFTED_QR();
});

export default router;
