import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";
import { AiOutlineCopy } from "react-icons/ai";

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

  /**
   * hsl -> rgb
   * https://www.rapidtables.com/convert/color/hsl-to-rgb.html
   * https://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/ (explains the formula somewhat ?)
   */
  const hslToHex = useMemo(() => {
    const { hue: h, saturation: s, lightness: l } = selectedColor;

    const temp1 = (1 - Math.abs(2 * l - 1)) * s;
    const temp2 = temp1 * (1 - Math.abs(((h / 60) % 2) - 1));
    const temp3 = l - temp1 / 2;

    let tempRGB = { r: 0, g: 0, b: 0 };

    if (h < 60) {
      tempRGB = {
        r: temp1,
        g: temp2,
        b: 0,
      };
    } else if (h >= 60 && h < 120) {
      tempRGB = {
        r: temp2,
        g: temp1,
        b: 0,
      };
    } else if (h >= 120 && h < 180) {
      tempRGB = {
        r: 0,
        g: temp1,
        b: temp2,
      };
    } else if (h >= 180 && h < 240) {
      tempRGB = {
        r: 0,
        g: temp2,
        b: temp1,
      };
    } else if (h >= 240 && h < 300) {
      tempRGB = {
        r: temp2,
        g: 0,
        b: temp1,
      };
    } else if (h >= 300 && h < 360) {
      tempRGB = {
        r: temp1,
        g: 0,
        b: temp2,
      };
    }

    return Object.keys(tempRGB).reduce((acc, key) => {
      const finalHue = (tempRGB[key as keyof typeof tempRGB] + temp3) * 255;
      const hueHex: string = parseInt(finalHue.toFixed(2)).toString(16);

      return acc + hueHex.padStart(2, "0");
    }, "#");
  }, [selectedColor]);

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
          className="top-0 left-16 absolute rounded shadow p-4 bg-white flex flex-col gap-3"
          ref={colorRef}
        >
          <section className="flex items-center gap-3">
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
          </section>
          <section className="flex items-center gap-2">
            <p>{hslToHex}</p>
            <AiOutlineCopy
              className="cursor-pointer"
              onClick={() => {
                if (typeof navigator?.clipboard?.writeText === "function") {
                  navigator.clipboard.writeText(hslToHex).then(() => {
                    alert("copied successfully");
                  });
                } else {
                  alert("auto copying not supported in your browser");
                }
              }}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

export default Color;
