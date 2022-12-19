import { useState } from "react";

function App() {
  const [selectedColor, setSelectedColor] = useState<string>("#000000");

  return (
    <div>
      <div className="fixed top-2/4 right-0 -translate-y-2/4 rounded-l-xl shadow p-3">
        <div className="rounded-full overflow-hidden border border-slate-300">
          <label
            htmlFor="pen-color"
            className="cursor-pointer h-8 w-8 block"
            style={{ backgroundColor: selectedColor }}
          />
          <input
            id="pen-color"
            type="color"
            className="hidden"
            value={selectedColor}
            onChange={(event) => {
              setSelectedColor(event.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
