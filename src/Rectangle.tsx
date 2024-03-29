import { TbSquare } from "react-icons/tb";

function Rectangle(props: {
  isSelected: boolean;
  selectionColor: string;
  select: () => void;
}) {
  return (
    <button
      className="rounded cursor-pointer p-1 hover:bg-slate-100"
      onClick={props.select}
    >
      <TbSquare
        size={32}
        color={props.isSelected ? props.selectionColor : ""}
      />
    </button>
  );
}

export default Rectangle;
