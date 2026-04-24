const DH_PRIME_HEX =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74' +
  '020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437' +
  '4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF05' +
  '98DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB' +
  '9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF';

const DH_PRIME = BigInt(`0x${DH_PRIME_HEX}`);
const DH_GENERATOR = 2n;

function modPow(base, exponent, modulus) {
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus;
    base = (base * base) % modulus;
    exponent = exponent / 2n;
  }
  return result;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function createDhClientHandshake() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const privateKey = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) % (DH_PRIME - 2n) + 2n;
  const publicKey = modPow(DH_GENERATOR, privateKey, DH_PRIME);
  return { privateKey, publicKey: publicKey.toString() };
}

export async function createSharedKey(serverPublicKey, privateKey) {
  const secret = modPow(BigInt(serverPublicKey), privateKey, DH_PRIME);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret.toString(16)));
  return new Uint8Array(hash);
}

export async function encryptText(text, sharedKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', sharedKey, 'AES-GCM', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { 
    iv: bytesToBase64(iv), 
    ciphertext: bytesToBase64(new Uint8Array(encrypted)) 
  };
}

export async function decryptText(payload, sharedKey) {
  if (typeof payload === 'string') return payload; // Системные сообщения не зашифрованы
  try {
    const iv = base64ToBytes(payload.iv);
    const data = base64ToBytes(payload.ciphertext);
    const key = await crypto.subtle.importKey('raw', sharedKey, 'AES-GCM', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return "Ошибка расшифровки";
  }
}