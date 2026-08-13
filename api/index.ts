import { createApp } from './src/index';

// Vercel serverless entry. The root vercel.json rewrites /api/* here.
// Vercel compiles this TS file and wires the Express app as a Node function.
export default createApp();
