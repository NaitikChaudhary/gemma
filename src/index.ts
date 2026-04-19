import express, { type Request, type Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health Check API
// This endpoint is crucial for cloud deployments (like Cloudflare or AWS) 
// to verify that the instance is running.
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Example Route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Cloudflare-ready Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});