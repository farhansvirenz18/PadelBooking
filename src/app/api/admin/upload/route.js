import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateFile } from '@/lib/auth';

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const bucket = formData.get('bucket') || 'uploads';

    const validation = validateFile(file);
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseServer.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: urlData.publicUrl, path: filePath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
