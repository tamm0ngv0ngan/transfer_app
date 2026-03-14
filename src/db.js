import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCl2v8Fy8hPzodHbTzj9dLO8Nz8_sjbet8",
    authDomain: "transfer-app-72e93.firebaseapp.com",
    projectId: "transfer-app-72e93",
    storageBucket: "transfer-app-72e93.firebasestorage.app",
    messagingSenderId: "659014364452",
    appId: "1:659014364452:web:5e99a9dd1176996a9597b1"
};

const app = initializeApp(firebaseConfig);
//
// if (location.hostname === "localhost") {
//     self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// }

// noinspection JSUnusedLocalSymbols
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LdoX4osAAAAAHUJkrqLq0uD_h9WInNNk5XEydAF'),
    isTokenAutoRefreshEnabled: true
})
const auth = getAuth(app);
const db = getFirestore(app);


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

export async function addItem(categoryId, itemObject) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function updateItem(categoryId, itemId, value) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function deleteItem(categoryId, itemId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

const createData = async () => {
    try {

    } catch (e) {
        console.error("Error adding document: ", e);
    }
}


export async function fetchCategories() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
        {
            id: "cat_1",
            name: "System Config",
            items: [
                { id: "item_1", key: "MAX_USERS", value: "100", updatedAt: "2026-03-14 10:00:00" },
                { id: "item_2", key: "MAINTENANCE_MODE", value: "false", updatedAt: "2026-03-14 10:05:00" }
            ]
        },
        {
            id: "cat_2",
            name: "API Settings",
            items: [
                { id: "item_3", key: "TIMEOUT_MS", value: "5000", updatedAt: "2026-03-13 15:30:00" }
            ]
        }
    ];
}

export async function updateCategoryItems(categoryId, updatedItems) {
    console.log(`Updating category ${categoryId}:`, updatedItems);
    // Implementation for DB update goes here
    return true;
}

export async function addCategoryItem(categoryId, newItem) {
    console.log(`Adding to ${categoryId}:`, newItem);
    // Implementation for DB insert goes here
    return true;
}

export { auth }