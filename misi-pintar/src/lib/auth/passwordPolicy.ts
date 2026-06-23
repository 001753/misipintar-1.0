import { z } from 'zod'

// ─── [7.3] Child Password Policy ──────────────────────────

export const childPasswordSchema = z
  .string()
  .min(6, 'Password minimal 6 karakter')
  .refine((val) => val.trim().length > 0, 'Password tidak boleh kosong')

/**
 * Validasi password anak: min 6 karakter, tidak boleh = username.
 * Throw ZodError atau Error jika tidak valid.
 */
export function validateChildPassword(password: string, username: string): void {
  childPasswordSchema.parse(password)
  if (password.toLowerCase() === username.toLowerCase()) {
    throw new Error('Password tidak boleh sama dengan username')
  }
}

// ─── [7.3] Parent Password Policy ─────────────────────────

export const parentPasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Harus ada minimal 1 huruf kapital')
  .regex(/[0-9]/, 'Harus ada minimal 1 angka')

/**
 * Validasi password parent: min 8 karakter, ada huruf kapital dan angka.
 */
export function validateParentPassword(password: string): void {
  parentPasswordSchema.parse(password)
}
