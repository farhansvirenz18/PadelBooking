import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const ALLOWED_AVATAR_DOMAINS = ['supabase.co', 'supabase.in', 'googleusercontent.com'];

function validateAvatarUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_AVATAR_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data: profile, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', auth.user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { first_name, last_name, phone, avatar_url } = body;

    const updateData = {};
    if (first_name !== undefined) {
      if (typeof first_name !== 'string' || first_name.length > MAX_NAME_LENGTH) {
        return NextResponse.json({ error: `First name must be under ${MAX_NAME_LENGTH} characters` }, { status: 400 });
      }
      updateData.first_name = first_name.trim();
    }
    if (last_name !== undefined) {
      if (typeof last_name !== 'string' || last_name.length > MAX_NAME_LENGTH) {
        return NextResponse.json({ error: `Last name must be under ${MAX_NAME_LENGTH} characters` }, { status: 400 });
      }
      updateData.last_name = last_name.trim();
    }
    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.length > MAX_PHONE_LENGTH) {
        return NextResponse.json({ error: `Phone must be under ${MAX_PHONE_LENGTH} characters` }, { status: 400 });
      }
      updateData.phone = phone.trim();
    }
    if (avatar_url !== undefined) {
      if (avatar_url && !validateAvatarUrl(avatar_url)) {
        return NextResponse.json({ error: 'Invalid avatar URL domain' }, { status: 400 });
      }
      updateData.avatar_url = avatar_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', auth.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
