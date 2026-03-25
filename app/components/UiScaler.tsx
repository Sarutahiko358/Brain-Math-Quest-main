"use client";
import React from "react";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
};

export default function UiScaler({ value, min = 16, max = 64, step = 1, onChange }: Props) {
  return (
    <div className="uiScaler">
      <button
        className="ghost"
        onClick={() => onChange(Math.max(min, value - 2))}
        aria-label="UIを小さく"
        title="小さく"
      >－</button>
      <div className="scaleGroup">
        <span className="scaleIcon" role="img" aria-label="UIスケール">🔍</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="UIスケール"
        />
        <span className="scaleVal">{value}px</span>
      </div>
      <button
        className="ghost"
        onClick={() => onChange(Math.min(max, value + 2))}
        aria-label="UIを大きく"
        title="大きく"
      >＋</button>
    </div>
  );
}
