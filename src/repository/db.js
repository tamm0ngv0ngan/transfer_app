import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore, query, collection, doc, getDocs, getDocFromServer, writeBatch, deleteField, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { formatFirestoreTimestamp } from "../util/time.js";
import {formatBytes} from "../util/file.js";
import { nextItemNumber } from '../util/itemNumber.js';

const firebaseConfig = {
    apiKey: "AIzaSyCl2v8Fy8hPzodHbTzj9dLO8Nz8_sjbet8",
    authDomain: "transfer-app-72e93.firebaseapp.com",
    projectId: "transfer-app-72e93",
    storageBucket: "transfer-app-72e93.firebasestorage.app",
    messagingSenderId: "659014364452",
    appId: "1:659014364452:web:5e99a9dd1176996a9597b1"
};

const app = initializeApp(firebaseConfig);

// noinspection JSUnusedLocalSymbols
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LdoX4osAAAAAHUJkrqLq0uD_h9WInNNk5XEydAF'),
    isTokenAutoRefreshEnabled: true
})
const auth = getAuth(app);
const db = getFirestore(app, "transfer-app");
const storage = getStorage(app, "gs://transfer-app-72e93.firebasestorage.app");

const itemNumbersRef = doc(db, "metadata", "item_numbers");
let itemNumbers = null;
let itemNumbersRequest = null;
const reservedNumbers = new Set();

/**
 * Read metadata from the server once per page load after authentication.
 * Missing metadata starts an empty registry; legacy items are never migrated.
 */
export async function loadItemNumbers() {
    if (!itemNumbersRequest) {
        itemNumbersRequest = getDocFromServer(itemNumbersRef).then(snapshot => {
            itemNumbers = snapshot.exists() ? snapshot.data() : {};
        });
    }
    await itemNumbersRequest;
}

/**
 * Reserve a number locally while a create or upload is in progress.
 * Other browsers may still choose the same number, which is acceptable.
 * @return {number}
 */
function allocateItemNumber() {
    if (!itemNumbers) {
        throw new Error('Item numbers could not be loaded. Please reload the page before adding an item.');
    }
    const usedNumbers = new Set([...Object.values(itemNumbers), ...reservedNumbers]);
    const itemNumber = nextItemNumber(usedNumbers);
    reservedNumbers.add(itemNumber);
    return itemNumber;
}

/**
 * Store an item and its full document path in the registry atomically.
 * Merge only this field to preserve changes made by other browsers.
 */
async function createItem(collectionName, data) {
    const docRef = doc(collection(db, collectionName));
    const batch = writeBatch(db);
    batch.set(docRef, data);
    batch.set(itemNumbersRef, { [docRef.path]: data.itemNumber }, { merge: true });
    await batch.commit();
    itemNumbers[docRef.path] = data.itemNumber;
}

/**
 * Remove only this item's registry entry, even when another item shares its number.
 * A merge also allows legacy items to be deleted before the registry exists.
 */
async function deleteItem(docRef) {
    const batch = writeBatch(db);
    batch.delete(docRef);
    batch.set(itemNumbersRef, { [docRef.path]: deleteField() }, { merge: true });
    await batch.commit();
    if (itemNumbers) {
        delete itemNumbers[docRef.path];
    }
}

function formatAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/invalid-email':
            return 'The email address is badly formatted.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        default:
            return `Authentication failed: ${errorCode.replace('auth/', '').replace(/-/g, ' ')}`;
    }
}

export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        return {success: true, token, user: userCredential.user };
    } catch (error) {
        const errorMessage = error.message;
        // Example: "Firebase: Error (auth/invalid-credential)." -> "auth/invalid-credential"
        const errorCode = errorMessage.match(/\(([^)]+)\)/)?.[1] || errorMessage;
        return {success: false, message: formatAuthError(errorCode)};
    }
}

export async function logout() {
    try {
        await signOut(auth);
        return {success: true};
    } catch (error) {
        return {success: false, message: error.message};
    }
}

/**
 * @typedef {Object} TextItem
 * @property {string} id
 * @property {number} itemNumber - shared number from 1 to 999
 * @property {string} key
 * @property {string} value
 * @property {string} createdAt - when create item
 * @property {string} updatedAt - when update item, code js auto add
 * */


/**
 * @return {TextItem[]}
* */
export async function getAllTextItems() {
    const q = query(collection(db, "text_items"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
    }));
}

/**
 * @param textItem
 */
export async function addTextItem(textItem) {
    // Release the local reservation on both success and failure.
    const itemNumber = allocateItemNumber();
    try {
        const { key, value, createdAt = serverTimestamp(), updatedAt = serverTimestamp() } = textItem;
        await createItem("text_items", {key, value, createdAt, updatedAt, itemNumber});
    } finally {
        reservedNumbers.delete(itemNumber);
    }
}

/**
 * @param {string} itemId
 * @param {string} value
* */
export async function updateTextItem(itemId, value) {
    const docRef = doc(db, "text_items", itemId);
    await updateDoc(docRef, {
        value,
        updatedAt: serverTimestamp()
    });
}

/**
 * @param {string} itemId
 * */
export async function deleteTextItem(itemId) {
    const docRef = doc(db, "text_items", itemId);
    await deleteItem(docRef);
}

/**
 * @typedef {Object} FileItem
 * @property {number} itemNumber - shared number from 1 to 999
 * @property {string} name
 * @property {string} size
 * @property {string} url
 * @property {string} path
 * @property {string} updatedAt - when upload file
 * */


export async function getAllFileItems() {
    const q = query(collection(db, "file_items"), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        size: formatBytes(doc.data().size),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
    }));
}

/**
 * @param {FileItem} fileItem
* */
async function addFileItem(fileItem) {
    const { name, size, url, path, itemNumber, updatedAt = serverTimestamp()} = fileItem;
    // File metadata and its registry entry must be committed together.
    await createItem("file_items", {name, size, url, updatedAt, path, itemNumber});
}

/**
 * @param {File} file
 * */
export async function uploadFile(file) {
    // Check capacity before uploading and reserve the number until the write finishes.
    const itemNumber = allocateItemNumber();
    let uploadedRef = null;
    try {
        const storageRef = ref(storage, `fileItems/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        uploadedRef = snapshot.ref;
        const downloadUrl = await getDownloadURL(snapshot.ref);
        await addFileItem({
            itemNumber,
            name: file.name,
            size: file.size,
            url: downloadUrl,
            path: snapshot.ref.fullPath,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        // Remove an uploaded file if its URL or Firestore metadata could not be saved.
        if (uploadedRef) {
            try {
                await deleteObject(uploadedRef);
            } catch (cleanupError) {
                console.error('Could not remove the uploaded file:', cleanupError);
            }
        }
        throw error;
    } finally {
        reservedNumbers.delete(itemNumber);
    }
}


/**
 * @param {string} itemId
 * @param {string} path
* */
export async function deleteFileItem(itemId, path) {
    const fileRef = ref(storage, path);
    // Allow retrying the Firestore deletion if the Storage file was already removed.
    try {
        await deleteObject(fileRef);
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            throw error;
        }
    }

    const docRef = doc(db, "file_items", itemId);
    await deleteItem(docRef);
}



export { auth }
