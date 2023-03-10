import { TbLine } from "react-icons/tb";

function Line(props: {
  isSelected: boolean;
  selectionColor: string;
  select: () => void;
}) {
  return (
    <button
      className="rounded cursor-pointer p-1 hover:bg-slate-100"
      onClick={props.select}
    >
      <TbLine size={32} color={props.isSelected ? props.selectionColor : ""} />
    </button>
  );
}

export default Line;
