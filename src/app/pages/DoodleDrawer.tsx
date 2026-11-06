import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { PenTool, Eraser, Trash2, Download, Palette, Undo2 } from "lucide-react";
import { cn } from "../components/ui/utils";

const CANVAS_BG = "#ffffff";
const ERASER = "#ffffff";

const COLORS = [
  { value: "#000000", name: "Black" },
  { value: "#EF4444", name: "Red" },
  { value: "#F59E0B", name: "Amber" },
  { value: "#10B981", name: "Green" },
  { value: "#3B82F6", name: "Blue" },
  { value: "#8B5CF6", name: "Violet" },
  { value: "#EC4899", name: "Pink" },
  { value: "#6B7280", name: "Gray" },
  { value: "#FFFFFF", name: "White" },
] as const;

export function DoodleDrawer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    let saved: string | null = null;
    try {
      saved = localStorage.getItem("doodle");
    } catch {
      saved = null;
    }
    if (saved) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
        setHasDrawing(true);
      };
      img.src = saved;
    }

    const onResize = () => {
      // Preserve the drawing across resizes.
      const current = canvas.toDataURL();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * scale;
      canvas.height = h * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, w, h);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = current;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    snapshotRef.current = canvas.toDataURL();
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Draw a dot so taps register.
    ctx.fillStyle = tool === "eraser" ? ERASER : color;
    ctx.beginPath();
    ctx.arc(x, y, (tool === "eraser" ? lineWidth * 3 : lineWidth) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = tool === "eraser" ? ERASER : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth * 3 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      localStorage.setItem("doodle", canvas.toDataURL());
    } catch {
      toast.error("Couldn't save doodle", { description: "Storage is full — try downloading instead." });
    }
  };

  const undoStroke = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !snapshotRef.current) {
      toast.info("Nothing to undo", { description: "Draw something first." });
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      try {
        localStorage.setItem("doodle", canvas.toDataURL());
      } catch { /* ignore */ }
      toast.success("Undone ↩️");
    };
    img.src = snapshotRef.current;
  };

  const clearCanvas = () => {
    if (!hasDrawing) {
      toast.info("Canvas is already blank", { description: "Draw something fun first!" });
      return;
    }
    if (!window.confirm("Clear the whole canvas? Undo will be available after.")) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    snapshotRef.current = canvas.toDataURL();
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    try {
      localStorage.removeItem("doodle");
    } catch { /* ignore */ }
    setHasDrawing(false);
    toast("Cleared", { action: { label: "Undo", onClick: undoStroke } });
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasDrawing) {
      toast.info("Nothing to download yet", { description: "Draw something first 🎨" });
      return;
    }
    const link = document.createElement("a");
    link.download = `doodle-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Downloaded ⬇️", { description: "Your doodle is saved as a PNG." });
  };

  const toolBtn = (active: boolean) =>
    cn(
      "min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-accent"
    );

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Doodle drawer">
      <div className="page-head">
        <div>
          <p className="page-subtitle mb-0.5">Sketch something whenever 🎨</p>
          <h1 className="page-title">Doodle drawer</h1>
        </div>
        <p className="text-xs text-muted-foreground text-right max-w-36" aria-hidden>
          Tip: drag with mouse or finger.
        </p>
      </div>

      <section className="settings-card" aria-label="Drawing tools">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex gap-2" role="group" aria-label="Tool">
            <button type="button" onClick={() => setTool("pen")} aria-pressed={tool === "pen"} className={toolBtn(tool === "pen")} aria-label="Pen tool">
              <PenTool className="size-5" />
            </button>
            <button type="button" onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"} className={toolBtn(tool === "eraser")} aria-label="Eraser tool">
              <Eraser className="size-5" />
            </button>
          </div>
          <div className="flex gap-1" role="group" aria-label="Canvas actions">
            <button type="button" onClick={undoStroke} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground transition-colors" aria-label="Undo last stroke">
              <Undo2 className="size-5" />
            </button>
            <button type="button" onClick={clearCanvas} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors" aria-label="Clear canvas">
              <Trash2 className="size-5" />
            </button>
            <button type="button" onClick={downloadDrawing} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors" aria-label="Download drawing as PNG">
              <Download className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Palette className="size-5 text-muted-foreground" aria-hidden />
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Pen color">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={`Select ${c.name}`}
                title={c.name}
                onClick={() => {
                  setColor(c.value);
                  if (tool === "eraser") setTool("pen");
                }}
                className={cn(
                  "w-11 h-11 rounded-full border-2 transition-all",
                  color === c.value ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border hover:scale-105"
                )}
                style={{ background: c.value }}
              >
                <span className="sr-only">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 w-full">
          <span className="text-sm text-muted-foreground min-w-fit">Brush size</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            aria-label="Brush size"
            aria-valuetext={`${lineWidth} pixels`}
            className="flex-1 cursor-pointer accent-primary"
          />
          <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">{lineWidth}</span>
        </label>
      </section>

      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden border border-border min-h-[280px] relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Drawing canvas. Use mouse or touch to draw. Keyboard drawing isn't available — use pen or eraser tools and download to save."
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={stopDrawing}
          className="w-full h-full min-h-[280px] touch-none cursor-crosshair block"
        />
        {!hasDrawing && (
          <p className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none" aria-hidden>
            Start drawing here ✨
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Your doodle auto-saves on this device. Keyboard drawing isn&apos;t supported — mouse &amp; touch are the way.
      </p>
    </main>
  );
}
