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

  /**
   * maintaining states so that we can allow user to undo stuff
   */
  const [shapeStates, setShapeStates] = useState<
    {
      type: typeof selected;
      details: {
        originalCursorPosition: typeof originalCursorPosition;
        finalCursorPosition: typeof cursorPosition;
      };
    }[]
  >([]);

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
   * actually helps draw the shape if shape is
   * selected
   */
  const deleteOriginalCursorPosition = useCallback(() => {
    if (selected !== "pencil") {
      const newShape: typeof shapeStates[number] = {
        type: selected,
        details: {
          originalCursorPosition,
          finalCursorPosition: cursorPosition,
        },
      };
      setShapeStates((currentStates) => currentStates.concat(newShape));
      draw(newShape);

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

  /**
   * creates an illusion that something is being drawn but actual
   * painting will be done once user drops the cursor
   */
  const drawFake = useCallback(
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
          }
        }
      }
    },
    [selected, colorHslString, saveMovingCursorPosition]
  );

  /**
   * this performs the actual painting on canvas depending
   * on the shape
   */
  const draw = useCallback(
    (shape: typeof shapeStates[number]) => {
      if (contextRef.current) {
        contextRef.current.beginPath();

        contextRef.current.lineWidth = 1;
        contextRef.current.strokeStyle = colorHslString;

        const x = shape.details.originalCursorPosition.x;
        const y = shape.details.originalCursorPosition.y;
        const width =
          shape.details.finalCursorPosition.x -
          shape.details.originalCursorPosition.x;
        const height =
          shape.details.finalCursorPosition.y -
          shape.details.originalCursorPosition.y;

        switch (shape.type) {
          case "rectangle": {
            contextRef.current.rect(x, y, width, height);

            break;
          }

          case "line": {
            contextRef.current.moveTo(
              shape.details.originalCursorPosition.x,
              shape.details.originalCursorPosition.y
            );
            contextRef.current.lineTo(
              shape.details.finalCursorPosition.x,
              shape.details.finalCursorPosition.y
            );

            break;
          }

          case "ellipse": {
            const xRadius =
              Math.abs(
                shape.details.originalCursorPosition.x -
                  shape.details.finalCursorPosition.x
              ) / 2;
            const yRadius =
              Math.abs(
                shape.details.originalCursorPosition.y -
                  shape.details.finalCursorPosition.y
              ) / 2;
            const cx =
              shape.details.originalCursorPosition.x <
              shape.details.finalCursorPosition.x
                ? shape.details.originalCursorPosition.x + xRadius
                : shape.details.finalCursorPosition.x + xRadius;
            const cy =
              shape.details.originalCursorPosition.y <
              shape.details.finalCursorPosition.y
                ? shape.details.originalCursorPosition.y + yRadius
                : shape.details.finalCursorPosition.y + yRadius;

            contextRef.current.ellipse(
              cx,
              cy,
              xRadius,
              yRadius,
              0,
              0,
              2 * Math.PI
            );

            break;
          }

          default: {
            // do nothing
          }
        }

        contextRef.current.stroke();
      }
    },
    [colorHslString]
  );

  return (
    <>
      <div className="fixed w-fit top-2/4 left-0 -translate-y-2/4 flex flex-col gap-6 select-none">
        <div className="relative rounded-r-xl shadow-lg p-3 bg-white flex flex-col gap-4">
          <Color
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
        </div>
        <div className="rounded-r-xl shadow-lg p-3 bg-white flex flex-col gap-4">
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
        onMouseMove={drawFake}
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
