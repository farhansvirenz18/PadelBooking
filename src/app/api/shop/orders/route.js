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

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabaseServer
        .from('shop_products')
        .select('*')
        .eq('id', item.productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const { data: order, error: orderError } = await supabaseServer
      .from('shop_orders')
      .insert({
        user_id: auth.user.id,
        total_amount: totalAmount,
        shipping_address: shippingAddress || null,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending',
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

    for (const item of items) {
      await supabaseServer.rpc('decrement_stock', {
        product_id: item.productId,
        quantity: item.quantity,
      }).catch(() => {
        return supabaseServer
          .from('shop_products')
          .select('stock')
          .eq('id', item.productId)
          .single()
          .then(({ data }) => {
            return supabaseServer
              .from('shop_products')
              .update({ stock: data.stock - item.quantity })
              .eq('id', item.productId);
          });
      });
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Shop order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
