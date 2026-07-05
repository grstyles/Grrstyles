require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('categories').insert([{
    title: 'Test',
    slug: 'test',
    image_url: 'test.png',
    bg_color: '#fff',
    priority: 0,
    enabled: true,
    redirect_link: '/test'
  }]).select();
  console.log("Insert test:", data, error);
  if (data) {
    await supabase.from('categories').delete().eq('id', data[0].id);
  }
}

testInsert();
