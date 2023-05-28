import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TbArrowBackUp, TbArrowForwardUp } from "react-icons/tb";
import { AiOutlineClear } from "react-icons/ai";

import Color from "./Color";
import Rectangle from "./Rectangle";
import Ellipse from "./Ellipse";
import Line from "./Line";
import Pencil from "./Pencil";

let originalCursorPosition: { x: number; y: number };
let cursorPosition: { x: number; y: number };

let pencilStates: { x: number; y: number }[] = [];

function App() {
  const [selectedShape, setSelectedShape] = useState<
    "pencil" | "rectangle" | "ellipse" | "line"
  >("pencil");

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
  }, [selectedShape, selectedColor]);

  /**
   * maintaining states so that we can allow user to undo stuff
   */
  const [shapes, setShapes] = useState<
    (
      | {
          type: "rectangle" | "ellipse" | "line";
          color: string;
          details: {
            originalCursorPosition: typeof originalCursorPosition;
            finalCursorPosition: typeof cursorPosition;
          };
        }
      | {
          type: "pencil";
          color: string;
          details: (typeof cursorPosition)[];
        }
    )[]
  >([]);

  /**
   * maintaining popped states so that we can allow user to redo stuff
   */
  const [poppedShapes, setPoppedShapes] = useState<typeof shapes>([]);

  // saves the moving cursor position
  const saveMovingCursorPosition = useCallback((event: MouseEvent) => {
    cursorPosition = { x: event.clientX, y: event.clientY };
  }, []);

  /**
   * saves the starting cursor position
   *
   * makes the shape helper visible
   */
  const saveOriginalCursorPosition = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      originalCursorPosition = { x: event.clientX, y: event.clientY };
      saveMovingCursorPosition(event);

      if (selectedShape !== "pencil") {
        const shapeHelper = document.getElementById("shape-helper");
        if (shapeHelper) {
          shapeHelper.style.display = "block";
        }
      } else {
        const pencilHelper = document.getElementById("pencil-helper");
        if (pencilHelper) {
          pencilHelper.style.display = "inline";
        }
      }
    },
    [saveMovingCursorPosition, selectedShape]
  );

  // transforms from object to a string that css can understand
  const colorHslString = useMemo(
    () =>
      `hsl(${selectedColor.hue}, ${Math.round(
        selectedColor.saturation * 100
      )}%, ${Math.round(selectedColor.lightness * 100)}%)`,
    [selectedColor]
  );

  /**
   * performs the actual painting on canvas depending
   * on the shape
   */
  const draw = useCallback((shape: (typeof shapes)[number]) => {
    if (contextRef.current) {
      contextRef.current.beginPath();

      contextRef.current.lineWidth = 1;
      contextRef.current.strokeStyle = shape.color;

      if (shape.type !== "pencil") {
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
      } else {
        // do nothing since it's already drawn
        contextRef.current.lineCap = "round";
        contextRef.current.lineWidth = 1;
        contextRef.current.moveTo(shape.details[0]?.x, shape.details[1]?.y);
        shape.details.forEach((cursor) => {
          contextRef.current?.lineTo(cursor.x, cursor.y);
          contextRef.current?.stroke();
          contextRef.current?.moveTo(cursor.x, cursor.y);
        });
      }
    }
  }, []);

  /**
   * deletes the starting cursor position
   *
   * resets the helper tips
   *
   * stores data in selected and popped shapes arrays
   *
   * actually helps draw the shape if shape is
   * selected
   */
  const deleteOriginalCursorPosition = useCallback(() => {
    if (selectedShape !== "pencil") {
      const newShape: (typeof shapes)[number] = {
        type: selectedShape,
        color: colorHslString,
        details: {
          originalCursorPosition: { ...originalCursorPosition },
          finalCursorPosition: { ...cursorPosition },
        },
      };
      setShapes((currents) => currents.concat(newShape));
      /**
       * a new shape drawn on canvas means the user can't redo older shapes
       * since otherwise the timeline of shapes is not be sequential
       */
      setPoppedShapes([]);
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
    } else {
      const newShape: (typeof shapes)[number] = {
        type: "pencil",
        color: colorHslString,
        details: pencilStates,
      };
      setShapes((currents) => currents.concat(newShape));
      /**
       * a new shape drawn on canvas means the user can't redo older shapes
       * since otherwise the timeline of shapes is not be sequential
       */
      setPoppedShapes([]);
      pencilStates = [];
      draw(newShape);

      const helperTip = document.getElementById("pencil-helper");
      if (helperTip) {
        helperTip.firstElementChild?.setAttribute("d", "");
        helperTip.style.display = "none";
      }
    }

    // @ts-ignore
    originalCursorPosition = undefined;
  }, [selectedShape, colorHslString, draw, pencilStates.length]);

  /**
   * creates an illusion that something is being drawn but actual
   * painting will be done once user drops the cursor
   */
  const drawFake = useCallback(
    (event: MouseEvent) => {
      if (
        contextRef.current &&
        event.buttons === 1 &&
        originalCursorPosition &&
        cursorPosition
      ) {
        contextRef.current.beginPath();

        contextRef.current.lineWidth = 1;
        contextRef.current.strokeStyle = colorHslString;

        if (selectedShape === "pencil") {
          const helperTip = document.querySelector("#pencil-helper > path");

          let path = helperTip?.getAttribute("d") || "";
          // contextRef.current.moveTo(cursorPosition.x, cursorPosition.y);
          path += ` M ${cursorPosition.x} ${cursorPosition.y}`;
          saveMovingCursorPosition(event);
          pencilStates.push({ ...cursorPosition });
          // contextRef.current.lineTo(cursorPosition.x, cursorPosition.y);
          // contextRef.current.stroke();
          path += ` L ${cursorPosition.x} ${cursorPosition.y}`;

          helperTip?.setAttribute("d", path);
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

          if (selectedShape === "rectangle") {
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
          } else if (selectedShape === "line") {
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
          } else if (selectedShape === "ellipse") {
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
    [selectedShape, colorHslString, saveMovingCursorPosition]
  );

  /**
   * clears everything on the canvas
   *
   * draws everything that exists in the shapes array
   */
  const drawEverything = useCallback(
    (redrawnShapes: typeof shapes) => {
      if (contextRef.current) {
        const canvas = document.getElementById("board") as HTMLCanvasElement;
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);

        redrawnShapes.forEach((shape) => {
          draw(shape);
        });
      }
    },
    [draw]
  );

  const undoShape = useCallback(() => {
    let redrawnShapes: typeof shapes = [];

    setShapes((currentShapes) => {
      redrawnShapes = JSON.parse(JSON.stringify(currentShapes));

      const removedShape = redrawnShapes.pop();
      if (Boolean(removedShape)) {
        /**
         * or condition won't happen because of the wrapping if check
         * but just keeping to avoid type error
         */
        setPoppedShapes((currentPoppedShapes) =>
          currentPoppedShapes.concat(
            removedShape || ({} as (typeof shapes)[number])
          )
        );
      }

      drawEverything(redrawnShapes);

      return redrawnShapes;
    });
  }, [setShapes, setPoppedShapes, drawEverything]);

  const redoShape = useCallback(() => {
    let redrawnShapes: typeof shapes = [];

    setPoppedShapes((currentPoppedShapes) => {
      const clonedPoppedShapes = JSON.parse(
        JSON.stringify(currentPoppedShapes)
      );

      const reAddedShape = clonedPoppedShapes.pop();
      if (Boolean(reAddedShape)) {
        /**
         * or condition won't happen because of the wrapping if check
         * but just keeping to avoid type error
         */
        setShapes((currentShapes) => {
          redrawnShapes = currentShapes.concat(
            reAddedShape || ({} as (typeof shapes)[number])
          );

          drawEverything(redrawnShapes);

          return redrawnShapes;
        });
      }

      return clonedPoppedShapes;
    });
  }, [setShapes, setPoppedShapes, drawEverything]);

  /**
   * clearing out canvas for a fresh start
   */
  const clearCanvas = useCallback(() => {
    const canvas = document.getElementById("board") as HTMLCanvasElement;
    contextRef.current?.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]);
  }, []);

  return (
    <>
      <div className="fixed w-fit top-2/4 left-4 -translate-y-2/4 flex flex-col gap-6 select-none">
        <div className="relative rounded-xl shadow-xl hover:shadow-2xl p-3 bg-white flex flex-col gap-4">
          <Color
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
        </div>
        <div className="rounded-xl shadow-xl hover:shadow-2xl p-3 bg-white flex flex-col gap-2">
          <Pencil
            isSelected={selectedShape === "pencil"}
            selectionColor={colorHslString}
            select={() => {
              setSelectedShape("pencil");
            }}
          />
          <Rectangle
            isSelected={selectedShape === "rectangle"}
            selectionColor={colorHslString}
            select={() => {
              setSelectedShape("rectangle");
            }}
          />
          <Ellipse
            isSelected={selectedShape === "ellipse"}
            selectionColor={colorHslString}
            select={() => {
              setSelectedShape("ellipse");
            }}
          />
          <Line
            isSelected={selectedShape === "line"}
            selectionColor={colorHslString}
            select={() => {
              setSelectedShape("line");
            }}
          />
        </div>
      </div>
      <div className="fixed w-fit left-2/4 bottom-4 -translate-x-2/4">
        <div className="relative rounded-xl shadow-xl hover:shadow-2xl p-3 bg-white flex gap-4">
          <button
            disabled={shapes.length < 1}
            className={`cursor-pointer p-2 rounded [&:not(:disabled)]:hover:bg-slate-100`}
            onClick={undoShape}
          >
            <TbArrowBackUp
              size={32}
              color={shapes.length < 1 ? "rgb(100, 116, 139)" : ""}
            />
          </button>
          <button
            disabled={poppedShapes.length < 1}
            className={`cursor-pointer p-2 rounded [&:not(:disabled)]:hover:bg-slate-100`}
            onClick={redoShape}
          >
            <TbArrowForwardUp
              size={32}
              color={poppedShapes.length < 1 ? "rgb(100, 116, 139)" : ""}
            />
          </button>
          <button onClick={clearCanvas}>
            <AiOutlineClear size={32} />
          </button>
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
      <svg
        id="pencil-helper"
        className="fixed inset-0 select-none"
        style={{ display: "none" }}
        width={window.innerWidth}
        height={window.innerHeight}
        xmlns="http://www.w3.org/2000/svg"
        onMouseMove={drawFake}
        onMouseUp={deleteOriginalCursorPosition}
      >
        <path d="" stroke={colorHslString} />
      </svg>
    </>
  );
}

export default App;
