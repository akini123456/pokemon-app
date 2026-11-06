
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

test('Firestore merchant security rules', async () => {
  const testId = randomUUID().replaceAll('-', '');
  const storeA = `security-test-a-${testId}`;
  const storeB = `security-test-b-${testId}`;

  const environment = await initializeTestEnvironment({
    projectId: 'cardforge-tcg-dev',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });

  const merchantA = environment.authenticatedContext('merchant-a');
  const merchantB = environment.authenticatedContext('merchant-b');
  const guest = environment.unauthenticatedContext();

  const productPathA = `stores/${storeA}/products/product-1`;
  const productPathB = `stores/${storeB}/products/product-1`;

  const membershipA = `stores/${storeA}/members/merchant-a`;
  const membershipB = `stores/${storeB}/members/merchant-b`;

  const storeData = {
    name: 'Test Card Store',
    email: 'test@example.com',
    description: 'Security test store',
    theme: { primary: '#2563eb' },
  };

  const productData = {
    id: 'product-1',
    name: 'Test Booster Pack',
    game: 'Pokemon',
    sku: 'TEST-001',
    price: 4.99,
    quantity: 25,
    published: true,
  };

  // Seed test records with admin access.
  // These records have unique IDs to avoid real store data.
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'stores', storeA), storeData);
    await setDoc(doc(db, 'stores', storeB), storeData);

    await setDoc(doc(db, membershipA), { role: 'owner' });
    await setDoc(doc(db, membershipB), { role: 'owner' });

    await setDoc(doc(db, productPathA), productData);
    await setDoc(doc(db, productPathB), productData);
  });

  try {
    const dbA = merchantA.firestore();
    const dbB = merchantB.firestore();
    const guestDb = guest.firestore();

    // Test 1: Merchant A can read their own product.
    await assertSucceeds(getDoc(doc(dbA, productPathA)));

    // Test 2: Merchant B can read their own product.
    await assertSucceeds(getDoc(doc(dbB, productPathB)));

    // Test 3: Merchant A cannot read Store B's product.
    await assertFails(getDoc(doc(dbA, productPathB)));

    // Test 4: Merchant A cannot change Store B's inventory.
    await assertFails(
      updateDoc(doc(dbA, productPathB), { quantity: 100 })
    );

    // Test 5: Merchant A can update their own inventory.
    await assertSucceeds(
      updateDoc(doc(dbA, productPathA), { quantity: 10 })
    );

    // Test 6: A guest cannot access a store's private product.
    await assertFails(getDoc(doc(guestDb, productPathA)));

    // Test 7: Merchant A cannot change Store B's branding.
    await assertFails(
      updateDoc(doc(dbA, 'stores', storeB), {
        name: 'Unauthorized Change',
      })
    );

    // Confirm the authorized inventory update actually persisted.
    const updatedProduct = await getDoc(doc(dbA, productPathA));
    assert.equal(updatedProduct.data().quantity, 10);
  } finally {
    // Remove only the test records we created.
    // Do not clear the entire emulator database.
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await deleteDoc(doc(db, productPathA));
      await deleteDoc(doc(db, productPathB));
      await deleteDoc(doc(db, membershipA));
      await deleteDoc(doc(db, membershipB));
      await deleteDoc(doc(db, 'stores', storeA));
      await deleteDoc(doc(db, 'stores', storeB));
    });

    await environment.cleanup();
  }
});
