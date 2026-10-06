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

export const DEFAULT_CATEGORIES = [];
export const DEFAULT_SUBCATEGORIES_DATA = [];
export const DEFAULT_SUBCATEGORIES = [];
export const DEFAULT_BRANDS = [];
export const DEFAULT_ATTRIBUTES = [];

export const useCatalogData = () => {
  const [categories, setCategories] = useState([]);
  const [categoryObjects, setCategoryObjects] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryObjects, setSubCategoryObjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [attributeObjects, setAttributeObjects] = useState([]);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, "categories"), (snap) => {
      const dbCats = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setCategories(dbCats.map((c) => c.name).filter(Boolean));
      setCategoryObjects(dbCats);
    });

    const unsubSub = onSnapshot(collection(db, "subcategories"), (snap) => {
      const dbSubs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setSubCategories(dbSubs.map((s) => s.name).filter(Boolean));
      setSubCategoryObjects(dbSubs);
    });

    const unsubBrand = onSnapshot(collection(db, "brands"), (snap) => {
      setBrands(snap.docs.map((doc) => doc.data().name).filter(Boolean));
    });

    const unsubAttr = onSnapshot(collection(db, "attributes"), (snap) => {
      const dbAttrs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setAttributes(dbAttrs.map((a) => a.name).filter(Boolean));
      setAttributeObjects(dbAttrs);
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
  };
};

