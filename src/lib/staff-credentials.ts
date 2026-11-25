import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const SALT = process.env.SUPABASE_SERVICE_ROLE_KEY || 'driveease_secure_salt_2026'
const RESERVED_OWNER_IDS = new Set(['jalorecarrentel@gmail.com', 'jalorecarrentel'])

export function hashStaffSecret(value: string, identifier: string): string {
  return crypto
    .createHash('sha256')
    .update(`${value}:${identifier}:${SALT}`)
    .digest('hex')
}

/**
 * Deduplicate login identifiers (email, username, short username, employee code)
 * before upserting into `system_auth_credentials` so PostgreSQL never sees duplicate
 * conflict keys in a single `ON CONFLICT DO UPDATE` batch.
 */
export async function upsertStaffCredentials(
  supabaseAdmin: SupabaseClient,
  password: string,
  rawIdentifiers: Array<string | null | undefined>
) {
  const uniqueIds = Array.from(
    new Set(
      rawIdentifiers
        .filter((v): v is string => Boolean(v && v.trim()))
        .map(v => v.trim().toLowerCase())
        .filter(v => !RESERVED_OWNER_IDS.has(v))
    )
  )

  if (uniqueIds.length === 0) {
    throw new Error('At least one valid login identifier is required.')
  }

  const nowIso = new Date().toISOString()
  const records = uniqueIds.map(identifier => ({
    email: identifier,
    password_hash: hashStaffSecret(password, identifier),
    updated_at: nowIso,
  }))

  return supabaseAdmin
    .from('system_auth_credentials')
    .upsert(records, { onConflict: 'email' })
}
