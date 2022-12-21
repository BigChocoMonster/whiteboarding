import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Color from "./Color";
import Rectangle from "./Rectangle";
import Ellipse from "./Ellipse";
import Line from "./Line";

let originalCursorPosition: { x: number; y: number };
let cursorPosition: { x: number; y: number };

function App() {
  const [selected, setSelected] = useState<
    "pencil" | "rectangle" | "ellipse" | "line"
  >("rectangle");

  const [selectedColor, setSelectedColor] = useState<{
    hue: number;
    saturation: number;
    lightness: number;
  }>({ hue: 0, saturation: 1, lightness: 0.5 });

  const contextRef = useRef<CanvasRenderingContext2D>(null);

  useEffect(() => {
    const canvas = document.getElementById("board") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    if (context) {
      // @ts-ignore
      contextRef.current = context;
    }
  }, [selected, selectedColor]);

  // saves the moving cursor position
  const saveMovingCursorPosition = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      cursorPosition = { x: event.clientX, y: event.clientY };
    },
    []
  );

  /**
   * saves the starting cursor position
   *
   * makes the shape helper visible
   */
  const saveOriginalCursorPosition = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      originalCursorPosition = { x: event.clientX, y: event.clientY };
      saveMovingCursorPosition(event);

      const helperTip = document.getElementById("shape-helper");
      if (helperTip) {
        helperTip.style.display = "block";
      }
    },
    [saveMovingCursorPosition]
  );

  /**
   * deletes the starting cursor position
   *
   * resets the shape helper
   *
   * actually draws the shape if shape is
   * selected
   */
  const deleteOriginalCursorPosition = useCallback(() => {
    if (selected !== "pencil") {
      contextRef.current?.stroke();

      const helperTip = document.getElementById("shape-helper");
      if (helperTip) {
        helperTip.style.display = "none";
        helperTip.style.top = "unset";
        helperTip.style.right = "unset";
        helperTip.style.bottom = "unset";
        helperTip.style.left = "unset";
        helperTip.style.width = "unset";
        helperTip.style.height = "unset";
        helperTip.style.transform = "unset";
        helperTip.style.borderRadius = "unset";
      }
    }

    // @ts-ignore
    originalCursorPosition = undefined;
  }, [selected]);

  // transforms from object to a string that css can understand
  const colorHslString = useMemo(
    () =>
      `hsl(${selectedColor.hue}, ${Math.round(
        selectedColor.saturation * 100
      )}%, ${Math.round(selectedColor.lightness * 100)}%)`,
    [selectedColor]
  );

  // draws everything on the canvas
  const draw = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (
        contextRef.current &&
        event.buttons === 1 &&
        originalCursorPosition &&
        cursorPosition
      ) {
        contextRef.current.beginPath();

        contextRef.current.lineWidth = 1;
        contextRef.current.strokeStyle = colorHslString;

        if (selected === "pencil") {
          contextRef.current.lineCap = "round";

          contextRef.current.moveTo(cursorPosition.x, cursorPosition.y);
          saveMovingCursorPosition(event);
          contextRef.current.lineTo(cursorPosition.x, cursorPosition.y);
          contextRef.current.stroke();
        } else {
          saveMovingCursorPosition(event);

          // calculating all params
          const x = originalCursorPosition.x;
          const y = originalCursorPosition.y;
          const width = cursorPosition.x - originalCursorPosition.x;
          const height = cursorPosition.y - originalCursorPosition.y;

          /**
           * we'll set some params to a div, giving user a false info that
           * the shape is being drawn
           */
          const helperTip = document.getElementById("shape-helper");

          if (selected === "rectangle") {
            if (helperTip) {
              if (width < 0) {
                helperTip.style.right = `${window.innerWidth - x}px`;
                helperTip.style.left = "unset";
              } else {
                helperTip.style.left = `${x}px`;
                helperTip.style.right = "unset";
              }

              if (height < 0) {
                helperTip.style.bottom = `${window.innerHeight - y}px`;
                helperTip.style.top = "unset";
              } else {
                helperTip.style.top = `${y}px`;
                helperTip.style.bottom = "unset";
              }

              helperTip.style.width = `${Math.abs(width)}px`;
              helperTip.style.height = `${Math.abs(height)}px`;
            }

            /**
             * developing the shape anyway on the background without
             * actually drawing, aka, without calling the stroke method
             */
            contextRef.current.rect(x, y, width, height);
          } else if (selected === "line") {
            const angle = Math.atan2(height, width) * (180 / Math.PI);
            const divWidth = Math.sqrt(width * width + height * height); // since we're trying to draw a diagonal
            /**
             * since the connecting line has to be rotated by the center of it
             *
             * please visualize by connecting a line between 2 points
             * and then moving the points :(
             */
            const cx =
              (originalCursorPosition.x + cursorPosition.x) / 2 - divWidth / 2;
            const cy =
              (originalCursorPosition.y + cursorPosition.y) / 2 - 1 / 2;

            if (helperTip) {
              helperTip.style.transform = `rotate(${angle}deg)`;
              helperTip.style.left = `${cx}px`;
              helperTip.style.top = `${cy}px`;
              helperTip.style.width = `${divWidth}px`;
            }

            contextRef.current.moveTo(
              originalCursorPosition.x,
              originalCursorPosition.y
            );
            contextRef.current.lineTo(cursorPosition.x, cursorPosition.y);
          } else if (selected === "ellipse") {
            if (helperTip) {
              if (width < 0) {
                helperTip.style.right = `${window.innerWidth - x}px`;
                helperTip.style.left = "unset";
              } else {
                helperTip.style.left = `${x}px`;
                helperTip.style.right = "unset";
              }

              if (height < 0) {
                helperTip.style.bottom = `${window.innerHeight - y}px`;
                helperTip.style.top = "unset";
              } else {
                helperTip.style.top = `${y}px`;
                helperTip.style.bottom = "unset";
              }

              helperTip.style.width = `${Math.abs(width)}px`;
              helperTip.style.height = `${Math.abs(height)}px`;
              helperTip.style.borderRadius = "50%";
            }

            const xRadius =
              Math.abs(originalCursorPosition.x - cursorPosition.x) / 2;
            const yRadius =
              Math.abs(originalCursorPosition.y - cursorPosition.y) / 2;
            const cx =
              originalCursorPosition.x < cursorPosition.x
                ? originalCursorPosition.x + xRadius
                : cursorPosition.x + xRadius;
            const cy =
              originalCursorPosition.y < cursorPosition.y
                ? originalCursorPosition.y + yRadius
                : cursorPosition.y + yRadius;

            contextRef.current.ellipse(
              cx,
              cy,
              xRadius,
              yRadius,
              0,
              0,
              2 * Math.PI
            );
          }
        }
      }
    },
    [selected, colorHslString, saveMovingCursorPosition]
  );

  return (
    <>
      <div className="fixed w-fit top-2/4 left-0 -translate-y-2/4 flex flex-col gap-4 select-none">
        <div className="relative rounded-r-xl shadow p-3 bg-white flex flex-col gap-2">
          <Color
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
        </div>
        <div className="rounded-r-xl shadow p-3 bg-white flex flex-col gap-2">
          <Rectangle
            isSelected={selected === "rectangle"}
            selectionColor={colorHslString}
            select={() => {
              setSelected("rectangle");
            }}
          />
          <Ellipse
            isSelected={selected === "ellipse"}
            selectionColor={colorHslString}
            select={() => {
              setSelected("ellipse");
            }}
          />
          <Line
            isSelected={selected === "line"}
            selectionColor={colorHslString}
            select={() => {
              setSelected("line");
            }}
          />
        </div>
      </div>
      <canvas
        id="board"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={saveOriginalCursorPosition}
        onMouseMove={draw}
        onMouseUp={deleteOriginalCursorPosition}
      />
      <div
        className="fixed border select-none"
        style={{ borderColor: colorHslString }}
        id="shape-helper"
        onMouseUp={deleteOriginalCursorPosition}
      />
    </>
  );
}

export default App;
