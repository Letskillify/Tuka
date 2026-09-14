import React, { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cloudinaryConfig } from "../../../config/cloudinary";

const assetUrl = (asset) => `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/v${asset.version}/${asset.public_id}.${asset.format}`;

const CloudinaryImageLibrary = ({ onSelect, onClose, multiple = false }) => {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/list/${cloudinaryConfig.galleryTag}.json`);
        if (response.ok) setImages((await response.json()).resources || []);
        else if (response.status !== 404) setError("Cloudinary resource listing is not enabled. Enable Client-side resource listing in Cloudinary Security settings.");
      } catch {
        setError("Unable to load the Cloudinary gallery. Check the cloud name and connection.");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const toggle = (asset) => {
    if (!multiple) { onSelect(assetUrl(asset)); onClose(); return; }
    setSelected((current) => {
      const next = new Set(current);
      next.has(asset.public_id) ? next.delete(asset.public_id) : next.add(asset.public_id);
      return next;
    });
  };
  const confirm = () => {
    const assets = images.filter((asset) => selected.has(asset.public_id)).map((asset) => ({ id: asset.public_id, url: assetUrl(asset), publicId: asset.public_id, source: "cloudinary" }));
    onSelect(assets);
    onClose();
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">Cloudinary Media Library</h3><p className="mt-1 text-xs text-slate-500">{multiple ? "Select one or more images for this product." : "Select an image for this product."}</p></div><button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></div>
      <div className="min-h-64 flex-1 overflow-y-auto p-5">
        {loading ? <div className="grid h-56 place-items-center text-sm text-slate-500"><Loader2 className="animate-spin text-[#8d1234]"/></div> : error ? <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{error}</div> : images.length === 0 ? <div className="grid h-56 place-items-center text-sm text-slate-400">No images found in this Cloudinary gallery.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{images.map((asset) => { const active = selected.has(asset.public_id); return <button type="button" key={asset.public_id} onClick={() => toggle(asset)} className={`group relative aspect-square overflow-hidden rounded-lg border-2 text-left ${active ? "border-[#8d1234]" : "border-transparent hover:border-[#8d1234]/40"}`}><img src={assetUrl(asset)} alt={asset.public_id} className="h-full w-full object-cover"/>{multiple && <span className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full ${active ? "bg-[#8d1234] text-white" : "bg-white/90 text-transparent"}`}><Check size={13}/></span>}<span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/55 px-2 py-1 text-[14px] text-white">{asset.public_id.split("/").pop()}</span></button>; })}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4"><button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold">Cancel</button>{multiple && <button disabled={!selected.size} onClick={confirm} className="rounded-md bg-[#8d1234] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Add selected ({selected.size})</button>}</div>
    </div>
  </div>;
};

export default CloudinaryImageLibrary;
