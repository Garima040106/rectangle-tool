import React, { useState, useRef, useEffect } from 'react';
import { Square, Move, MousePointer } from 'lucide-react';

const RectangleShapeTool = () => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('select');
  const [rectangles, setRectangles] = useState([]);
  const [selectedRect, setSelectedRect] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  const [fillColor, setFillColor] = useState('#3b82f6');
  const [borderColor, setBorderColor] = useState('#1e40af');
  const [borderWidth, setBorderWidth] = useState(2);

  useEffect(() => {
    drawCanvas();
  }, [rectangles, selectedRect, currentRect]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all rectangles
    rectangles.forEach((rect, index) => {
      ctx.fillStyle = rect.fillColor;
      ctx.strokeStyle = rect.borderColor;
      ctx.lineWidth = rect.borderWidth;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      // Draw selection handles
      if (selectedRect === index) {
        drawSelectionHandles(ctx, rect);
      }
    });

    // Draw current rectangle being drawn
    if (currentRect) {
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  };

  const drawSelectionHandles = (ctx, rect) => {
    const handles = getHandlePositions(rect);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    handles.forEach(handle => {
      ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
      ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
    });
  };

  const getHandlePositions = (rect) => {
    return [
      { x: rect.x, y: rect.y, cursor: 'nw-resize', type: 'nw' },
      { x: rect.x + rect.width, y: rect.y, cursor: 'ne-resize', type: 'ne' },
      { x: rect.x, y: rect.y + rect.height, cursor: 'sw-resize', type: 'sw' },
      { x: rect.x + rect.width, y: rect.y + rect.height, cursor: 'se-resize', type: 'se' }
    ];
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const isPointInRect = (point, rect) => {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
  };

  const getHandleAtPoint = (point, rect) => {
    const handles = getHandlePositions(rect);
    for (let handle of handles) {
      const distance = Math.sqrt(Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2));
      if (distance <= 6) {
        return handle;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);

    if (tool === 'rectangle') {
      setDrawing(true);
      setStartPos(pos);
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === 'select') {
      // Check if clicking on a handle
      if (selectedRect !== null) {
        const rect = rectangles[selectedRect];
        const handle = getHandleAtPoint(pos, rect);
        if (handle) {
          setResizing(true);
          setResizeHandle(handle);
          setStartPos(pos);
          return;
        }
      }

      // Check if clicking on a rectangle
      for (let i = rectangles.length - 1; i >= 0; i--) {
        if (isPointInRect(pos, rectangles[i])) {
          setSelectedRect(i);
          setMoving(true);
          setStartPos(pos);
          return;
        }
      }
      setSelectedRect(null);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);

    if (drawing && currentRect) {
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;
      setCurrentRect({
        x: width < 0 ? pos.x : startPos.x,
        y: height < 0 ? pos.y : startPos.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    } else if (moving && selectedRect !== null) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      setRectangles(prev => prev.map((rect, index) => {
        if (index === selectedRect) {
          return { ...rect, x: rect.x + dx, y: rect.y + dy };
        }
        return rect;
      }));
      setStartPos(pos);
    } else if (resizing && selectedRect !== null && resizeHandle) {
      const rect = rectangles[selectedRect];
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      let newRect = { ...rect };

      switch (resizeHandle.type) {
        case 'se':
          newRect.width += dx;
          newRect.height += dy;
          break;
        case 'sw':
          newRect.x += dx;
          newRect.width -= dx;
          newRect.height += dy;
          break;
        case 'ne':
          newRect.y += dy;
          newRect.width += dx;
          newRect.height -= dy;
          break;
        case 'nw':
          newRect.x += dx;
          newRect.y += dy;
          newRect.width -= dx;
          newRect.height -= dy;
          break;
      }

      setRectangles(prev => prev.map((r, index) => index === selectedRect ? newRect : r));
      setStartPos(pos);
    }
  };

  const handleMouseUp = () => {
    if (drawing && currentRect && currentRect.width > 5 && currentRect.height > 5) {
      setRectangles([...rectangles, { ...currentRect, fillColor, borderColor, borderWidth }]);
      setCurrentRect(null);
    }
    setDrawing(false);
    setMoving(false);
    setResizing(false);
    setResizeHandle(null);
  };

  const updateSelectedRect = (property, value) => {
    if (selectedRect !== null) {
      setRectangles(prev => prev.map((rect, index) => {
        if (index === selectedRect) {
          return { ...rect, [property]: value };
        }
        return rect;
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        <button
          onClick={() => setTool('select')}
          className={`p-3 rounded-lg transition-colors ${
            tool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Select Tool"
        >
          <MousePointer size={24} />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-3 rounded-lg transition-colors ${
            tool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Rectangle Tool"
        >
          <Square size={24} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-white shadow-lg cursor-crosshair"
        />
      </div>

      {/* Properties Panel */}
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Properties</h3>
        
        {tool === 'rectangle' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fill Color</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Border Color</label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Border Width: {borderWidth}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={borderWidth}
                onChange={(e) => setBorderWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {selectedRect !== null && tool === 'select' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fill Color</label>
              <input
                type="color"
                value={rectangles[selectedRect].fillColor}
                onChange={(e) => updateSelectedRect('fillColor', e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Border Color</label>
              <input
                type="color"
                value={rectangles[selectedRect].borderColor}
                onChange={(e) => updateSelectedRect('borderColor', e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Border Width: {rectangles[selectedRect].borderWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={rectangles[selectedRect].borderWidth}
                onChange={(e) => updateSelectedRect('borderWidth', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {selectedRect === null && tool === 'select' && (
          <p className="text-sm text-gray-500">Select a rectangle to edit its properties</p>
        )}
      </div>
    </div>
  );
};

export default RectangleShapeTool;
