import React from "react";
import "./Toolbar.css";
// icons 
import {
  FaMousePointer,
  FaPaintBrush,
  FaEraser,
  FaTrashAlt,
} from "react-icons/fa";

const Toolbar = ({
  setColor,
  clearCanvas,
  setMode,
  currentMode,
  currentColor,
}) => {
  const colors = ["#000000", "#e63946", "#fca311", "#2a9d8f", "#4cc9f0"];

  return (
    <div className="toolbar">
      {/* Selector tool - non-functional for now, but good for UI */}
      <button title="Select" className="tool-button">
        <FaMousePointer />
      </button>

      <button
        title="Pen"
        className={`tool-button ${currentMode === "draw" ? "active" : ""}`}
        onClick={() => setMode("draw")}
      >
        <FaPaintBrush />
      </button>

      <button
        title="Eraser"
        className={`tool-button ${currentMode === "erase" ? "active" : ""}`}
        onClick={() => setMode("erase")}
      >
        <FaEraser />
      </button>

      <div className="divider" />

      <div className="color-picker">
        {colors.map((color) => (
          <button
            key={color}
            title={color}
            className={`color-swatch ${
              currentColor === color ? "active-color" : ""
            }`}
            style={{ backgroundColor: color }}
            onClick={() => {
              setColor(color);
              setMode("draw"); 
            }}
          />
        ))}
      </div>

      <div className="divider" />

      <button title="Clear All" className="tool-button" onClick={clearCanvas}>
        <FaTrashAlt />
      </button>
    </div>
  );
};

export default Toolbar;
