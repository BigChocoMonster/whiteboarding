import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";

let cursorPosition: { x: number; y: number };

function App() {
  const [selectedColor, setSelectedColor] = useState<string>("#000000");

  const contextRef = useRef<CanvasRenderingContext2D>(null);

  useEffect(() => {
    const canvas = document.getElementById("board") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    if (context) {
      // @ts-ignore
      contextRef.current = context;
    }
  }, [selectedColor]);

  const saveCursorPosition = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      cursorPosition = { x: event.clientX, y: event.clientY };
    },
    []
  );

  const draw = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (contextRef.current && event.buttons === 1) {
        contextRef.current.beginPath();

        contextRef.current.moveTo(cursorPosition.x, cursorPosition.y);

        contextRef.current.lineWidth = 1;
        contextRef.current.lineCap = "round";
        contextRef.current.strokeStyle = selectedColor;

        cursorPosition = { x: event.clientX, y: event.clientY };

        contextRef.current.lineTo(cursorPosition.x, cursorPosition.y);

        contextRef.current.stroke();
      }
    },
    [selectedColor]
  );

  return (
    <div>
      <div className="fixed top-2/4 right-0 -translate-y-2/4 rounded-l-xl shadow p-3">
        <div className="rounded-full overflow-hidden border border-slate-300">
          <label
            htmlFor="pen-color"
            className="cursor-pointer h-8 w-8 block"
            style={{ backgroundColor: selectedColor }}
          />
          <input
            id="pen-color"
            type="color"
            className="hidden"
            value={selectedColor}
            onChange={(event) => {
              setSelectedColor(event.target.value);
            }}
          />
        </div>
      </div>
      <canvas
        id="board"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={saveCursorPosition}
        onMouseMove={draw}
      />
    </div>
  );
}

export default App;
