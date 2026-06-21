import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stampsapp.app',
  appName: 'Stamps.',
  webDir: 'public',
  server: {
    url: 'https://stampsapp.vercel.app',
    cleartext: false
  }
};

export default config;
