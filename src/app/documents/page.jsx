"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, UploadCloud, FileText, Trash2, 
  Sparkles, Search, ChevronLeft, ChevronRight 
} from "lucide-react";
import { toast } from "react-hot-toast";
import Spinner from "@/components/spinner";

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch logic wrapped in an effect to handle page/search changes
  useEffect(() => {
    if (status === "authenticated") {
      // Debounce search to avoid hammering the database on every keystroke
      const delayDebounceFn = setTimeout(() => {
        fetchDocuments(currentPage, searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [status, currentPage, searchQuery]);

  const fetchDocuments = async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      }
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 whenever the search term changes
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Processing and vectorizing PDF content...");

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to process");

      toast.success("Document added & vector indexed! ✨", { id: toastId });
      
      // Refresh list to maintain accurate pagination rather than just unshifting
      fetchDocuments(1, searchQuery);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    const toastId = toast.loading("Deleting documentation framework layers...");
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error || data.message || "Failed to delete target infrastructure data");
        throw new Error(data.error || data.message || "Failed to delete target infrastructure data");
      }
      
      toast.success("Deleted document and cleaned vector nodes", { id: toastId });
      
      // Refetch current page to pull in the next document if one was deleted
      fetchDocuments(currentPage, searchQuery);
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  if (status === "loading") {
    return <div className="h-screen bg-[#0d0d0f] flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] font-['DM_Sans'] text-gray-200 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Sticky Header Configuration 
          Added: sticky, top-0, z-50, backdrop blur, background transparency, and a subtle bottom border
        */}
        <div className="sticky top-0 z-50 bg-[#0d0d0f]/80 backdrop-blur-xl pt-6 pb-4 sm:pt-10 sm:pb-6 mb-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="w-10 h-10 rounded-xl bg-[#17171e] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white flex-shrink-0">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Syne'] text-white tracking-tight flex items-center gap-2">
                Knowledge Base <Sparkles size={20} className="text-indigo-400" />
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Upload personal PDFs. System cross-references and cites them inline.</p>
            </div>
          </div>
        </div>

        {/* Upload Interface Form Zone */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <label className={`relative block w-full rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden group
            ${isUploading 
              ? 'border-indigo-500/50 bg-indigo-500/5 cursor-not-allowed' 
              : 'border-white/10 bg-[#17171e]/50 hover:border-indigo-500/40 hover:bg-[#1a1a24] cursor-pointer'
            }
          `}>
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="py-10 sm:py-14 px-4 flex flex-col items-center justify-center relative z-10 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-2xl bg-[#0d0d0f] border border-white/5 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UploadCloud size={26} className="text-indigo-400" />
                )}
              </div>
              <p className="text-base sm:text-lg font-medium text-white mb-1">
                {isUploading ? "Extracting Text & Embedding Coordinates..." : "Click to Upload Knowledge PDF"}
              </p>
              <p className="text-xs text-gray-500 max-w-xs px-2">
                Supports individual vectors up to 5MB. Fully tracked and secure under standard relational schemas.
              </p>
            </div>
          </label>
        </div>

        {/* Search Bar Component */}
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search active file repositories by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-[#17171e] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 focus:bg-[#1a1a24] transition-all"
            />
          </div>
        </div>

        {/* Document Grid/List Section */}
        <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">Active File Repositories</h2>
          
          {isLoading && documents.length === 0 ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-[#17171e]/50 rounded-2xl border border-white/5 p-8 text-center text-gray-500 text-sm">
              {searchQuery ? "No documents match your search criteria." : "No documentation added yet. Drop a vector set above to initialize parsing."}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="group bg-[#17171e] border border-white/5 rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:bg-[#1a1a24] hover:border-white/10 transition-all duration-200">
                    
                    {/* Inline Document Presentation Link Wrapper */}
                    <a 
                      href={`/api/documents/${doc._id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center gap-3 sm:gap-4 overflow-hidden cursor-pointer"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="truncate pr-2">
                        <p className="text-sm font-medium text-gray-200 truncate group-hover:text-indigo-400 transition-colors">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                    
                    <button
                      onClick={(e) => handleDelete(e, doc._id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0d0d0f] border border-white/5 text-gray-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 flex items-center justify-center transition-all sm:opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-pointer"
                      title="Evict Document Layer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  
                  <span className="text-xs font-medium text-gray-500 bg-[#17171e] border border-white/5 px-3 py-1.5 rounded-lg">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}