// Skrypt do importu przykładowych danych do MongoDB
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = 'mongodb://localhost:27017';
const dbName = 'castoPrices';
const file = './products.sample.json';

async function importData() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const products = JSON.parse(fs.readFileSync(file, 'utf8'));
  await db.collection('products').deleteMany({});
  await db.collection('products').insertMany(products);
  console.log('Import completed');
  await client.close();
}

importData();
