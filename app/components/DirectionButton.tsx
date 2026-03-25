import React from 'react';

interface DirectionButtonProps {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  onRepeatStart: () => void;
  onRepeatEnd: () => void;
  className?: string;
}

export default function DirectionButton({
  label,
  ariaLabel,
  onClick,
  onRepeatStart,
  onRepeatEnd,
  className,
}: DirectionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRepeatStart();
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRepeatEnd();
  };

  const preventDefault = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onContextMenu={preventDefault}
      onDragStart={preventDefault}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}
