import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const DH_PRIME_HEX =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74' +
  '020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437' +
  '4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF05' +
  '98DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB' +
  '9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF';

const DH_PRIME = BigInt(`0x${DH_PRIME_HEX}`);
const DH_GENERATOR = 2n;

const DB_MASTER_KEY = createHash('sha256')
  .update(process.env.DB_ENCRYPTION_KEY || 'fallback-secret-key-123456789')
  .digest();

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let currentBase = base % modulus;
  let currentExponent = exponent;
  while (currentExponent > 0n) {
    if ((currentExponent & 1n) === 1n) result = (result * currentBase) % modulus;
    currentBase = (currentBase * currentBase) % modulus;
    currentExponent >>= 1n;
  }
  return result;
}

export function createDhServerHandshake(clientPublicKey: string) {
  const peerPublic = BigInt(clientPublicKey);
  const privateKey = BigInt(`0x${randomBytes(32).toString('hex')}`) % (DH_PRIME - 2n) + 2n;
  const serverPublic = modPow(DH_GENERATOR, privateKey, DH_PRIME);
  const sharedSecret = modPow(peerPublic, privateKey, DH_PRIME);
  const sharedKey = createHash('sha256').update(sharedSecret.toString(16)).digest();
  return { serverPublicKey: serverPublic.toString(), sharedKey };
}

export function encryptText(text: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), ciphertext: Buffer.concat([encrypted, cipher.getAuthTag()]).toString('base64') };
}

export function decryptText(payload: { iv: string; ciphertext: string }, key: Buffer) {
  const iv = Buffer.from(payload.iv, 'base64');
  const combined = Buffer.from(payload.ciphertext, 'base64');
  const authTag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function encryptForDb(text: string) {
  const enc = encryptText(text, DB_MASTER_KEY);
  return `DB_ENC:${enc.iv}:${enc.ciphertext}`;
}

export function decryptFromDb(text: string) {
  if (!text.startsWith('DB_ENC:')) return text;
  try {
    const [, iv, ciphertext] = text.split(':');
    return decryptText({ iv, ciphertext }, DB_MASTER_KEY);
  } catch (e) {
    return "Ошибка расшифровки БД";
  }
}