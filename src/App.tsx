import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

let cursorPosition: { x: number; y: number };

function App() {
  const [selectedColor, setSelectedColor] = useState<{
    hue: number;
    saturation: number;
    lightness: number;
  }>({ hue: 0, saturation: 100, lightness: 50 });

  // creating the hue canvas on the right
  useEffect(() => {
    const hueCanvas = document.getElementById("hue") as HTMLCanvasElement;
    const context = hueCanvas.getContext("2d");

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, hueCanvas.height);

      for (let i = 0; i <= 24; i++) {
        gradient.addColorStop((1 / 25) * i, `hsl(${15 * i}, 100%, 50%)`);
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
    }
  }, []);

  // creating the spectrum canvas on the left for the selected hue
  useEffect(() => {
    const spectrumCanvas = document.getElementById(
      "spectrum"
    ) as HTMLCanvasElement;
    const context = spectrumCanvas.getContext("2d");

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
  }, [selectedColor.hue]);

  const setHue = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, isMouseMove: boolean) => {
      const boundingRect = (
        event.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const clickedYCoordinate = event.clientY - boundingRect.top;

      const cursor = document.getElementById("hue-cursor");

      if (cursor && (isMouseMove ? event.buttons === 1 : true)) {
        cursor.style.top = `${clickedYCoordinate}px`;

        setSelectedColor((currentColor) => ({
          ...currentColor,
          hue: (clickedYCoordinate / boundingRect.height) * 360,
        }));
      }
    },
    [setSelectedColor]
  );

  const setSaturationAndLightness = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, isMouseMove: boolean) => {
      const boundingRect = (
        event.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const clickedXCoordinate = event.clientX - boundingRect.left;
      const clickedYCoordinate = event.clientY - boundingRect.top;

      const cursor = document.getElementById("spectrum-cursor");
      if (cursor && (isMouseMove ? event.buttons === 1 : true)) {
        cursor.style.left = `${clickedXCoordinate}px`;
        cursor.style.top = `${clickedYCoordinate}px`;

        const xRatio = clickedXCoordinate / boundingRect.width;
        const yRatio = clickedYCoordinate / boundingRect.height;

        /**
         * hsl is actually cylindrical in shape since the color range is not linear
         * but a wheel.
         * https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hsl-hsv_models.svg/1200px-Hsl-hsv_models.svg.png
         * This image is a good representation of what hsv and hsl are. The way our
         * palette gets rendered on the screen lets us know that we have drawn an hsv
         * model. So now, since the closest we have is an hsl/hsla function in css,
         * we have to convert our coordinates from hsv to hsl.
         *
         * The following are formulae I just picked up off of internet (aka stackoverflow of course)
         */
        const hsvValue = 1 - yRatio; // since value increases with less yCoord
        const hsvSaturation = xRatio; // since saturation increases with more xCoord

        const lightness = (hsvValue / 2) * (2 - hsvSaturation);

        setSelectedColor((currentColor) => ({
          ...currentColor,
          saturation:
            (hsvValue * hsvSaturation) / (1 - Math.abs(2 * lightness - 1)),
          lightness,
        }));
      }
    },
    [setSelectedColor]
  );

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
      <div className="fixed top-2/4 right-0 -translate-y-2/4 rounded-l-xl shadow p-3 bg-white">
        <div
          className="rounded-xl border border-slate-300 cursor-pointer h-8 w-8"
          style={{
            backgroundColor: colorHslString,
          }}
        >
          <div className="top-0 right-16 absolute rounded shadow p-3 bg-white flex items-center gap-3">
            <div className="relative overflow-hidden">
              <canvas
                id="spectrum"
                width={200}
                height={200}
                className="rounded"
                onMouseMove={(event: MouseEvent<HTMLCanvasElement>) => {
                  setSaturationAndLightness(event, true);
                }}
                onClick={(event: MouseEvent<HTMLCanvasElement>) => {
                  setSaturationAndLightness(event, false);
                }}
              />
              <div
                id="spectrum-cursor"
                className="w-6 h-6 absolute top-0 left-0 -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full shadow-2xl border-2 border-white transition-all duration-[10ms]"
              />
            </div>
            <div className="relative">
              <canvas
                id="hue"
                width={10}
                height={192}
                className="rounded"
                onMouseMove={(event: MouseEvent<HTMLCanvasElement>) => {
                  setHue(event, true);
                }}
                onClick={(event: MouseEvent<HTMLCanvasElement>) => {
                  setHue(event, false);
                }}
              />
              <div
                id="hue-cursor"
                className="w-6 h-3 absolute top-0 left-2/4 -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full bg-white border transition-all duration-[10ms]"
                style={{ borderColor: `hsl(${selectedColor.hue}, 100%, 50%)` }}
              />
            </div>
          </div>
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
