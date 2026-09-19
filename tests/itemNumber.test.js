import test from 'node:test';
import assert from 'node:assert/strict';
import { nextItemNumber } from '../src/util/itemNumber.js';

// Verify the shared range and reuse behavior independently of Firebase.
test('starts at 1 and chooses the smallest available number', () => {
    assert.equal(nextItemNumber(new Set()), 1);
    assert.equal(nextItemNumber(new Set([1, 3, 4])), 2);
});

test('allocates 999 but rejects an exhausted range', () => {
    const used = new Set(Array.from({ length: 998 }, (_, index) => index + 1));
    assert.equal(nextItemNumber(used), 999);
    used.add(999);
    assert.throws(() => nextItemNumber(used), /1 to 999/);
});
