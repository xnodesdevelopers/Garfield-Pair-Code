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

/* ───────────── MEGA CONFIG (FINAL) ───────────── */

const MEGA_EMAIL = 'zenoinoize@gmail.com';     // 🔐 YOUR MEGA EMAIL
const MEGA_PASSWORD = 'openacc000';            // 🔐 YOUR MEGA PASSWORD

/* ───────────── HELPERS ───────────── */

function randomMegaId(length = 6, numberLength = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res + Math.floor(Math.random() * 10 ** numberLength);
}

async function uploadCredsToMega(credsPath) {
  const storage = await new Storage({
    email: MEGA_EMAIL,
    password: MEGA_PASSWORD
  }).ready;

  const size = fs.statSync(credsPath).size;

  const upload = await storage.upload(
    { name: `${randomMegaId()}.json`, size },
    fs.createReadStream(credsPath)
  ).complete;

  const file = storage.files[upload.nodeId];
  return await file.link();
}

function removeFile(path) {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true, force: true });
  }
}

/* ───────────── ROUTE ───────────── */

router.get('/', async (req, res) => {
  const id = giftedid();
  const dir = `./temp/${id}`;

  async function GIFTED_QR() {
    const { state, saveCreds } = await useMultiFileAuthState(dir);

    try {
      const Gifted = Gifted_Tech({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: 'fatal' })
          )
        },
        logger: pino({ level: 'fatal' }),
        browser: Browsers.macOS('Safari'),
        printQRInTerminal: false
      });

      Gifted.ev.on('creds.update', saveCreds);

      Gifted.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;

        /* ── QR SEND ── */
        if (qr && !res.headersSent) {
          const qrImage = await QRCode.toDataURL(qr);
          return res.send({ qr: qrImage });
        }

        /* ── CONNECTED ── */
        if (connection === 'open') {
          await delay(5000);

          const credsPath = `${dir}/creds.json`;
          if (!fs.existsSync(credsPath)) return;

          const megaUrl = await uploadCredsToMega(credsPath);
          const sid = megaUrl.includes('https://mega.nz/file/')
            ? 'Xnodes~' + megaUrl.split('https://mega.nz/file/')[1]
            : 'Invalid Session';

          const sessionMsg = await Gifted.sendMessage(
            Gifted.user.id,
            { text: sid },
            { disappearingMessagesInChat: true, ephemeralExpiration: 600 }
          );

          const GIFTED_TEXT = `▎ ️ＧＡＲＦＩΞ𝖫𝖣 𝖡𝖮Т
▎ Powered by Xnodes
▎ Neural AI v1.00
▎━━━━━━━━━━━━━━━━━━
▎ https://github.com/xnodesdev/GARFIELD-WHATSAPP-BOT-v10
▎━━━━━━━━━━━━━━━━━━
> © Powered by Xnodes`;

          await Gifted.sendMessage(
            Gifted.user.id,
            { text: GIFTED_TEXT },
            { quoted: sessionMsg, disappearingMessagesInChat: true, ephemeralExpiration: 600 }
          );

          await delay(200);
          await Gifted.ws.close();
          return removeFile(dir);
        }

        /* ── RECONNECT ── */
        if (
          connection === 'close' &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await delay(10000);
          GIFTED_QR();
        }
      });
    } catch (err) {
      console.error('QR Service Error:', err);
      removeFile(dir);
      if (!res.headersSent) {
        res.send({ error: 'Service Unavailable' });
      }
    }
  }

  return GIFTED_QR();
});

export default router;
