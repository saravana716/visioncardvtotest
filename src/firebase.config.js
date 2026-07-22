import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDc3zvHoU9jvR1KkB1xpLLZExm4Xq3tdNs",
  authDomain: "visionkart---e-commerce.firebaseapp.com",
  projectId: "visionkart---e-commerce",
  storageBucket: "visionkart---e-commerce.firebasestorage.app",
  messagingSenderId: "284466667171",
  appId: "1:284466667171:web:1fd940de4c2cf7e5632916"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Default web persistence is browserLocalPersistence but make it explicit so
// it's also correct in environments where the default is in-memory (some
// iOS / private-mode contexts).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Failed to set auth persistence:", err);
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
