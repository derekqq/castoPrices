import { Router, Request, Response } from 'express';
import { connectDB } from './db';
import { Product } from './types';

const router = Router();

// Get product by EAN
router.get('/products/:ean', async (req: Request, res: Response) => {
  const db = await connectDB();
  const product = await db.collection('products').findOne({ ean: req.params.ean });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Add new product
router.post('/products', async (req: Request, res: Response) => {
  const db = await connectDB();
  const prod: Product = req.body;
  await db.collection('products').insertOne(prod);
  res.status(201).json({ success: true });
});

// Update product store info
router.put('/products/:ean/store', async (req: Request, res: Response) => {
  const db = await connectDB();
  const { store } = req.body;
  await db.collection('products').updateOne(
    { ean: req.params.ean },
    { $push: { stores: store } }
  );
  res.json({ success: true });
});

// Get products for a given storeId
router.get('/markets/:storeId/products', async (req: Request, res: Response) => {
  const db = await connectDB();
  const products = await db.collection('products').find({
    'stores.storeId': req.params.storeId
  }).project({ ean: 1, name: 1, imageUrl: 1, _id: 0 }).toArray();
  res.json(products);
});

export default router;
