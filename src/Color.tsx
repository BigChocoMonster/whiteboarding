import { MouseEvent, useCallback, useMemo } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";

function Color(props: {
  selectedColor: { hue: number; saturation: number; lightness: number };
  setSelectedColor: React.Dispatch<
    React.SetStateAction<{ hue: number; saturation: number; lightness: number }>
  >;
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}) {
  const colorHslString = useMemo(
    () =>
      `hsl(${props.selectedColor.hue}, ${Math.round(
        props.selectedColor.saturation * 100
      )}%, ${Math.round(props.selectedColor.lightness * 100)}%)`,
    [props.selectedColor]
  );

  const setHue = useCallback(
    (event: MouseEvent<HTMLCanvasElement>, isMouseMove: boolean) => {
      const boundingRect = (
        event.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const clickedYCoordinate = event.clientY - boundingRect.top;

      const cursor = document.getElementById("hue-cursor");

      if (cursor && (isMouseMove ? event.buttons === 1 : true)) {
        cursor.style.top = `${clickedYCoordinate}px`;

        props.setSelectedColor((currentColor) => ({
          ...currentColor,
          hue: (clickedYCoordinate / boundingRect.height) * 360,
        }));
      }
    },
    [props.setSelectedColor]
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

        props.setSelectedColor((currentColor) => ({
          ...currentColor,
          saturation:
            (hsvValue * hsvSaturation) / (1 - Math.abs(2 * lightness - 1)),
          lightness,
        }));
      }
    },
    [props.setSelectedColor]
  );

  const colorRef = useDetectClickOutside({
    onTriggered: (event) => {
      const target = event.target as HTMLElement;
      if (!target.id.endsWith("-trigger")) {
        props.closeMenu();
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
          props.openMenu();
        }}
      />
      {props.isMenuOpen ? (
        <div
          className="top-0 right-16 absolute rounded shadow p-4 bg-white flex items-center gap-3"
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
              className="w-6 h-6 absolute top-0 -right-6 -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full shadow-2xl border-2 border-white transition-all duration-[10ms]"
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
              className="w-6 h-3 absolute top-0 left-2/4 -translate-x-2/4 -translate-y-2/4 cursor-pointer rounded-full bg-white border transition-all duration-[10ms]"
              style={{
                borderColor: `hsl(${props.selectedColor.hue}, 100%, 50%)`,
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Color;
