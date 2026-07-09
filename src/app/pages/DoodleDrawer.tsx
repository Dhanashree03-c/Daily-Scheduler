import { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Trash2, Download, Palette } from 'lucide-react';

export function DoodleDrawer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;

    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    const saved = localStorage.getItem('doodle');
    if (saved) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = saved;
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      localStorage.setItem('doodle', canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('doodle');
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `doodle-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    { value: '#000000', className: 'bg-[#000000]' },
    { value: '#EF4444', className: 'bg-[#EF4444]' },
    { value: '#F59E0B', className: 'bg-[#F59E0B]' },
    { value: '#10B981', className: 'bg-[#10B981]' },
    { value: '#3B82F6', className: 'bg-[#3B82F6]' },
    { value: '#8B5CF6', className: 'bg-[#8B5CF6]' },
    { value: '#EC4899', className: 'bg-[#EC4899]' },
    { value: '#6B7280', className: 'bg-[#6B7280]' },
    { value: '#FFFFFF', className: 'bg-[#FFFFFF] border-gray-300' }
  ];

  return (
    <div className="pb-20 px-4 pt-6 max-w-2xl mx-auto h-screen flex flex-col">
      <h1 className="text-2xl mb-4">Doodle Drawer</h1>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pen')}
              aria-label="Pen tool"
              title="Pen tool"
              className={`p-2 rounded-lg ${
                tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <Pen className="size-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              aria-label="Eraser tool"
              title="Eraser tool"
              className={`p-2 rounded-lg ${
                tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <Eraser className="size-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCanvas}
              aria-label="Clear canvas"
              title="Clear canvas"
              className="p-2 rounded-lg bg-red-100 text-red-600"
            >
              <Trash2 className="size-5" />
            </button>
            <button
              onClick={downloadDrawing}
              aria-label="Download drawing"
              title="Download drawing"
              className="p-2 rounded-lg bg-green-100 text-green-600"
            >
              <Download className="size-5" />
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2 mb-3">
          <Palette className="size-5 text-gray-600" />
          <div className="flex gap-2 flex-wrap">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                aria-label={`Select color ${c.value}`}
                title={`Color ${c.value}`}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c.value ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'
                } ${c.className}`}
              />
            ))}
          </div>
        </div>

        {/* Line Width */}
        <label className="flex items-center gap-3 w-full">
          <span className="text-sm text-gray-600 min-w-fit">Size:</span>
  
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            aria-label="Brush size"
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <span className="text-sm text-gray-600 w-8">{lineWidth}</span>
        </label>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
}
