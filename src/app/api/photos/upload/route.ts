import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/utils/sanitize';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

const ALLOWED_ENTITY_TYPES = ['corrective_action', 'temperature_log'] as const;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const rl = checkRateLimit(`upload:${ip}`, RATE_LIMITS.upload);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many uploads' }, { status: 429 });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const entityType = formData.get('entityType') as string;
  const entityId = formData.get('entityId') as string;

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ error: 'File, entityType, and entityId required' }, { status: 400 });
  }

  // Validate entityType against whitelist (prevents path traversal)
  if (!ALLOWED_ENTITY_TYPES.includes(entityType as typeof ALLOWED_ENTITY_TYPES[number])) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  }

  // Validate entityId is a UUID
  if (!isValidUuid(entityId)) {
    return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images allowed' }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Safely extract extension from MIME type (not from user filename)
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const ext = mimeToExt[file.type] || 'jpg';
  const fileName = `${entityType}/${entityId}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('photos')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName);

  // Update the entity with photo URL
  const table = entityType === 'corrective_action' ? 'corrective_actions' : 'temperature_logs';
  await supabase
    .from(table)
    .update({ photo_url: publicUrl })
    .eq('id', entityId);

  return NextResponse.json({ url: publicUrl, path: uploadData.path });
}
