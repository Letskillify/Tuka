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
  "Boutique Collection",
  "Kurtis",
  "Blouse",
  "Designer Blouse",
  "Dress material",
  "Stoles",
  "New Arrivals",
  "DHANIAKHALI"
];
export const DEFAULT_SUBCATEGORIES_DATA = [];
export const DEFAULT_SUBCATEGORIES = [
  "Dhaniakhali Saree",
  "Begumpuri Saree",
  "Shantipuri Saree",
  "Jamdani Saree",
  "Cotton Saree",
  "Silk Saree"
];
export const DEFAULT_BRANDS = ["Tuka"];
export const DEFAULT_ATTRIBUTES = ["Handmade", "Pure Cotton", "Silk Mark", "Handloom"];

export const useCatalogData = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryObjects, setCategoryObjects] = useState([]);
  const [subCategories, setSubCategories] = useState(DEFAULT_SUBCATEGORIES);
  const [subCategoryObjects, setSubCategoryObjects] = useState([]);
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);
  const [attributeObjects, setAttributeObjects] = useState([]);
  const [isCatalogLoaded, setIsCatalogLoaded] = useState(false);

  useEffect(() => {
    let catLoaded = false;
    let subLoaded = false;
    let brandLoaded = false;
    let attrLoaded = false;

    const checkLoaded = () => {
      if (catLoaded && subLoaded && brandLoaded && attrLoaded) {
        setIsCatalogLoaded(true);
      }
    };

    const unsubCat = onSnapshot(collection(db, "categories"), (snap) => {
      const dbCats = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const dbCatNames = dbCats.map((c) => c.name?.trim()).filter(Boolean);
      const uniqueCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCatNames]));
      setCategories(uniqueCats);
      setCategoryObjects(dbCats);
      catLoaded = true;
      checkLoaded();
    });

    const unsubSub = onSnapshot(collection(db, "subcategories"), (snap) => {
      const dbSubs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const dbSubNames = dbSubs.map((s) => s.name?.trim()).filter(Boolean);
      const uniqueSubs = Array.from(new Set([...DEFAULT_SUBCATEGORIES, ...dbSubNames]));
      setSubCategories(uniqueSubs);
      setSubCategoryObjects(dbSubs);
      subLoaded = true;
      checkLoaded();
    });

    const unsubBrand = onSnapshot(collection(db, "brands"), (snap) => {
      const dbBrandNames = snap.docs.map((doc) => doc.data().name?.trim()).filter(Boolean);
      const uniqueBrands = Array.from(new Set([...DEFAULT_BRANDS, ...dbBrandNames]));
      setBrands(uniqueBrands);
      brandLoaded = true;
      checkLoaded();
    });

    const unsubAttr = onSnapshot(collection(db, "attributes"), (snap) => {
      const dbAttrs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const dbAttrNames = dbAttrs.map((a) => a.name?.trim()).filter(Boolean);
      const uniqueAttrs = Array.from(new Set([...DEFAULT_ATTRIBUTES, ...dbAttrNames]));
      setAttributes(uniqueAttrs);
      setAttributeObjects(dbAttrs);
      attrLoaded = true;
      checkLoaded();
    });

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

  const addBrand = async (name, description = "") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = brands.some((b) => b.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      await addDoc(collection(db, "brands"), {
        name: trimmed,
        description: description.trim(),
        status: "Active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
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
    addBrand,
    getSubcategoriesForCategory,
    isCatalogLoaded,
  };
};

