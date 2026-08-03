const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'visionkart-de0dd' // This is the projectId from Firestore configuration
  });
}

const db = admin.firestore();

async function inspect() {
  console.log("Fetching Contact Lenses products...");
  const snapshot = await db.collection('products')
    .where('category', '==', 'Contact Lenses')
    .get();
    
  const subcategories = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    subcategories.add(data.contactLensSubcategory || data.subcategory || '(none)');
    console.log(`- Product: ${data.name || data.model}, Subcategory: ${data.contactLensSubcategory || data.subcategory || '(none)'}`);
  });
  
  console.log("\nUnique subcategories found:", Array.from(subcategories));
}

inspect().catch(console.error);
