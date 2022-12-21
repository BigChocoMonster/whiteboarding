import line from "./line.png";

function Line(props: {
  isSelected: boolean;
  selectionColor: string;
  select: () => void;
}) {
  return (
    <>
      <div
        className={
          "rounded cursor-pointer h-8 w-8 bg-contain" +
          (props.isSelected ? " outline outline-2 outline-offset-2" : "")
        }
        style={{
          outlineColor: props.selectionColor,
          backgroundImage: `url("${line}")`,
        }}
        onClick={props.select}
      />
    </>
  );
}

export default Line;
