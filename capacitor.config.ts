import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stampsapp.app',
  appName: 'Stamps.',
  webDir: 'public',
  server: {
    url: 'https://stampsapp.vercel.app',
    cleartext: false
  },
  ios: {
    scheme: 'com.stampsapp.app'
  }
};

export default config;
