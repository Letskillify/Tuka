import React, { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../components/Firebase";

const DataMigration = ({ collectionName, label = "Data" }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            setLoading(true);
            const snap = await getDocs(collection(db, collectionName));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${collectionName}_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert(`Export failed for ${collectionName}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const text = await file.text();
            const jsonData = JSON.parse(text);
            if (!Array.isArray(jsonData)) throw new Error("Invalid JSON format. Expected an array of objects.");

            const batch = writeBatch(db);
            let count = 0;

            jsonData.forEach((item) => {
                let docRef;
                if (item.id) {
                    const { id, ...dataToSave } = item;
                    docRef = doc(db, collectionName, id);
                    batch.set(docRef, dataToSave, { merge: true });
                } else {
                    docRef = doc(collection(db, collectionName));
                    batch.set(docRef, item);
                }
                count++;
            });

            await batch.commit();
            alert(`Successfully imported ${count} items into ${collectionName}. Restart/refresh the page to see changes.`);
        } catch (err) {
            alert(`Import failed for ${collectionName}: ${err.message}`);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleExport}
                disabled={loading}
                title={`Export ${label}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
                <Download size={13} className="text-[#b13896]" />
                <span>Export</span>
            </button>

            <label
                title={`Import ${label}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#b13896]/10 text-[#b13896] border border-[#b13896]/20 rounded-lg hover:bg-[#b13896]/20 transition-colors cursor-pointer shadow-sm ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <Upload size={13} />
                <span>Import</span>
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImport}
                />
            </label>
        </div>
    );
};

export default DataMigration;
