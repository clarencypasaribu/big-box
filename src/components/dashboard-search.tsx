"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, FileText, Layout, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
    type: "project" | "task";
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

export function DashboardSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        async function fetchResults() {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [debouncedQuery]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    return (
        <>
            <div className="relative w-full max-w-sm">
                <Button
                    variant="outline"
                    className="relative h-11 w-full justify-start rounded-md border-slate-200 bg-slate-100/60 pl-4 pr-10 text-sm text-slate-500 hover:bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60"
                    onClick={() => setOpen(true)}
                >
                    <Search className="mr-2 size-4 opacity-50" />
                    <span>Search Task, Docs, Projects...</span>
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 dark:bg-slate-800">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
                    <DialogHeader className="px-4 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <Search className="size-5 text-muted-foreground" />
                            <input
                                className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground"
                                placeholder="Type a command or search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogTitle className="sr-only">Search</DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {loading && (
                            <div className="flex items-center justify-center py-6 text-muted-foreground">
                                <Loader2 className="animate-spin size-5 mr-2" />
                                Scanning...
                            </div>
                        )}

                        {!loading && query.length > 0 && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found for "{query}"
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <div className="space-y-1">
                                <h4 className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suggestions</h4>
                                {results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result.url)}
                                        className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center size-8 rounded-md bg-opacity-10",
                                            result.type === 'project' ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                                        )}>
                                            {result.type === 'project' ? <Layout className="size-4" /> : <FileText className="size-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{result.title}</span>
                                            <span className="text-xs text-slate-500">{result.subtitle}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex gap-2">
                            <span><kbd className="font-sans border rounded px-1">↵</kbd> to select</span>
                            <span><kbd className="font-sans border rounded px-1">esc</kbd> to close</span>
                        </div>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
}
