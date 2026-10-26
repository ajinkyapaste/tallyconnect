import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Pin, RotateCcw, X, Move, ChevronRight, Share2, Maximize2, Minimize2, ArrowUp, ArrowDown } from 'lucide-react';

function readJSON(key, def) {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return def;
    const p = JSON.parse(v);
    return p;
  } catch {
    return def;
  }
}

function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function useCardGridPreferences(prefix, cards) {
  const defs = useMemo(() => cards || [], [cards]);
  const [order, setOrder] = useState(() => readJSON(`${prefix}_order`, null));
  const [hidden, setHidden] = useState(() => readJSON(`${prefix}_hidden`, []));
  const [pinned, setPinned] = useState(() => readJSON(`${prefix}_pinned`, []));
  const [cardSizes, setCardSizes] = useState(() => readJSON(`${prefix}_sizes`, {}));
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [menu, setMenu] = useState(null);

  const defMap = useMemo(() => new Map(defs.map((c) => [c.id, c])), [defs]);

  const visibleCards = useMemo(() => {
    let list = [...defs].filter((c) => !hidden.includes(c.id));
    if (order && Array.isArray(order)) {
      list.sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    // Strict priority: pinned items bubble to top
    const pinnedList = list.filter((c) => pinned.includes(c.id));
    const unpinnedList = list.filter((c) => !pinned.includes(c.id));
    return [...pinnedList, ...unpinnedList];
  }, [defs, hidden, order, pinned]);

  const hiddenCards = useMemo(() => defs.filter((c) => hidden.includes(c.id)), [defs, hidden]);

  useEffect(() => {
    const sync = () => {
      setHidden(readJSON(`${prefix}_hidden`, []));
      setCardSizes(readJSON(`${prefix}_sizes`, {}));
    };
    window.addEventListener('tc-unhide-sync', sync);
    return () => window.removeEventListener('tc-unhide-sync', sync);
  }, [prefix]);

  const persistOrder = (nextOrder) => {
    setOrder(nextOrder);
    writeJSON(`${prefix}_order`, nextOrder);
  };

  const togglePin = (id) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeJSON(`${prefix}_pinned`, next);
      return next;
    });
    setMenu(null);
  };

  const setCardSize = (id, size) => {
    setCardSizes((prev) => {
      const next = { ...prev, [id]: size };
      writeJSON(`${prefix}_sizes`, next);
      return next;
    });
  };

  const cycleCardSize = (id) => {
    setCardSizes((prev) => {
      const cur = prev[id] || 'normal';
      const nextSize = cur === 'normal' ? 'wide' : (cur === 'wide' ? 'compact' : 'normal');
      const next = { ...prev, [id]: nextSize };
      writeJSON(`${prefix}_sizes`, next);
      return next;
    });
  };

  const hide = (id) => {
    setHidden((prev) => {
      const next = [...new Set([...prev, id])];
      writeJSON(`${prefix}_hidden`, next);
      return next;
    });
    setMenu(null);
    try { window.dispatchEvent(new Event('tc-unhide-sync')); } catch {}
  };

  const unhide = (id) => {
    setHidden((prev) => {
      const next = prev.filter((x) => x !== id);
      writeJSON(`${prefix}_hidden`, next);
      return next;
    });
  };

  const unhideAll = () => {
    setHidden([]);
    writeJSON(`${prefix}_hidden`, []);
  };

  const reset = () => {
    setOrder(null);
    setPinned([]);
    setHidden([]);
    setCardSizes({});
    try { localStorage.removeItem(`${prefix}_order`); } catch {}
    try { localStorage.removeItem(`${prefix}_pinned`); } catch {}
    try { localStorage.removeItem(`${prefix}_hidden`); } catch {}
    try { localStorage.removeItem(`${prefix}_sizes`); } catch {}
    setMenu(null);
  };

  const handleDragStart = (e, cardId) => {
    setDraggedId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', cardId); } catch {}
  };

  const handleDragOver = (e, cardId) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    if (dragOverId !== cardId) setDragOverId(cardId);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    let sourceId = draggedId;
    if (!sourceId) {
      try {
        const t = e.dataTransfer?.getData('text/plain');
        if (t) sourceId = t;
      } catch {}
    }
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const list = visibleCards.map((c) => c.id);
    const si = list.indexOf(sourceId);
    const ti = list.indexOf(targetId);
    if (si < 0 || ti < 0 || si === ti) return;
    const next = [...list];
    const [m] = next.splice(si, 1);
    next.splice(ti, 0, m);
    persistOrder(next);
  };

  const moveUp = (id) => {
    const list = visibleCards.map((c) => c.id);
    const i = list.indexOf(id);
    if (i <= 0) return;
    const next = [...list];
    const [m] = next.splice(i, 1);
    next.splice(i - 1, 0, m);
    persistOrder(next);
  };

  const moveDown = (id) => {
    const list = visibleCards.map((c) => c.id);
    const i = list.indexOf(id);
    if (i < 0 || i >= list.length - 1) return;
    const next = [...list];
    const [m] = next.splice(i, 1);
    next.splice(i + 1, 0, m);
    persistOrder(next);
  };

  const openMenu = (e, card) => {
    if (e?.preventDefault) e.preventDefault();
    const x = e?.clientX ?? (window.innerWidth / 2);
    const y = e?.clientY ?? (window.innerHeight / 2);
    setMenu({ x, y, card });
  };

  return {
    visibleCards,
    hiddenCards,
    pinned,
    hidden,
    cardSizes,
    setCardSize,
    cycleCardSize,
    draggedId,
    dragOverId,
    menu,
    setMenu,
    togglePin,
    moveUp,
    moveDown,
    hide,
    unhide,
    unhideAll,
    reset,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    openMenu,
    isPinned: (id) => pinned.includes(id),
  };
}

