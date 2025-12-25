import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

export function encrypt(plaintext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(ciphertext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex')
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')

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
