import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDorASBu8xqBlB2XHrzE0yJEF1DbGpgnYg',
  authDomain: 'iloveush.firebaseapp.com',
  projectId: 'iloveush',
  storageBucket: 'iloveush.firebasestorage.app',
  messagingSenderId: '790838389663',
  appId: '1:790838389663:web:48a086c0180962640cabaa',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
