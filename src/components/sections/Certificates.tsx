import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Trophy, Lightbulb } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch, resolveUrl } from "@/lib/api";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type Certificate = {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  credential_url: string | null;
  description: string | null;
  description_align?: string | null;
  sort_order: number | null;
  status?: "completed" | "learning" | null;
};

// Vite + react-pdf: use ?url so the worker resolves correctly in dev/prod.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function alignClass(value?: string | null) {
  const key = (value || "").toLowerCase();
  if (key === "center") return "text-center";
  if (key === "right") return "text-right";
  if (key === "justify") return "text-justify";
  return "text-left";
}

const Certificates = () => {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Certificate | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfPageNumber, setPdfPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [pageSize, setPageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  const viewerUrl = viewer?.credential_url ? resolveUrl(viewer.credential_url) : null;
  const viewerIsPdf = Boolean(viewerUrl && /\.pdf($|\?)/i.test(viewerUrl));

  useEffect(() => {
    setPageSize({ w: 0, h: 0 });
    setPdfNumPages(0);
    setPdfPageNumber(1);
    setPdfError(null);
  }, [viewerUrl]);

  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewerUrl, viewerIsPdf]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const data = await apiFetch<Certificate[]>("/api/public/certificates");
        setItems(data || []);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load certificates");
        setLoadError(err.message || "Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Certificate[]>();
    for (const c of items) {
      const key = (c.issuer || "Other").trim() || "Other";
      const arr = map.get(key) || [];
      arr.push(c);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [items]);

  const categoryIcon = (category: string) => {
    const key = category.toLowerCase();
    if (key.includes("hack")) return Trophy;
    if (key.includes("quiz")) return Lightbulb;
    if (key.includes("workshop")) return Award;
    return Award;
  };

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Certificates</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : loadError ? (
          <Card className="glass-card border-primary/20 p-8 text-center">
            <p className="text-muted-foreground">{loadError}</p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="glass-card border-primary/20 p-8 text-center">
            <p className="text-muted-foreground">No certificates yet.</p>
          </Card>
        ) : (
          groups.map((group, catIndex) => {
            const Icon = categoryIcon(group.category);
            return (
              <div key={group.category} className="space-y-4">
                <AnimatedSection delay={100 + catIndex * 50}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-semibold text-foreground">{group.category}</h2>
                    <Badge variant="outline" className="ml-auto border-primary/30 text-primary">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                </AnimatedSection>

                <div className="grid md:grid-cols-2 gap-4">
                  {group.items.map((item, itemIndex) => (
                    <AnimatedSection key={item.id} delay={150 + catIndex * 50 + itemIndex * 100}>
                      <Card className="glass-card border-primary/20 p-6 hover-glow cursor-pointer group h-full">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-smooth">
                                  {item.title}
                                </h3>
                                <Badge className={`text-[8px] px-1 py-0 h-4 border ${item.status === "learning"
                                  ? "bg-secondary/10 text-secondary border-secondary/30"
                                  : "bg-primary/10 text-primary border-primary/30"
                                  }`}>
                                  {item.status === "learning" ? "In Progress" : "Completed"}
                                </Badge>
                              </div>
                            </div>
                            {item.date && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{item.date}</span>
                            )}
                          </div>
                          {item.description && (
                            <p className={"text-sm text-foreground/70 leading-relaxed " + alignClass(item.description_align)}>{item.description}</p>
                          )}
                          {item.credential_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewer(item);
                              }}
                              className="text-xs text-primary hover:text-secondary transition-smooth font-medium inline-block"
                            >
                              View Certificate →
                            </button>
                          )}
                        </div>
                      </Card>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={Boolean(viewer)} onOpenChange={(open) => { if (!open) setViewer(null); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{viewer?.title || "Certificate"}</DialogTitle>
          </DialogHeader>
          {viewerUrl && (
            <div className="flex items-center justify-end gap-2 pb-2">
              {viewerIsPdf && !pdfError && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pdfPageNumber <= 1}
                    onClick={() => setPdfPageNumber((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <div className="text-xs text-muted-foreground min-w-[90px] text-center">
                    {pdfNumPages ? `${pdfPageNumber} / ${pdfNumPages}` : "Loading…"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pdfNumPages ? pdfPageNumber >= pdfNumPages : true}
                    onClick={() => setPdfPageNumber((p) => (pdfNumPages ? Math.min(pdfNumPages, p + 1) : p))}
                  >
                    Next
                  </Button>
                </>
              )}

              <a
                href={viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button type="button" variant="outline" size="sm">Download</Button>
              </a>
            </div>
          )}

          <div className="w-full">
            {!viewerUrl ? (
              <div className="text-sm text-muted-foreground">No certificate URL available.</div>
            ) : viewerIsPdf ? (
              <div ref={pdfContainerRef} className="w-full h-[75vh] overflow-hidden rounded-md border border-border bg-background/30 p-3">
                {pdfError ? (
                  <iframe
                    title={viewer?.title || "Certificate"}
                    src={`${viewerUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full rounded-md border-0"
                    // best-effort: avoid scrollbars in some browsers
                    scrolling="no"
                  />
                ) : (
                  <Document
                    file={viewerUrl}
                    onLoadSuccess={(doc) => {
                      setPdfError(null);
                      setPdfNumPages(doc.numPages);
                      setPdfPageNumber(1);
                    }}
                    onLoadError={(err) => {
                      const msg = err instanceof Error ? err.message : String(err);
                      setPdfError(msg || "Unable to load PDF");
                      setPdfNumPages(0);
                    }}
                    loading={<div className="text-sm text-muted-foreground">Loading…</div>}
                    error={<div className="text-sm text-muted-foreground">Unable to load PDF.</div>}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Page
                        pageNumber={pdfPageNumber}
                        scale={(() => {
                          if (!pageSize.w || !pageSize.h) return 1;
                          if (!containerSize.w || !containerSize.h) return 1;

                          // Account for padding so the page fits without scrolling.
                          const availableW = Math.max(0, containerSize.w - 24);
                          const availableH = Math.max(0, containerSize.h - 24);
                          const scaleW = availableW / pageSize.w;
                          const scaleH = availableH / pageSize.h;
                          const scale = Math.min(scaleW, scaleH);

                          // Keep scale sane.
                          return Number.isFinite(scale) && scale > 0 ? Math.min(scale, 2) : 1;
                        })()}
                        onLoadSuccess={(page) => {
                          const sizedPage = page as unknown as {
                            originalWidth?: unknown;
                            originalHeight?: unknown;
                          };
                          const w = Number(sizedPage.originalWidth);
                          const h = Number(sizedPage.originalHeight);
                          if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) setPageSize({ w, h });
                        }}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                  </Document>
                )}
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <img
                  src={viewerUrl}
                  alt={viewer?.title || "Certificate"}
                  className="max-h-[75vh] w-auto rounded-md border border-border"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AnimatedSection delay={300}>
        <Card className="glass-card border-primary/20 p-6">
          <p className="text-sm text-center text-muted-foreground">
            <span className="font-semibold text-foreground">Note:</span>Certificate images and verification links are available.
            All achievements are verifiable through official platforms.
          </p>
        </Card>
      </AnimatedSection>
    </section>
  );
};

export default Certificates;
