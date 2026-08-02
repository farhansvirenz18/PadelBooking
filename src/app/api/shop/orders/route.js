import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('shop_orders')
      .select('*, shop_order_items(*, shop_products(name, image_url))')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Shop orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { items, shippingAddress, notes } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }
    }

    const decremented = [];
    for (const item of items) {
      const { data: success } = await supabaseServer.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      });
      if (!success) {
        for (const d of decremented) {
          await supabaseServer.rpc('decrement_stock', {
            p_product_id: d.productId,
            p_quantity: -d.quantity,
          });
        }
        const { data: product } = await supabaseServer
          .from('shop_products')
          .select('name, stock')
          .eq('id', item.productId)
          .single();
        return NextResponse.json(
          { error: `Insufficient stock for ${product?.name || 'product'}` },
          { status: 400 }
        );
      }
      decremented.push(item);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product } = await supabaseServer
        .from('shop_products')
        .select('price, name')
        .eq('id', item.productId)
        .single();

      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }

    const { data: order, error: orderError } = await supabaseServer
      .from('shop_orders')
      .insert({
        user_id: auth.user.id,
        total_price: totalAmount,
        shipping_address: shippingAddress || null,
        notes: notes || null,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseServer
      .from('shop_order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Shop order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
