import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Pin, RotateCcw, X } from 'lucide-react';

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
    list.sort((a, b) => {
      const pa = pinned.includes(a.id) ? 1 : 0;
      const pb = pinned.includes(b.id) ? 1 : 0;
      return pb - pa;
    });
    return list;
  }, [defs, hidden, order, pinned]);

  const hiddenCards = useMemo(() => defs.filter((c) => hidden.includes(c.id)), [defs, hidden]);

  useEffect(() => {
    const sync = () => {
      setHidden(readJSON(`${prefix}_hidden`, []));
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
    try { localStorage.removeItem(`${prefix}_order`); } catch {}
    try { localStorage.removeItem(`${prefix}_pinned`); } catch {}
    try { localStorage.removeItem(`${prefix}_hidden`); } catch {}
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

  const openMenu = (e, card) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setMenu({ x, y, card });
  };

  return {
    visibleCards,
    hiddenCards,
    pinned,
    hidden,
    draggedId,
    dragOverId,
    menu,
    setMenu,
    togglePin,
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
  pinned,
  onTogglePin,
  onHide,
  onReset,
  onUnhideAll,
  hiddenCount = 0,
}) {
  if (!menu) return null;
  return createPortal(
    <div
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${Math.min(menu.x, window.innerWidth - 200)}px`,
          top: `${Math.min(menu.y, window.innerHeight - 240)}px`,
          minWidth: '170px',
          padding: '6px',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div style={{ padding: '6px 10px 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #64748b)', borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: '4px' }}>
          {menu.card?.label || menu.card?.title || menu.card?.name}
        </div>
        <button type="button" onClick={() => onTogglePin(menu.card.id)} style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <Pin size={14} /> {pinned?.includes(menu.card.id) ? 'Unpin' : 'Pin'}
        </button>
        <button type="button" onClick={() => onHide(menu.card.id)} style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <EyeOff size={14} /> Hide
        </button>
        {hiddenCount > 0 && (
          <button type="button" onClick={onUnhideAll} style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <Eye size={14} /> Unhide all ({hiddenCount})
          </button>
        )}
        <button type="button" onClick={onReset} style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <RotateCcw size={14} /> Reset layout
        </button>
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
