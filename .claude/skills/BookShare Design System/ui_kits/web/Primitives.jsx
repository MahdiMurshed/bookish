// Core shadcn-equivalent primitives, faithful to packages/ui/src/components/*.
// Styles driven by colors_and_type.css custom properties.

const { useState, useEffect, useRef, createContext, useContext } = React;

const cx = (...xs) => xs.filter(Boolean).join(' ');

// ── Button ────────────────────────────────────────────────────────────
function Button({ variant = 'default', size = 'default', className = '', children, ...props }) {
  const base = 'kit-btn';
  return (
    <button className={cx(base, `kit-btn--${variant}`, `kit-btn--size-${size}`, className)} {...props}>
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────
function Badge({ variant = 'default', className = '', children, ...props }) {
  return (
    <span className={cx('kit-badge', `kit-badge--${variant}`, className)} {...props}>
      {children}
    </span>
  );
}

// ── Input / Textarea / Label ─────────────────────────────────────────
function Input({ className = '', ...props }) {
  return <input className={cx('kit-input', className)} {...props} />;
}
function Textarea({ className = '', ...props }) {
  return <textarea className={cx('kit-textarea', className)} {...props} />;
}
function Label({ className = '', children, ...props }) {
  return <label className={cx('kit-label', className)} {...props}>{children}</label>;
}

// ── Tabs ──────────────────────────────────────────────────────────────
const TabsCtx = createContext(null);
function Tabs({ value, onValueChange, defaultValue, children, className = '' }) {
  const [internal, setInternal] = useState(defaultValue);
  const curr = value !== undefined ? value : internal;
  const set = (v) => { onValueChange ? onValueChange(v) : setInternal(v); };
  return <TabsCtx.Provider value={{ value: curr, set }}><div className={cx('kit-tabs', className)}>{children}</div></TabsCtx.Provider>;
}
function TabsList({ children, className = '' }) { return <div className={cx('kit-tabs-list', className)}>{children}</div>; }
function TabsTrigger({ value, children, className = '' }) {
  const c = useContext(TabsCtx);
  const active = c.value === value;
  return <button className={cx('kit-tab', active && 'kit-tab--active', className)} onClick={() => c.set(value)}>{children}</button>;
}
function TabsContent({ value, children, className = '' }) {
  const c = useContext(TabsCtx);
  if (c.value !== value) return null;
  return <div className={cx('kit-tab-content', className)}>{children}</div>;
}

Object.assign(window, { Button, Badge, Input, Textarea, Label, Tabs, TabsList, TabsTrigger, TabsContent, cx });
