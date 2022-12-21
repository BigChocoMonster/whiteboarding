import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";

function Color(props: {
  selectedColor: { hue: number; saturation: number; lightness: number };
  setSelectedColor: React.Dispatch<
    React.SetStateAction<{ hue: number; saturation: number; lightness: number }>
  >;
}) {
  const { selectedColor, setSelectedColor } = props;

  const [isMenuOpen, toggleMenu] = useState<boolean>(false);

  // creating the hue canvas on the right
  useEffect(() => {
    const hueCanvas = document.getElementById("hue") as HTMLCanvasElement;
    const context = hueCanvas?.getContext("2d");

    if (context && isMenuOpen) {
      const gradient = context.createLinearGradient(0, 0, 0, hueCanvas.height);

      for (let i = 0; i <= 24; i++) {
        gradient.addColorStop((1 / 25) * i, `hsl(${15 * i}, 100%, 50%)`);
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
    }
  }, [isMenuOpen]);

  // creating the spectrum canvas on the left for the selected hue
  useEffect(() => {
    const spectrumCanvas = document.getElementById(
      "spectrum"
    ) as HTMLCanvasElement;
    const context = spectrumCanvas?.getContext("2d");

    if (context && isMenuOpen) {
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
  }, [selectedColor.hue, isMenuOpen]);

  const colorHslString = useMemo(
    () =>
      `hsl(${selectedColor.hue}, ${Math.round(
        selectedColor.saturation * 100
      )}%, ${Math.round(selectedColor.lightness * 100)}%)`,
    [selectedColor]
  );

  const [hueCoordinate, setHueCoordinate] = useState<number>(0);

  const setHue = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, isMouseMove: boolean) => {
      const boundingRect = (
        event.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const clickedYCoordinate = event.clientY - boundingRect.top;

      if (isMouseMove ? event.buttons === 1 : true) {
        setHueCoordinate(clickedYCoordinate);

        setSelectedColor((currentColor) => ({
          ...currentColor,
          hue: (clickedYCoordinate / boundingRect.height) * 360,
        }));
      }
    },
    [setSelectedColor]
  );

  const [slCoordinates, setSlCoordinates] = useState<{ x: number; y: number }>({
    x: 200,
    y: 0,
  });

  const setSaturationAndLightness = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, isMouseMove: boolean) => {
      const boundingRect = (
        event.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const clickedXCoordinate = event.clientX - boundingRect.left;
      const clickedYCoordinate = event.clientY - boundingRect.top;

      if (isMouseMove ? event.buttons === 1 : true) {
        setSlCoordinates({ x: clickedXCoordinate, y: clickedYCoordinate });

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

  const colorRef = useDetectClickOutside({
    onTriggered: (event) => {
      const target = event.target as HTMLElement;
      if (!target.id.endsWith("-trigger")) {
        toggleMenu(false);
      }
    },
  });

  return (
    <>
      <div
        id="color-trigger"
        className="rounded-full border border-slate-300 cursor-pointer h-8 w-8"
        style={{
          backgroundColor: colorHslString,
        }}
        onClick={() => {
          if (isMenuOpen) {
            toggleMenu(false);
          } else {
            toggleMenu(true);
          }
        }}
      />
      {isMenuOpen ? (
        <div
          className="top-0 left-16 absolute rounded shadow p-4 bg-white flex items-center gap-3"
          ref={colorRef}
        >
          <div className="relative overflow-hidden">
            <canvas
              id="spectrum"
              width={200}
              height={200}
              className="rounded cursor-pointer"
              onMouseMove={(event: MouseEvent<HTMLCanvasElement>) => {
                setSaturationAndLightness(event, true);
              }}
              onClick={(event: MouseEvent<HTMLCanvasElement>) => {
                setSaturationAndLightness(event, false);
              }}
            />
            <div
              id="spectrum-cursor"
              className="w-6 h-6 absolute -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full shadow-2xl border-2 border-white transition-all duration-[10ms]"
              style={{
                top: `${slCoordinates.y}px`,
                left: `${slCoordinates.x}px`,
              }}
            />
          </div>
          <div className="relative">
            <canvas
              id="hue"
              width={10}
              height={192}
              className="rounded cursor-pointer"
              onMouseMove={(event: MouseEvent<HTMLCanvasElement>) => {
                setHue(event, true);
              }}
              onClick={(event: MouseEvent<HTMLCanvasElement>) => {
                setHue(event, false);
              }}
            />
            <div
              id="hue-cursor"
              className="w-6 h-3 absolute left-2/4 -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full bg-white border transition-all duration-[10ms]"
              style={{
                top: `${hueCoordinate}px`, // reversal of setting hue from coordinate
                borderColor: `hsl(${selectedColor.hue}, 100%, 50%)`,
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Color;
