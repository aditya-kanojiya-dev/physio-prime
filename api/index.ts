import { createApp } from '../server/src/index';

// Vercel serverless entry. The root vercel.json rewrites /api/* here.
// Vercel bundles this file (and its imports from ../server) into ONE
// Node function. The full server source stays in server/ so Vercel's
// api/ scan sees a single file instead of 46 separate functions.
export default createApp();
