// Product-specific components: Header, BookCard, BookGrid, BookFilters, BorrowRequestCard, BorrowRequestForm

const { useState: useSt } = React;

function Header({ route, onNavigate, onSignOut, user, unreadCount = 0, theme, onToggleTheme }) {
  const link = (r, lbl, I, badge) => (
    <a onClick={() => onNavigate(r)}
       className={cx('kit-navlink', route === r && 'kit-navlink--active')}>
      <I size={16} /> {lbl}
      {badge ? <span className="kit-badge kit-badge--default kit-nav-badge">{badge}</span> : null}
    </a>
  );
  return (
    <header className="kit-header">
      <div className="kit-header-inner">
        <a className="kit-logo" onClick={() => onNavigate(user ? 'browse' : 'signin')}>
          <Icon.BookOpen size={20} /> BookShare
        </a>
        <nav className="kit-nav">
          {user ? (
            <>
              {link('browse', 'Browse', Icon.BookOpen)}
              {link('library', 'My Library', Icon.Library)}
              {link('requests', 'Requests', Icon.ArrowRightLeft, unreadCount || null)}
              {link('profile', 'Profile', Icon.User)}
              <button className="kit-icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
                {theme === 'dark' ? <Icon.Moon size={16} /> : <Icon.Sun size={16} />}
              </button>
              <button className="kit-link-btn" onClick={onSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="kit-icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
                {theme === 'dark' ? <Icon.Moon size={16} /> : <Icon.Sun size={16} />}
              </button>
              <a className="kit-link-btn" onClick={() => onNavigate('signin')}>Sign In</a>
              <a className="kit-btn kit-btn--default kit-btn--size-sm" onClick={() => onNavigate('signup')}>Sign Up</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function BookCover({ book, large }) {
  const style = book.cover_bg
    ? { background: book.cover_bg, color: book.cover_fg || '#f3e8c8' }
    : { background: 'var(--muted)' };
  return (
    <div className={cx('kit-cover', large && 'kit-cover--lg')} style={style}>
      {book.cover_bg ? (
        <div className="kit-cover-title">{book.title}</div>
      ) : (
        <Icon.BookOpen size={large ? 64 : 40} />
      )}
      {book.is_lendable !== undefined && !large && (
        <div className={cx('kit-avail-dot', !book.is_lendable && 'kit-avail-dot--off')} />
      )}
    </div>
  );
}

function BookCard({ book, onOpen, showOwner }) {
  return (
    <a className="kit-bookcard" onClick={() => onOpen(book.id)}>
      <BookCover book={book} />
      <div className="kit-bookcard-meta">
        <h3 className="kit-bookcard-title">{book.title}</h3>
        <p className="kit-bookcard-auth">{book.author}</p>
        {book.genre && <span className="kit-genre-chip">{book.genre}</span>}
        {showOwner && book.owner && <p className="kit-owner">by {book.owner}</p>}
      </div>
    </a>
  );
}

function BookGrid({ books, onOpen, showOwner, emptyMessage = 'No books found.' }) {
  if (!books.length) {
    return <div className="kit-empty"><p className="ds-muted">{emptyMessage}</p></div>;
  }
  return (
    <div className="kit-bookgrid">
      {books.map((b) => <BookCard key={b.id} book={b} onOpen={onOpen} showOwner={showOwner} />)}
    </div>
  );
}

function BookFilters({ search, genre, onSearch, onGenre, genres }) {
  return (
    <div className="kit-filters">
      <div className="kit-filters-search">
        <Icon.Search size={16} />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by title or author..." />
      </div>
      <select className="kit-select" value={genre} onChange={(e) => onGenre(e.target.value)} aria-label="Filter by genre">
        <option value="">All Genres</option>
        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  );
}

const STATUS_VARIANT = { pending: 'outline', approved: 'default', handed_over: 'secondary', returned: 'secondary', denied: 'destructive', cancelled: 'outline' };
const STATUS_LABELS  = { pending: 'Pending', approved: 'Approved', handed_over: 'Handed Over', returned: 'Returned', denied: 'Denied', cancelled: 'Cancelled' };

function BorrowRequestCard({ request, role, onAction }) {
  const b = request.book;
  return (
    <div className="kit-req-card">
      <div className="kit-req-thumb"><BookCover book={{ ...b, is_lendable: undefined }} /></div>
      <div className="kit-req-body">
        <div className="kit-req-head">
          <div>
            <div className="kit-req-title">{b.title}</div>
            <div className="ds-muted">{b.author}</div>
          </div>
          <Badge variant={STATUS_VARIANT[request.status]}>{STATUS_LABELS[request.status]}</Badge>
        </div>
        {role === 'owner' && <div className="ds-muted">Requested by {request.requester}</div>}
        {request.message && <p className="kit-req-msg">&ldquo;{request.message}&rdquo;</p>}
        {request.due_date && <div className="ds-micro">Due: {request.due_date}</div>}
        <div className="ds-micro">{request.requested_at}</div>
        <div className="kit-req-actions">
          {role === 'owner' && request.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => onAction(request.id, 'approve')}><Icon.Check size={14} /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(request.id, 'deny')}>Deny</Button>
            </>
          )}
          {role === 'owner' && request.status === 'approved' && (
            <Button size="sm" onClick={() => onAction(request.id, 'hand_over')}>Hand Over</Button>
          )}
          {role === 'owner' && request.status === 'handed_over' && (
            <Button size="sm" onClick={() => onAction(request.id, 'return')}>Mark Returned</Button>
          )}
          {role === 'requester' && request.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => onAction(request.id, 'cancel')}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BorrowRequestForm({ onSubmit, submitted }) {
  const [msg, setMsg] = useSt('');
  const [due, setDue] = useSt('');
  return (
    <form className="kit-bform" onSubmit={(e) => { e.preventDefault(); onSubmit({ message: msg, due_date: due }); }}>
      <h3 className="ds-h3">Request to Borrow</h3>
      {submitted && (
        <div className="kit-banner kit-banner--success"><Icon.Check size={16} /> Request sent! The owner will be notified.</div>
      )}
      <div className="kit-field">
        <Label htmlFor="msg">Message to owner (optional)</Label>
        <Textarea id="msg" rows={3} maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)}
          placeholder="Let the owner know why you'd like to borrow this book..." />
      </div>
      <div className="kit-field">
        <Label htmlFor="due">Preferred return date (optional)</Label>
        <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: 'auto' }} />
      </div>
      <Button type="submit"><Icon.Send size={14} /> Send Request</Button>
    </form>
  );
}

Object.assign(window, { Header, BookCover, BookCard, BookGrid, BookFilters, BorrowRequestCard, BorrowRequestForm });
