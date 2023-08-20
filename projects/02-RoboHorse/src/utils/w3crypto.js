import crypto from 'crypto';
import hkdf from 'futoin-hkdf';
import { parse } from 'uuid';

const authTagLength = 16;
const keyByteLength = 32;
const keyHash = 'SHA-256';
const algo = 'aes-256-gcm'; // crypto library does not accept this in uppercase. So gotta keep using aes-256-gcm

function urlEncodeHashKey(keyBuffer) {
	return keyBuffer.toString('base64').replace('=', '');
}

// Derive a key from the user's id
export const deriveDriveKey = async (seed, dataEncryptionKey) => {
	const info = dataEncryptionKey;
	const driveKey = hkdf(Buffer.from(seed), keyByteLength, {info, hash: keyHash});
	return urlEncodeHashKey(driveKey);
}

// Derive a key from the user's Drive Key and the File Id
export const deriveFileKey = async (driveKey, fileId) => {
	const iv = Buffer.from(driveKey, 'base64');
	const info = Buffer.from(parse(fileId));
	const fileKey = hkdf(iv, keyByteLength, {info, hash: keyHash});
	return urlEncodeHashKey(fileKey);
}


// New Drive decryption function, using KDF and AES-256-GCM
export const driveEncrypt = async (driveKey, data) => {
	const keyData = Buffer.from(driveKey, 'base64');
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(algo, keyData, iv, {authTagLength});
	const encryptedBuffer = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
	return {
		cipher: 'AES256-GCM',
		cipherIV: iv.toString('base64'),
		data: encryptedBuffer
	};
}

// New File encryption function using a buffer and using KDF with AES-256-GCM
export const fileEncrypt = async (fileKey, data) => {
	const keyData = Buffer.from(fileKey, 'base64');
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(algo, keyData, iv, {authTagLength});
	const encryptedBuffer = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
	return {
		cipher: 'AES256-GCM',
		cipherIV: iv.toString('base64'),
		data: encryptedBuffer
	};
}




// New Drive decryption function, using KDF and AES-256-GCM; cipherIV: string, fileKey: string, data: Buffer
export async function driveDecrypt(cipherIV, driveKey, data) {
	const authTag = data.slice(data.byteLength - authTagLength, data.byteLength);
	const encryptedDataSlice = data.slice(0, data.byteLength - authTagLength);
	const iv = Buffer.from(cipherIV, 'base64');
	const keyData = Buffer.from(driveKey, 'base64');
	const decipher = crypto.createDecipheriv(algo, keyData, iv, { authTagLength });
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(encryptedDataSlice), decipher.final()]);
}

// New File decryption function, using KDF and AES-256-GCM
export async function fileDecrypt(cipherIV, fileKey, data) {
	try {
		const authTag = data.slice(data.byteLength - authTagLength, data.byteLength);
		const encryptedDataSlice = data.slice(0, data.byteLength - authTagLength);
		const iv = Buffer.from(cipherIV, 'base64');
		const keyData = Buffer.from(fileKey, 'base64');
		const decipher = crypto.createDecipheriv(algo, keyData, iv, { authTagLength });
		decipher.setAuthTag(authTag);
		return Buffer.concat([decipher.update(encryptedDataSlice), decipher.final()]);
	} catch (err) {
		// console.log (err);
		console.log('Error decrypting file data');
		return Buffer.from('Error', 'ascii');
	}
}