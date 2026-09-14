import React, { useRef, useState } from "react";
import { Cloud, Computer, Crown, Images, Trash2 } from "lucide-react";
import CloudinaryImageLibrary from "./CloudinaryImageLibrary";

const ProductMediaPicker = ({ value = [], onChange }) => {
  const inputRef = useRef(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const addComputerFiles = (event) => {
    const files = Array.from(event.target.files || []);
    const additions = files.map((file) => ({ id: `local-${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file), source: "computer" }));
    onChange([...value, ...additions]);
    event.target.value = "";
  };
  const addCloudinaryAssets = (assets) => onChange([...value, ...assets.filter((asset) => !value.some((item) => item.publicId === asset.publicId))]);
  const setPrimary = (id) => onChange([value.find((item) => item.id === id), ...value.filter((item) => item.id !== id)].filter(Boolean));
  const remove = (id) => onChange(value.filter((item) => item.id !== id));
  return <>
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[12px] font-bold text-slate-800">Images & Media</h2><p className="mt-1 text-[14px] text-slate-500">First image is the primary storefront image; the rest are secondary gallery images.</p></div><div className="flex gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-[#8d1234]/30 px-3 py-2 text-[14px] font-semibold text-[#8d1234]"><Computer size={14}/>From computer</button><button type="button" onClick={() => setLibraryOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-[#8d1234] px-3 py-2 text-[14px] font-semibold text-white"><Cloud size={14}/>From Cloudinary</button></div></div><input ref={inputRef} onChange={addComputerFiles} type="file" multiple accept="image/*,video/*" className="hidden"/>
      {!value.length ? <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-[14px] text-slate-500"><div><Images className="mx-auto mb-2 text-[#8d1234]" size={24}/><p className="font-semibold">Add product photos or video</p><p className="mt-1 text-[14px]">Choose files from your computer or existing Cloudinary media.</p></div></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{value.map((media, index) => <div key={media.id} className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-slate-50 ${index === 0 ? "border-[#8d1234]" : "border-slate-100"}`}>{media.file?.type?.startsWith("video/") ? <video src={media.url} className="h-full w-full object-cover"/> : <img src={media.url} alt="Product media" className="h-full w-full object-cover"/>}<div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/60 p-1.5">{index === 0 ? <span className="flex items-center gap-1 text-[9px] font-bold text-white"><Crown size={11}/>Primary</span> : <button type="button" onClick={() => setPrimary(media.id)} className="text-[9px] font-semibold text-white">Set primary</button>}<button type="button" onClick={() => remove(media.id)} className="rounded p-1 text-white hover:bg-white/20" title="Remove image"><Trash2 size={13}/></button></div></div>)}</div>}</section>
    {libraryOpen && <CloudinaryImageLibrary multiple onSelect={addCloudinaryAssets} onClose={() => setLibraryOpen(false)}/>}</>
};
export default ProductMediaPicker;
