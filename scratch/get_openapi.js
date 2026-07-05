async function run() {
  const url = 'https://xqxnezvhrmyndpsfmrbc.supabase.co/';
  const res = await fetch(url, {
    headers: {
      'apikey': 'sb_publishable_CruAlkyqfm5m5ESTirHCzg_EiygSydt',
      'Authorization': 'Bearer sb_publishable_CruAlkyqfm5m5ESTirHCzg_EiygSydt'
    }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  if (data && data.definitions && data.definitions.products) {
    console.log('Products columns in OpenAPI schema:', Object.keys(data.definitions.products.properties));
  } else {
    console.log('Could not find products definition. Root keys:', Object.keys(data));
  }
}

run().catch(console.error);
