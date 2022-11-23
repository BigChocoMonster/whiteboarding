import { useState } from "react";
import "./App.css";

function App() {
  const [selectedColor, setSelectedColor] = useState<string>("#000000");

  return (
    <div>
      <div className="fixed top-2/4 right-0 -translate-y-2/4 rounded-l-xl shadow p-6">
        <div className="rounded-2xl overflow-hidden">
          <input
            type="color"
            className="cursor-pointer"
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
