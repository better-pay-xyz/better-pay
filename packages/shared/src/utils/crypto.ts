import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

export function encrypt(plaintext: string, key: string): string {
  // Validate key length (must be 64 hex chars = 32 bytes for AES-256)
  if (key.length !== 64 || !/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('Invalid encryption key: must be 64 hexadecimal characters')
  }

  const keyBuffer = Buffer.from(key, 'hex')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(ciphertext: string, key: string): string {
  // Validate key length (must be 64 hex chars = 32 bytes for AES-256)
  if (key.length !== 64 || !/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('Invalid encryption key: must be 64 hexadecimal characters')
  }

  // Validate ciphertext format
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format: must contain IV:authTag:encrypted')
  }

  const [ivHex, authTagHex, encrypted] = parts

  // Validate component lengths
  if (ivHex.length !== 32 || authTagHex.length !== 32) {
    throw new Error('Invalid ciphertext format: invalid IV or auth tag length')
  }

  const keyBuffer = Buffer.from(key, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function signWebhook(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Validate signature is hex string with correct length (64 chars for SHA256)
  if (!/^[0-9a-f]{64}$/i.test(signature)) {
    return false
  }

  const expected = signWebhook(payload, secret)

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
