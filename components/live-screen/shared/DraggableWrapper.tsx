import React, { useState } from 'react';
import { Box } from '@mui/material';

interface DraggableWrapperProps {
  id: string;
  sourceCol: 'left' | 'right';
  index: number;
  isPreview?: boolean;
  isDraggable?: boolean;
  onDragStart: (e: React.DragEvent, id: string, sourceCol: 'left' | 'right') => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetCol: 'left' | 'right', targetIndex: number) => void;
  children: React.ReactNode;
}

const WIDGET_LABEL_MAP: Record<string, string> = {
  logo: 'Merchant Logo',
  commodityTable: 'Commodity Table',
  spotRates: 'Spot Rates',
  worldClock: 'World Clocks',
  systemClock: 'System Clock',
  footer: 'Powered By Footer',
};

export const DraggableWrapper = ({
  id,
  sourceCol,
  index,
  isPreview,
  isDraggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  children,
}: DraggableWrapperProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isPreview || !isDraggable) {
    return <>{children}</>;
  }

  const handleWrapperDragStart = (e: React.DragEvent) => {
    try {
      const widgetLabel = WIDGET_LABEL_MAP[id] || id;
      const ghost = document.createElement('div');
      ghost.innerText = widgetLabel;
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      ghost.style.left = '-1000px';
      ghost.style.padding = '8px 16px';
      ghost.style.background = '#d4a017';
      ghost.style.color = '#ffffff';
      ghost.style.borderRadius = '8px';
      ghost.style.fontSize = '14px';
      ghost.style.fontWeight = 'bold';
      ghost.style.border = '1px solid #b38610';
      ghost.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '99999';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 20);

      // Clean up the ghost DOM node immediately in the next tick
      setTimeout(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      }, 0);
    } catch (err) {
      console.error('Ghost creation error', err);
    }

    onDragStart(e, id, sourceCol);
  };

  return (
    <Box
      draggable
      onDragStart={handleWrapperDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, sourceCol, index);
      }}
      sx={{
        width: '100%',
        transition: 'all 0.2s ease',
        position: 'relative',
        border: isDragOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        borderRadius: '8px',
        p: 0.5,
        pointerEvents: 'auto',
        '&:hover': {
          border: '2px dashed #d4a017',
          cursor: 'grab',
          backgroundColor: 'rgba(212, 160, 23, 0.02)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      {/* Overlay to block iframe and table mouse interception during preview */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          cursor: 'grab',
          backgroundColor: 'transparent',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      />
      {children}
    </Box>
  );
};
