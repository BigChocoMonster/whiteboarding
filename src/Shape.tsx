import { MouseEvent, useCallback, useMemo } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";

import shapes from "./shapes.png";
import square from "./square.png";
import circle from "./circle.png";
import line from "./line.png";
import arrow from "./arrow.png";

function Shape(props: {
  isSelected: boolean;
  // selectedColor: { hue: number; saturation: number; lightness: number };
  // setSelectedColor: React.Dispatch<
  //   React.SetStateAction<{ hue: number; saturation: number; lightness: number }>
  // >;
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
          props.openMenu();
        }}
      />
      {props.isMenuOpen ? (
        <div
          className="top-0 right-16 absolute rounded shadow p-4 bg-white flex flex-wrap gap-3 w-14"
          ref={shapeRef}
        >
          <img src={square} alt="square" width={24} height={24} />
          <img src={circle} alt="circle" width={24} height={24} />
          <img src={line} alt="line" width={20} height={20} />
          <img src={arrow} alt="arrow" width={20} height={20} />
        </div>
      ) : null}
    </>
  );
}

export default Shape;
