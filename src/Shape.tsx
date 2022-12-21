import { useDetectClickOutside } from "react-detect-click-outside";

import shapes from "./shapes.png";
import square from "./square.png";
import ellipse from "./ellipse.png";
import line from "./line.png";

function Shape(props: {
  isSelected: boolean;
  selectedShape: "rectangle" | "ellipse" | "line";
  setSelectedShape: React.Dispatch<
    React.SetStateAction<"rectangle" | "ellipse" | "line">
  >;
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}) {
  const shapeRef = useDetectClickOutside({
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
        id="shape-trigger"
        className={
          "rounded-full cursor-pointer h-8 w-8 bg-contain" +
          (props.isSelected ? " selected-item" : "")
        }
        style={{
          backgroundImage: `url("${shapes}")`,
        }}
        onClick={() => {
          if (props.isMenuOpen) {
            props.closeMenu();
          } else {
            props.openMenu();
          }
        }}
      />
      {props.isMenuOpen ? (
        <div
          className="top-0 right-16 absolute rounded shadow p-4 bg-white flex flex-wrap gap-3 w-14"
          ref={shapeRef}
        >
          <img
            src={square}
            alt="square"
            width={24}
            height={24}
            className={
              "cursor-pointer" +
              (props.selectedShape === "rectangle" ? " selected-item" : "")
            }
            onClick={() => {
              props.setSelectedShape("rectangle");
            }}
          />
          <img
            src={ellipse}
            alt="ellipse"
            width={24}
            height={24}
            className={
              "cursor-pointer" +
              (props.selectedShape === "ellipse" ? " selected-item" : "")
            }
            onClick={() => {
              props.setSelectedShape("ellipse");
            }}
          />
          <img
            src={line}
            alt="line"
            width={24}
            height={24}
            className={
              "cursor-pointer" +
              (props.selectedShape === "line" ? " selected-item" : "")
            }
            onClick={() => {
              props.setSelectedShape("line");
            }}
          />
        </div>
      ) : null}
    </>
  );
}

export default Shape;
