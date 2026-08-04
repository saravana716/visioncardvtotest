import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDc3zvHoU9jvR1KkB1xpLLZExm4Xq3tdNs",
  authDomain: "visionkart---e-commerce.firebaseapp.com",
  projectId: "visionkart---e-commerce",
  storageBucket: "visionkart---e-commerce.firebasestorage.app",
  messagingSenderId: "284466667171",
  appId: "1:284466667171:web:1fd940de4c2cf7e5632916"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Fetching categories...");
  const catSnap = await getDocs(collection(db, 'categories'));
  catSnap.forEach(doc => {
    console.log("Category ID:", doc.id, "Data:", doc.data());
  });

  console.log("\nFetching products categories...");
  const prodSnap = await getDocs(collection(db, 'products'));
  const cats = new Set();
  prodSnap.forEach(doc => {
    const data = doc.data();
    if (data.category) cats.add(data.category);
  });
  console.log("Distinct product categories:", Array.from(cats));
  process.exit(0);
}

run().catch(console.error);
