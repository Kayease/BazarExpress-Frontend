"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  itemsPerRow: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

function VirtualGrid<T>({
  items,
  itemHeight,
  containerHeight,
  itemsPerRow,
  renderItem,
  gap = 0,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  const visibleRows = Math.ceil(containerHeight / rowHeight);
  const startRow = Math.floor(scrollTop / rowHeight);
  const endRow = Math.min(startRow + visibleRows + 1, totalRows);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            row,
            col,
            top: row * rowHeight,
            left: col * (100 / itemsPerRow) + '%'
          });
        }
      }
    }
    return result;
  }, [items, startRow, endRow, itemsPerRow, rowHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top, left }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left,
              width: `calc(${100 / itemsPerRow}% - ${gap}px)`,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(VirtualGrid) as typeof VirtualGrid;