import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin, EyeOff, RotateCcw, Move, Settings, Check, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Universal Bitrix-style Context Menu for cards, buttons, and custom UI components
 */
export default function BitrixContextMenu({
  menu,
  onClose,
  title,
  icon: IconComponent,
  items = []
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (menu) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const left = Math.min(menu.x, window.innerWidth - 230);
  const top = Math.min(menu.y, window.innerHeight - 300);

  return createPortal(
    <div
      className="dashboard-context-menu-scrim"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        ref={menuRef}
        className="dashboard-context-menu glass-panel"
        style={{
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          zIndex: 99999,
          minWidth: '200px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || IconComponent) && (
          <div className="dashboard-context-menu-header">
            {IconComponent && <IconComponent size={14} color="var(--primary-color)" />}
            <span style={{ fontWeight: 700, fontSize: '12px' }}>{title || 'Options'}</span>
          </div>
        )}

        {items.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div
                key={idx}
                style={{
                  height: '1px',
                  background: 'var(--glass-border, rgba(0,0,0,0.08))',
                  margin: '3px 0'
                }}
              />
            );
          }

          if (item.type === 'custom') {
            return <div key={idx}>{item.render()}</div>;
          }

          const ItemIcon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              className={item.className || ''}
              onClick={() => {
                if (item.onClick) item.onClick();
                onClose();
              }}
              style={item.style}
            >
              {ItemIcon && <ItemIcon size={14} />}
              <span>{item.label}</span>
              {item.checked && <Check size={13} style={{ marginLeft: 'auto' }} />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
