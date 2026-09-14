import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../components/Firebase";

export const DEFAULT_CATEGORIES = [
  "Saree",
  "Handloom Saree",
  "Designer Blouse",
  "Boutique Collection",
  "Kurtis",
  "Stoles",
  "Dress material",
  "New Arrivals",
];

export const DEFAULT_SUBCATEGORIES_DATA = [
  { name: "Dhaniakhali Saree", category: "Saree", description: "Traditional Bengal Dhaniakhali cotton weave with fine border work" },
  { name: "Begumpuri Saree", category: "Saree", description: "Lightweight woven Begumpuri cotton saree with handloom motif" },
  { name: "Shantipuri Saree", category: "Saree", description: "Fine texture Shantipuri woven cotton saree" },
  { name: "Hindshree Saree", category: "Saree", description: "Exclusive Hindshree luxury heritage handloom signature saree" },
];

export const DEFAULT_SUBCATEGORIES = DEFAULT_SUBCATEGORIES_DATA.map((s) => s.name);

export const DEFAULT_BRANDS = ["Tuka", "Boutique"];

export const DEFAULT_ATTRIBUTES = [
  "Deal",
  "Hot",
  "Sale",
  "Trending",
  "New Arrival",
  "Exclusive",
  "Handmade",
  "Limited Edition",
  "Bestseller"
];

