import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const { code, totalAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    const { data: voucher, error } = await supabaseServer
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });
    }

    const now = new Date();

    if (voucher.valid_from && new Date(voucher.valid_from) > now) {
      return NextResponse.json({ error: 'Voucher is not yet valid' }, { status: 400 });
    }

    if (voucher.valid_until && new Date(voucher.valid_until) < now) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
    }

    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
    }

    if (voucher.min_amount && totalAmount && parseFloat(totalAmount) < parseFloat(voucher.min_amount)) {
      return NextResponse.json({
        error: `Minimum order amount is ${voucher.min_amount}`,
      }, { status: 400 });
    }

    let discountAmount = 0;
    const orderAmount = parseFloat(totalAmount) || 0;

    if (voucher.discount_type === 'percentage') {
      discountAmount = (orderAmount * parseFloat(voucher.discount_value)) / 100;
      if (voucher.max_discount) {
        discountAmount = Math.min(discountAmount, parseFloat(voucher.max_discount));
      }
    } else if (voucher.discount_type === 'fixed') {
      discountAmount = parseFloat(voucher.discount_value);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discount_type,
        discountValue: parseFloat(voucher.discount_value),
        discountAmount: Math.round(discountAmount * 100) / 100,
        maxDiscount: voucher.max_discount ? parseFloat(voucher.max_discount) : null,
      },
    });
  } catch (error) {
    console.error('Voucher validate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
