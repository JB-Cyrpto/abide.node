import { box, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

export const generateKeyPair = () => {
  const keyPair = box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
};

export const encryptMessage = (message: any, key: string) => {
  const messageUint8 = new TextEncoder().encode(JSON.stringify(message));
  const keyUint8 = decodeBase64(key);
  const nonce = randomBytes(box.nonceLength);
  
  const encrypted = box.after(
    messageUint8,
    nonce,
    keyUint8
  );
  
  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
};

export const decryptMessage = (
  { encrypted, nonce }: { encrypted: string; nonce: string },
  key: string
) => {
  const encryptedUint8 = decodeBase64(encrypted);
  const nonceUint8 = decodeBase64(nonce);
  const keyUint8 = decodeBase64(key);
  
  const decrypted = box.open.after(
    encryptedUint8,
    nonceUint8,
    keyUint8
  );
  
  if (!decrypted) {
    throw new Error('Failed to decrypt message');
  }
  
  return JSON.parse(new TextDecoder().decode(decrypted));
};