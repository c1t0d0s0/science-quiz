// Firebase のアプリとログイン。記録の同期 (firebase.ts) と 理科たいせん (battle-net.ts) で 1 つを使う。
// どちらもあとから読みこむファイルなので、Firebase を使わない人の最初の表示はおそくならない。
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import type { FirebaseConfig } from './config';

let shared: { app: FirebaseApp; auth: Auth } | null = null;

export function firebaseApp(config: FirebaseConfig, emulator: boolean): { app: FirebaseApp; auth: Auth } {
  if (!shared) {
    const app = initializeApp(config);
    const auth = getAuth(app);
    if (emulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    shared = { app, auth };
  }
  return shared;
}