export function CardContextMenu({
  menu,
  onClose,
  pinned = [],
  onTogglePin,
  onMoveUp,
  onMoveDown,
  onHide,
  onReset,
  onUnhideAll,
  hiddenCount = 0,
  cardSizes = {},
  onSetSize,
  onFilterView,
  onShare,
}) {
  if (!menu) return null;
  const card = menu.card || {};
  const cardId = card.id;
  const isPinned = pinned?.includes(cardId);
  const currentSize = cardSizes[cardId] || card.size || 'normal';

  return createPortal(
    <div
      className="dashboard-context-menu-scrim"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        className="dashboard-context-menu glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${Math.min(menu.x, window.innerWidth - 220)}px`,
          top: `${Math.min(menu.y, window.innerHeight - 340)}px`,
          zIndex: 99999,
          minWidth: '200px',
        }}
      >
        <div className="dashboard-context-menu-header">
          {card.icon && (
            <span style={{ color: card.color || 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
              {React.isValidElement(card.icon)
                ? card.icon
                : React.createElement(card.icon, { size: 14 })}
            </span>
          )}
          <span style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {card.label || card.title || card.name || 'Card Options'}
          </span>
        </div>

        {onTogglePin && (
          <button
            type="button"
            className={isPinned ? 'active-pin' : ''}
            onClick={() => { onTogglePin(cardId); onClose(); }}
          >
            <Pin size={14} />
            <span>{isPinned ? 'Unpin Card' : 'Pin to Top'}</span>
          </button>
        )}

        {onFilterView && (card.status || card.filterValue) && (
          <button
            type="button"
            onClick={() => { onFilterView(card.status || card.filterValue); onClose(); }}
          >
            <ChevronRight size={14} />
            <span>Filter by this Status</span>
          </button>
        )}

        {onSetSize && (
          <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', margin: '2px 0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Card Size
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => { onSetSize(cardId, 'compact'); onClose(); }}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: '11px',
                  justifyContent: 'center',
                  background: currentSize === 'compact' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
                  color: currentSize === 'compact' ? '#ffffff' : 'var(--text-dark)',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: currentSize === 'compact' ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => { onSetSize(cardId, 'normal'); onClose(); }}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: '11px',
                  justifyContent: 'center',
                  background: currentSize === 'normal' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
                  color: currentSize === 'normal' ? '#ffffff' : 'var(--text-dark)',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: currentSize === 'normal' ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => { onSetSize(cardId, 'wide'); onClose(); }}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: '11px',
                  justifyContent: 'center',
                  background: currentSize === 'wide' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
                  color: currentSize === 'wide' ? '#ffffff' : 'var(--text-dark)',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: currentSize === 'wide' ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                Wide
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            if (typeof window !== 'undefined' && window.__tc_show_toast) {
              window.__tc_show_toast('Drag card to reorder');
            }
          }}
        >
          <Move size={14} />
          <span>Drag to Reorder</span>
        </button>

        {onMoveUp && (
          <button type="button" onClick={() => { onMoveUp(cardId); onClose(); }}>
            <ArrowUp size={14} />
            <span>Move Up</span>
          </button>
        )}

        {onMoveDown && (
          <button type="button" onClick={() => { onMoveDown(cardId); onClose(); }}>
            <ArrowDown size={14} />
            <span>Move Down</span>
          </button>
        )}

        {onHide && (
          <button type="button" onClick={() => { onHide(cardId); onClose(); }}>
            <EyeOff size={14} />
            <span>Hide Card</span>
          </button>
        )}

        {onShare && (
          <button type="button" onClick={() => { onShare(card); onClose(); }}>
            <Share2 size={14} />
            <span>Share Card</span>
          </button>
        )}

        {hiddenCount > 0 && onUnhideAll && (
          <button type="button" onClick={() => { onUnhideAll(); onClose(); }}>
            <Eye size={14} />
            <span>Unhide all ({hiddenCount})</span>
          </button>
        )}

        {onReset && (
          <button type="button" onClick={() => { onReset(); onClose(); }}>
            <RotateCcw size={14} />
            <span>Reset layout</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function HiddenCardsChip({ hiddenCards = [], onUnhide }) {
  if (!hiddenCards.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
        Hidden ({hiddenCards.length})
      </span>
      {hiddenCards.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onUnhide(c.id)}
          style={{
            border: '1px solid var(--glass-border, rgba(255,255,255,0.8))',
            background: 'var(--glass-bg, rgba(255,255,255,0.7))',
            padding: '5px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <Eye size={13} /> Show {c.label || c.title || c.name}
        </button>
      ))}
    </div>
  );
}

export function getCardSizeProps(cardId, cardSizes = {}) {
  const size = cardSizes[cardId] || 'normal';
  if (size === 'wide') {
    return {
      className: 'card-size-wide',
      style: { gridColumn: 'span 2' }
    };
  }
  if (size === 'compact') {
    return {
      className: 'card-size-compact',
      style: { padding: '14px 16px' }
    };
  }
  return {
    className: 'card-size-normal',
    style: {}
  };
}

