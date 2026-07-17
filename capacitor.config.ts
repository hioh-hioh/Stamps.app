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
    scheme: 'com.stampsapp.app',
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '368587032324-pp8j5cuq1s5223kj6501btrh29k8qvg9.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
