import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
initializeApp();
const db = getFirestore();
export const createMerchantStore = onCall(async (request) => {
    if (!request.auth)
        throw new HttpsError('unauthenticated', 'Sign in first.');
    const name = typeof request.data?.name === 'string' ? request.data.name.trim() : '';
    const email = typeof request.data?.email === 'string' ? request.data.email.trim() : '';
    if (name.length < 2 || name.length > 80)
        throw new HttpsError('invalid-argument', 'Store name must be 2–80 characters.');
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))
        throw new HttpsError('invalid-argument', 'Enter a valid support email.');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
    if (!slug)
        throw new HttpsError('invalid-argument', 'Store name must include letters or numbers.');
    const storeRef = db.collection('stores').doc();
    const uid = request.auth.uid;
    const batch = db.batch();
    batch.create(storeRef, { name, slug, email, description: '', theme: { primary: '#4d71e8', accent: '#95b4ff', surface: '#ffffff' }, createdAt: FieldValue.serverTimestamp(), createdBy: uid });
    batch.create(storeRef.collection('members').doc(uid), { role: 'owner', active: true, createdAt: FieldValue.serverTimestamp() });
    batch.create(db.collection('users').doc(uid).collection('memberships').doc(storeRef.id), { role: 'owner', createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return { storeId: storeRef.id };
});