export const useCatalogData = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryObjects, setCategoryObjects] = useState([]);
  const [subCategories, setSubCategories] = useState(DEFAULT_SUBCATEGORIES);
  const [subCategoryObjects, setSubCategoryObjects] = useState([]);
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);
  const [attributeObjects, setAttributeObjects] = useState([]);

  useEffect(() => {
    // 1. Listen to Categories
    const unsubCat = onSnapshot(collection(db, "categories"), (snap) => {
      const dbCats = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const dbNames = dbCats.map((c) => c.name).filter(Boolean);
      const mergedNames = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbNames]));

      // Create category objects combining Firestore and defaults
      const combinedObjects = [...dbCats];
      DEFAULT_CATEGORIES.forEach((defName) => {
        if (!combinedObjects.some((c) => c.name?.toLowerCase() === defName.toLowerCase())) {
          combinedObjects.push({ name: defName, status: "Active", isDefault: true });
        }
      });

      setCategories(mergedNames);
      setCategoryObjects(combinedObjects);
    });

    // 2. Listen to Subcategories
    const unsubSub = onSnapshot(collection(db, "subcategories"), (snap) => {
      const dbSubs = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const allowedLower = DEFAULT_SUBCATEGORIES.map((n) => n.toLowerCase());
      const filteredDbSubs = dbSubs.filter((s) => s.name && allowedLower.includes(s.name.toLowerCase()));

      const dbNames = filteredDbSubs.map((s) => s.name).filter(Boolean);
      const mergedNames = Array.from(new Set([...DEFAULT_SUBCATEGORIES, ...dbNames]));

      const combinedObjects = [...filteredDbSubs];
      DEFAULT_SUBCATEGORIES_DATA.forEach((defSub) => {
        if (!combinedObjects.some((s) => s.name?.toLowerCase() === defSub.name.toLowerCase())) {
          combinedObjects.push({
            name: defSub.name,
            category: defSub.category,
            description: defSub.description,
            status: "Active",
            isDefault: true,
          });
        }
      });

      setSubCategories(mergedNames);
      setSubCategoryObjects(combinedObjects);
    });

    // 3. Listen to Brands
    const unsubBrand = onSnapshot(collection(db, "brands"), (snap) => {
      const dbBrands = snap.docs.map((doc) => doc.data().name).filter(Boolean);
      const merged = Array.from(new Set([...DEFAULT_BRANDS, ...dbBrands]));
      setBrands(merged);
    });

    // 4. Listen to Attributes
    const unsubAttr = onSnapshot(collection(db, "attributes"), (snap) => {
      const dbAttrs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const dbNames = dbAttrs.map((a) => a.name).filter(Boolean);
      const mergedNames = Array.from(new Set([...DEFAULT_ATTRIBUTES, ...dbNames]));
      setAttributes(mergedNames);
      setAttributeObjects(dbAttrs);
    });

    // Seed missing defaults into Firestore if desired & delete legacy extra subcategories
    const seedDefaults = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const existingCatNames = catSnap.docs.map((d) => d.data().name?.toLowerCase()).filter(Boolean);
        for (const catName of DEFAULT_CATEGORIES) {
          if (!existingCatNames.includes(catName.toLowerCase())) {
            await addDoc(collection(db, "categories"), {
              name: catName,
              description: `${catName} collection`,
              status: "Active",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        const subSnap = await getDocs(collection(db, "subcategories"));
        const allowedLower = DEFAULT_SUBCATEGORIES_DATA.map((s) => s.name.toLowerCase());

        // Remove legacy non-allowed subcategories from Firestore
        for (const docSnap of subSnap.docs) {
          const name = docSnap.data().name;
          if (name && !allowedLower.includes(name.toLowerCase())) {
            try {
              await deleteDoc(doc(db, "subcategories", docSnap.id));
            } catch (err) {
              console.warn("Error removing legacy subcategory:", err.message);
            }
          }
        }

        const updatedSubSnap = await getDocs(collection(db, "subcategories"));
        const existingSubNames = updatedSubSnap.docs.map((d) => d.data().name?.toLowerCase()).filter(Boolean);
        for (const subItem of DEFAULT_SUBCATEGORIES_DATA) {
          if (!existingSubNames.includes(subItem.name.toLowerCase())) {
            await addDoc(collection(db, "subcategories"), {
              name: subItem.name,
              category: subItem.category || "Saree",
              description: subItem.description || "",
              status: "Active",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        const attrSnap = await getDocs(collection(db, "attributes"));
        const existingAttrNames = attrSnap.docs.map((d) => d.data().name?.toLowerCase()).filter(Boolean);
        for (const attrName of DEFAULT_ATTRIBUTES) {
          if (!existingAttrNames.includes(attrName.toLowerCase())) {
            await addDoc(collection(db, "attributes"), {
              name: attrName,
              description: `${attrName} attribute tag`,
              status: "Active",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        console.warn("Catalog auto-seeding notice:", err.message);
      }
    };

    seedDefaults();

    return () => {
      unsubCat();
      unsubSub();
      unsubBrand();
      unsubAttr();
    };
  }, []);

  const addCategory = async (name, description = "", group = "General") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = categoryObjects.find(
      (c) => c.name?.toLowerCase() === trimmed.toLowerCase() && c.id
    );
    if (!exists) {
      await addDoc(collection(db, "categories"), {
        name: trimmed,
        description: description.trim(),
        group: group.trim() || "General",
        status: "Active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const addAttribute = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = attributeObjects.find((a) => a.name?.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      await addDoc(collection(db, "attributes"), {
        name: trimmed,
        description: `${trimmed} tag`,
        status: "Active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const updateCategory = async (id, data) => {
    if (!id) return;
    await updateDoc(doc(db, "categories", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteCategory = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, "categories", id));
  };

  const addSubCategory = async (name, category = "", description = "") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = subCategoryObjects.find(
      (s) => s.name?.toLowerCase() === trimmed.toLowerCase() && s.id
    );
    if (!exists) {
      await addDoc(collection(db, "subcategories"), {
        name: trimmed,
        category: category || "",
        description: description.trim(),
        status: "Active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const updateSubCategory = async (id, data) => {
    if (!id) return;
    await updateDoc(doc(db, "subcategories", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteSubCategory = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, "subcategories", id));
  };

  // Helper to get subcategories for a given category name
  const getSubcategoriesForCategory = (catName) => {
    if (!catName) return subCategories;
    const matching = subCategoryObjects.filter(
      (s) =>
        s.category?.toLowerCase() === catName.toLowerCase() ||
        !s.category ||
        s.name?.toLowerCase().includes(catName.toLowerCase()) ||
        catName.toLowerCase().includes(s.name?.split(" ")[0].toLowerCase())
    );
    return matching.length > 0 ? matching.map((s) => s.name) : subCategories;
  };

  return {
    categories,
    categoryObjects,
    subCategories,
    subCategoryObjects,
    brands,
    attributes,
    attributeObjects,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addAttribute,
    getSubcategoriesForCategory,
  };
};

