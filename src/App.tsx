import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Color from "./Color";
import Shape from "./Shape";

let cursorPosition: { x: number; y: number };

function App() {
  const [selected, setSelected] = useState<"color" | "shape">("color");

  const [menu, setMenu] = useState<"color" | "shape" | null>(null);

  const [selectedColor, setSelectedColor] = useState<{
    hue: number;
    saturation: number;
    lightness: number;
  }>({ hue: 0, saturation: 1, lightness: 0.5 });

  // creating the hue canvas on the right
  useEffect(() => {
    const hueCanvas = document.getElementById("hue") as HTMLCanvasElement;
    const context = hueCanvas?.getContext("2d");

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, hueCanvas.height);

      for (let i = 0; i <= 24; i++) {
        gradient.addColorStop((1 / 25) * i, `hsl(${15 * i}, 100%, 50%)`);
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
    }
  }, [menu]);

  // creating the spectrum canvas on the left for the selected hue
  useEffect(() => {
    const spectrumCanvas = document.getElementById(
      "spectrum"
    ) as HTMLCanvasElement;
    const context = spectrumCanvas?.getContext("2d");

    if (context) {
      context.fillStyle = `hsl(${selectedColor.hue}, 100%, 50%)`;
      context.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

      const whiteGradient = context.createLinearGradient(
        0,
        0,
        spectrumCanvas.width,
        0
      );
      whiteGradient.addColorStop(0, "white");
      whiteGradient.addColorStop(1, "transparent");
      context.fillStyle = whiteGradient;
      context.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

      const blackGradient = context.createLinearGradient(
        0,
        0,
        0,
        spectrumCanvas.height
      );
      blackGradient.addColorStop(0, "transparent");
      blackGradient.addColorStop(1, "black");
      context.fillStyle = blackGradient;
      context.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
    }
  }, [selectedColor.hue, menu]);

  const colorHslString = useMemo(
    () =>
      `hsl(${selectedColor.hue}, ${Math.round(
        selectedColor.saturation * 100
      )}%, ${Math.round(selectedColor.lightness * 100)}%)`,
    [selectedColor]
  );

  const contextRef = useRef<CanvasRenderingContext2D>(null);

  useEffect(() => {
    const canvas = document.getElementById("board") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    if (context) {
      // @ts-ignore
      contextRef.current = context;
    }
  }, [colorHslString]);

  const saveCursorPosition = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      cursorPosition = { x: event.clientX, y: event.clientY };
    },
    []
  );

  const draw = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (contextRef.current && event.buttons === 1 && cursorPosition) {
        contextRef.current.beginPath();

        contextRef.current.moveTo(cursorPosition.x, cursorPosition.y);

        contextRef.current.lineWidth = 1;
        contextRef.current.lineCap = "round";
        contextRef.current.strokeStyle = colorHslString;

        cursorPosition = { x: event.clientX, y: event.clientY };

        contextRef.current.lineTo(cursorPosition.x, cursorPosition.y);

        contextRef.current.stroke();
      }
    },
    [colorHslString]
  );

  return (
    <div>
      <div className="fixed top-2/4 right-0 -translate-y-2/4 rounded-l-xl shadow p-3 bg-white flex flex-col gap-2">
        <Color
          isSelected={selected === "color"}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          isMenuOpen={menu === "color"}
          openMenu={() => {
            setMenu("color");
            setSelected("color");
          }}
          closeMenu={() => {
            setMenu(null);
          }}
        />
        <Shape
          isSelected={selected === "shape"}
          isMenuOpen={menu === "shape"}
          openMenu={() => {
            setMenu("shape");
            setSelected("shape");
          }}
          closeMenu={() => {
            setMenu(null);
          }}
        />
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
