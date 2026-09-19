import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { nextItemNumber } from '../src/util/itemNumber.js';

// Exercise repository behavior without connecting to or changing live Firebase data.
async function repository(metadata, options = {}) {
    const state = { reads: [], commits: [], uploads: 0, removed: [], fail: false };
    let id = 0;
    const sdk = {
        initializeApp: () => ({}), getAuth: () => ({}), getFirestore: () => ({}),
        getStorage: () => ({}), initializeAppCheck: () => ({}),
        ReCaptchaEnterpriseProvider: class {},
        signInWithEmailAndPassword: () => {}, signOut: () => {},
        collection: (_, name) => ({ path: name }),
        doc: (parent, ...parts) => ({ path: parts.length ? parts.join('/') : `${parent.path}/auto${++id}` }),
        getDocFromServer: async reference => {
            state.reads.push(reference.path);
            if (options.readFailure) throw new Error('permission-denied');
            return { exists: () => metadata !== undefined, data: () => ({ ...metadata }) };
        },
        // Any collection read during allocation or initialization is a regression.
        getDocs: () => { throw new Error('Unexpected collection read'); },
        query: () => {}, orderBy: () => {}, updateDoc: async () => {},
        serverTimestamp: () => 'timestamp', deleteField: () => 'DELETE_FIELD',
        writeBatch: () => {
            const writes = [];
            return {
                set: (ref, data, settings) => writes.push({ path: ref.path, data, settings }),
                delete: ref => writes.push({ path: ref.path, deleted: true }),
                commit: async () => {
                    if (state.fail) throw new Error('Write failed');
                    state.commits.push(writes);
                }
            };
        },
        ref: (_, path) => ({ fullPath: path }),
        uploadBytes: async ref => {
            state.uploads++;
            if (options.uploadGate) await options.uploadGate;
            return { ref };
        },
        getDownloadURL: async () => 'https://example.com/file',
        deleteObject: async ref => { state.removed.push(ref.fullPath); },
        formatFirestoreTimestamp: value => value, formatBytes: value => value,
        nextItemNumber
    };
    const module = new SourceTextModule(await readFile(new URL('../src/repository/db.js', import.meta.url), 'utf8'));
    await module.link(() => new SyntheticModule(Object.keys(sdk), function () {
        for (const [name, value] of Object.entries(sdk)) this.setExport(name, value);
    }));
    await module.evaluate();
    return { api: module.namespace, state };
}

test('reads only metadata once and atomically merges full paths when adding', async () => {
    const { api, state } = await repository({ 'text_items/old': 1, 'file_items/old': 3 });
    await Promise.all([api.loadItemNumbers(), api.loadItemNumbers()]);
    await api.addTextItem({ key: 'A', value: 'B' });
    await api.addTextItem({ key: 'C', value: 'D' });
    assert.deepEqual(state.reads, ['metadata/item_numbers']);
    assert.equal(state.commits[0][0].data.itemNumber, 2);
    assert.equal(state.commits[1][0].data.itemNumber, 4);
    assert.deepEqual(state.commits[0][1], {
        path: 'metadata/item_numbers', data: { 'text_items/auto1': 2 }, settings: { merge: true }
    });
});

test('missing metadata does not migrate legacy items; missing entries can be deleted', async () => {
    const { api, state } = await repository();
    await api.loadItemNumbers();
    assert.equal(state.commits.length, 0);
    await api.deleteTextItem('legacy');
    assert.equal(state.commits[0][1].data['text_items/legacy'], 'DELETE_FIELD');
    await api.addTextItem({ key: 'A', value: 'B' });
    assert.equal(state.commits[1][0].data.itemNumber, 1);
});

test('deleting one duplicate preserves the number until the last known owner is removed', async () => {
    const { api, state } = await repository({ 'text_items/a': 1, 'file_items/b': 1 });
    await api.loadItemNumbers();
    await api.deleteTextItem('a');
    await api.addTextItem({ key: 'A', value: 'B' });
    assert.equal(state.commits[1][0].data.itemNumber, 2);
    await api.deleteFileItem('b', 'fileItems/b');
    await api.addTextItem({ key: 'C', value: 'D' });
    assert.equal(state.commits[3][0].data.itemNumber, 1);
});

test('an upload reserves its number while a text item is created', async () => {
    let finishUpload;
    const uploadGate = new Promise(resolve => { finishUpload = resolve; });
    const { api, state } = await repository({}, { uploadGate });
    await api.loadItemNumbers();
    const uploading = api.uploadFile({ name: 'a.txt', size: 10 });
    await api.addTextItem({ key: 'A', value: 'B' });
    finishUpload();
    await uploading;
    assert.equal(state.commits[0][0].data.itemNumber, 2);
    assert.equal(state.commits[1][0].data.itemNumber, 1);
    assert.equal(state.commits[1][1].data['file_items/auto2'], 1);
});

test('failed writes release reservations and clean up uploaded files', async () => {
    const { api, state } = await repository({});
    await api.loadItemNumbers();
    state.fail = true;
    await assert.rejects(api.uploadFile({ name: 'a.txt', size: 10 }), /Write failed/);
    assert.equal(state.removed.length, 1);
    state.fail = false;
    await api.addTextItem({ key: 'A', value: 'B' });
    assert.equal(state.commits[0][0].data.itemNumber, 1);
});

test('full range and failed metadata reads prevent uploads', async () => {
    const full = Object.fromEntries(Array.from({ length: 999 }, (_, index) => [`text_items/${index}`, index + 1]));
    const { api, state } = await repository(full);
    await api.loadItemNumbers();
    await assert.rejects(api.uploadFile({ name: 'a.txt', size: 10 }), /1 to 999/);
    assert.equal(state.uploads, 0);
    const failed = await repository({}, { readFailure: true });
    await assert.rejects(failed.api.loadItemNumbers(), /permission-denied/);
    await assert.rejects(failed.api.addTextItem({ key: 'A', value: 'B' }), /reload/);
    assert.equal(failed.state.commits.length, 0);
});
