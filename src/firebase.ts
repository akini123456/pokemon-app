import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
const env = import.meta.env;
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);
let app: FirebaseApp | undefined;
export let auth: Auth | undefined;
export let db: Firestore | undefined;
export let functions: Functions | undefined;
export let storage: FirebaseStorage | undefined;
if (firebaseConfigured) {
    app = getApps()[0] ?? initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, appId: env.VITE_FIREBASE_APP_ID });
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    storage = getStorage(app);
    if (env.VITE_USE_FIREBASE_EMULATORS === 'true') {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
        connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
}
