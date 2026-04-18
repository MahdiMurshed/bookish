// Icons used across the UI kit. Loaded via CDN lucide script into window.lucide.
// We wrap as simple React components with class="h-* w-*" style props.
const icon = (name, extra = '') => ({ className = '', size = 16, ...props } = {}) =>
  React.createElement('i', {
    'data-lucide': name,
    style: { width: size, height: size, display: 'inline-block', verticalAlign: 'middle', strokeWidth: 2 },
    className: className + ' ' + extra,
    ...props,
  });

window.Icon = {
  BookOpen: icon('book-open'),
  Library: icon('library'),
  ArrowRightLeft: icon('arrow-right-left'),
  User: icon('user'),
  Plus: icon('plus'),
  Search: icon('search'),
  Send: icon('send'),
  Check: icon('check'),
  Sun: icon('sun'),
  Moon: icon('moon'),
  Star: icon('star'),
  X: icon('x'),
  MessageCircle: icon('message-circle'),
  Calendar: icon('calendar'),
};

// Call after render so lucide hydrates SVGs
window.__hydrateIcons = () => {
  if (window.lucide) window.lucide.createIcons();
};
