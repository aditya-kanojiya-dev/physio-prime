import { createApp } from './index';

// ponytail: single dev server; the app boots from this entry, tests use createApp() directly.
const port = Number(process.env.PORT) || 4000;
createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
