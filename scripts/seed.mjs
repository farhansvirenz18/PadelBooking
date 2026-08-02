import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjkttkgqtjxizwdplopn.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3R0a2dxdGp4aXp3ZHBsb3BuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU4Njc1MiwiZXhwIjoyMTAxMTYyNzUyfQ.AtWxnjet9TX6PhJNBF5S0CDxKP3d-HQXRBukp2FNNQo';

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  console.log('Seeding accounts...');

  const admin = await supabase.auth.admin.createUser({
    email: 'admin@aeropadel.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { first_name: 'Admin', last_name: 'Aero' }
  });
  if (admin.error) {
    console.log('Admin auth:', admin.error.message);
  } else {
    console.log('Admin auth: OK -', admin.data.user.id);
    const { error } = await supabase.from('users').upsert({
      id: admin.data.user.id,
      email: 'admin@aeropadel.com',
      first_name: 'Admin',
      last_name: 'Aero',
      role: 'admin',
      phone: '08123456789',
    });
    console.log('Admin profile:', error ? error.message : 'OK');
  }

  const user = await supabase.auth.admin.createUser({
    email: 'user@aeropadel.com',
    password: 'user123',
    email_confirm: true,
    user_metadata: { first_name: 'John', last_name: 'Doe' }
  });
  if (user.error) {
    console.log('User auth:', user.error.message);
  } else {
    console.log('User auth: OK -', user.data.user.id);
    const { error } = await supabase.from('users').upsert({
      id: user.data.user.id,
      email: 'user@aeropadel.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'user',
      phone: '08987654321',
    });
    console.log('User profile:', error ? error.message : 'OK');
  }

  console.log('Done!');
}

seed();
