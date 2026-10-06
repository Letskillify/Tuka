import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const items = [
    { product_no: "KANDH001", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 1947, mrp: 2350 },
    { product_no: "KANDH004", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 1995, mrp: 2400 },
    { product_no: "KANDH005", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2059, mrp: 2500 },
    { product_no: "KANDH006", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2107, mrp: 2550 },
    { product_no: "KANDH007", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2107, mrp: 2550 },
    { product_no: "KANDH008", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2475, mrp: 3000 },
    { product_no: "KANDH009", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2475, mrp: 3000 },
    { product_no: "KANDH010", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2475, mrp: 3000 },
    { product_no: "KANDH002", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 1947, mrp: 2350 },
    { product_no: "KANDH021", fabric: "COTTON", name: "DHANIAKHALI", sale_price: 2795, mrp: 3360 },
];

async function uploadProducts() {
    console.log("Starting product upload...");

    // 1. Ensure DHANIAKHALI category exists in Firestore
    const catRef = collection(db, "categories");
    const qCat = query(catRef, where("name", "==", "DHANIAKHALI"));
    const catSnap = await getDocs(qCat);
    if (catSnap.empty) {
        await addDoc(catRef, {
            name: "DHANIAKHALI",
            description: "Traditional Bengal Dhaniakhali Cotton Weave",
            status: "Active",
            group: "General",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("Created category: DHANIAKHALI");
    } else {
        console.log("Category DHANIAKHALI already exists.");
    }

    // 2. Upload products
    const productsRef = collection(db, "products");
    let count = 0;
    for (const item of items) {
        const orig = item.mrp;
        const sel = item.sale_price;
        const discount = orig ? Math.round(((orig - sel) / orig) * 100) : 0;

        const docData = {
            product_no: item.product_no,
            name: item.name,
            category: "DHANIAKHALI",
            subCategory: "",
            brand: "Tuka",
            material: item.fabric,
            original_price: orig,
            price: sel,
            discount: discount,
            stock: 10,
            stock_status: "In Stock",
            status: "Published",
            visibility: "Public",
            description: `Authentic ${item.fabric} Dhaniakhali Handloom Saree (${item.product_no})`,
            care_instructions: "Dry clean or mild hand wash in cold water",
            tags: ["dhaniakhali", "cotton", "handloom", "saree"],
            images: [],
            image: "",
            attributes: ["Handmade"],
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(productsRef, docData);
        count++;
        console.log(`[${count}/${items.length}] Uploaded product ${item.product_no} with ID: ${docRef.id}`);
    }

    console.log(`Success! ${count} products uploaded.`);
    process.exit(0);
}

uploadProducts().catch(err => {
    console.error("Error uploading products:", err);
    process.exit(1);
});
