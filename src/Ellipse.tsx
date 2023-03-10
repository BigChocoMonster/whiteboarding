import { TbCircle } from "react-icons/tb";

function Ellipse(props: {
  isSelected: boolean;
  selectionColor: string;
  select: () => void;
}) {
  return (
    <button
      className="rounded cursor-pointer p-1 hover:bg-slate-100"
      onClick={props.select}
    >
      <TbCircle
        size={32}
        color={props.isSelected ? props.selectionColor : ""}
      />
    </button>
  );
}

export default Ellipse;
