import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import CodeCard from "./CodeCard";

export default function CodesShowcase({ sourceDocument, title, description, categories }) {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["codesOfTruth", sourceDocument],
    queryFn: () => base44.entities.CodeOfTruth.filter({ source_document: sourceDocument, status: "approved" }),
  });

  const filteredCodes = useMemo(() => {
    return codes.filter(code => {
      const matchCat = activeCategory === "All" || code.category === activeCategory;
      const matchSearch = (code.slogan_text || "").toLowerCase().includes(search.toLowerCase()) || 
                          (code.title || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [codes, activeCategory, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black font-['Space_Grotesk'] text-white mb-4 tracking-tight">{title}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">{description}</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeCategory === "All" ? "bg-[#00CFFF] text-black" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeCategory === cat ? "bg-[#00CFFF] text-black" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#121826] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00CFFF]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
      ) : filteredCodes.length === 0 ? (
        <div className="text-center py-20 bg-[#121826]/50 rounded-3xl border border-white/5">
          <p className="text-gray-400 text-lg">No codes found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredCodes.map(code => (
            <CodeCard key={code.id} code={code} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}