import ellipse from "./ellipse.png";

function Ellipse(props: {
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
          backgroundImage: `url("${ellipse}")`,
        }}
        onClick={props.select}
      />
    </>
  );
}

export default Ellipse;
