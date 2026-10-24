import React, { useState, useCallback, useEffect } from 'react';
import './VoucherDragDrop.css';

/**
 * Simple drag‑and‑drop list for vouchers / ledger entries.
 *
 * Props
 * -----
 * items: Array of objects representing vouchers. Each object must contain at least
 *   `id` (unique) and `title` (display text). Additional fields are passed through.
 * onReorder: Callback invoked with the new ordered array after a drag‑drop operation.
 * onContextAction: Callback invoked when a context‑menu action is selected. The
 *   callback receives the `action` string (e.g. "edit", "delete") and the item.
 *
 * The component uses the native HTML5 Drag and Drop API to avoid extra
 * dependencies. Right‑click (contextmenu) opens a custom menu with the actions
 * required for ledgers and vouchers.
 */
const VoucherDragDrop = ({ items = [], onReorder, onContextAction }) => {
  const [list, setList] = useState(items);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [menuItem, setMenuItem] = useState(null);

  // Sync external changes
  useEffect(() => {
    setList(items);
  }, [items]);

  const handleDragStart = (idx) => (e) => {
    setDraggingIdx(idx);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx) => (e) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const newList = [...list];
    const [moved] = newList.splice(draggingIdx, 1);
    newList.splice(idx, 0, moved);
    setList(newList);
    setDraggingIdx(idx);
  };

  const handleDrop = () => {
    setDraggingIdx(null);
    if (onReorder) onReorder(list);
  };

  const handleContextMenu = (item) => (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuItem(item);
  };

  const closeMenu = useCallback(() => {
    setMenuPos(null);
    setMenuItem(null);
  }, []);

  const performAction = (action) => () => {
    if (onContextAction && menuItem) {
      onContextAction(action, menuItem);
    }
    closeMenu();
  };

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!menuPos) return;
    const handler = (e) => {
      // If click is outside the menu, dismiss it
      if (!e.target.closest('.context-menu')) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuPos, closeMenu]);

  return (
    <div className="voucher-drag-drop">
      <ul className="voucher-list">
        {list.map((item, idx) => (
          <li
            key={item.id}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDrop={handleDrop}
            onContextMenu={handleContextMenu(item)}
            className="voucher-item"
          >
            {item.title}
          </li>
        ))}
      </ul>

      {menuPos && (
        <div
          className="context-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button onClick={performAction('edit')}>Edit</button>
          <button onClick={performAction('delete')}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default VoucherDragDrop;
