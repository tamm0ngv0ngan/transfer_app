import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore, query, collection, doc, getDocs, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { formatFirestoreTimestamp } from "../util/time.js";

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
 * @property {string} key
 * @property {string} value
 * @property {string} updatedAt - when create/update item, code js auto add
 * */


/**
 * @return {TextItem[]}
* */
export async function getAllTextItems() {
    const q = query(collection(db, "text_items"), orderBy("updatedAt", "desc"));
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
    const { key, value, updatedAt = serverTimestamp() } = textItem;
    await addDoc(collection(db, "text_items"), {key, value, updatedAt});
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

export async function deleteTextItem(itemId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export { auth }