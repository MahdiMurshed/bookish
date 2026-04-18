// Pages: SignIn, SignUp, Browse, MyLibrary, BookDetail, Requests
const { useState: uS } = React;

function SignInPage({ onNavigate, onSignIn }) {
  const [email, setE] = uS('demo@bookshare.io'); const [pw, setP] = uS('password');
  return (
    <div className="kit-auth">
      <div className="kit-auth-head">
        <h1 className="ds-h1">Sign In</h1>
        <p className="ds-muted">Welcome back to BookShare</p>
      </div>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); onSignIn(email); }}>
        <div className="kit-field">
          <Label htmlFor="e">Email</Label>
          <Input id="e" type="email" value={email} onChange={(e) => setE(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="kit-field">
          <Label htmlFor="p">Password</Label>
          <Input id="p" type="password" value={pw} onChange={(e) => setP(e.target.value)} placeholder="Your password" />
        </div>
        <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
      </form>
      <div className="kit-auth-foot">
        <a className="kit-link-btn">Forgot password?</a>
        <a className="kit-link-primary" onClick={() => onNavigate('signup')}>Create an account</a>
      </div>
    </div>
  );
}

function SignUpPage({ onNavigate, onSignIn }) {
  const [name, setN] = uS(''); const [email, setE] = uS(''); const [pw, setP] = uS(''); const [pw2, setP2] = uS('');
  const [err, setErr] = uS(null);
  const submit = (e) => {
    e.preventDefault();
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    onSignIn(email || 'demo@bookshare.io');
  };
  return (
    <div className="kit-auth">
      <div className="kit-auth-head">
        <h1 className="ds-h1">Create Account</h1>
        <p className="ds-muted">Join BookShare and start sharing books</p>
      </div>
      <form className="kit-form" onSubmit={submit}>
        {err && <div className="kit-banner kit-banner--error">{err}</div>}
        <div className="kit-field"><Label>Name</Label><Input value={name} onChange={(e) => setN(e.target.value)} placeholder="Your name" /></div>
        <div className="kit-field"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setE(e.target.value)} placeholder="you@example.com" /></div>
        <div className="kit-field"><Label>Password</Label><Input type="password" value={pw} onChange={(e) => setP(e.target.value)} placeholder="At least 6 characters" /></div>
        <div className="kit-field"><Label>Confirm Password</Label><Input type="password" value={pw2} onChange={(e) => setP2(e.target.value)} placeholder="Confirm your password" /></div>
        <Button type="submit" style={{ width: '100%' }}>Sign Up</Button>
      </form>
      <p className="ds-muted" style={{ textAlign: 'center' }}>Already have an account? <a className="kit-link-primary" onClick={() => onNavigate('signin')}>Sign in</a></p>
    </div>
  );
}

function BrowsePage({ books, onOpen }) {
  const [search, setS] = uS('');
  const [genre, setG] = uS('');
  const filtered = books.filter((b) =>
    (!search || (b.title + ' ' + b.author).toLowerCase().includes(search.toLowerCase())) &&
    (!genre || b.genre === genre)
  );
  return (
    <div className="kit-page">
      <div>
        <h1 className="ds-h1">Community Bookshelf</h1>
        <p className="ds-muted">Books available to borrow from the community</p>
      </div>
      <BookFilters search={search} genre={genre} onSearch={setS} onGenre={setG} genres={window.GENRES} />
      <BookGrid books={filtered} onOpen={onOpen} showOwner emptyMessage="No books available yet. Be the first to share a book!" />
    </div>
  );
}

function MyLibraryPage({ myBooks, onOpen, onAdd, onToggle, onDelete }) {
  const [showAdd, setA] = uS(false);
  const [f, setF] = uS({ title: '', author: '', genre: 'Fiction' });
  return (
    <div className="kit-page">
      <div className="kit-page-head">
        <div>
          <h1 className="ds-h1">My Library</h1>
          <p className="ds-muted">{myBooks.length} book{myBooks.length !== 1 ? 's' : ''}</p>
        </div>
        {!showAdd && <Button onClick={() => setA(true)}><Icon.Plus size={14} /> Add Book</Button>}
      </div>
      {showAdd && (
        <div className="kit-card kit-pad-4">
          <h2 className="ds-h2" style={{ marginBottom: 16 }}>Add a Book</h2>
          <form className="kit-form" onSubmit={(e) => { e.preventDefault(); onAdd(f); setA(false); setF({ title: '', author: '', genre: 'Fiction' }); }}>
            <div className="kit-field"><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
            <div className="kit-field"><Label>Author</Label><Input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} required /></div>
            <div className="kit-field"><Label>Genre</Label>
              <select className="kit-select" value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })}>
                {window.GENRES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit">Add Book</Button>
              <Button type="button" variant="outline" onClick={() => setA(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
      {myBooks.length > 0 ? (
        <div className="kit-bookgrid">
          {myBooks.map((b) => (
            <div key={b.id} className="kit-mylib-cell">
              <BookCard book={b} onOpen={onOpen} />
              <div className="kit-mylib-overlay">
                <label className="kit-checkbox">
                  <input type="checkbox" checked={b.is_lendable} onChange={() => onToggle(b.id)} />
                  Lendable
                </label>
                <button type="button" className="kit-delete" onClick={(e) => { e.preventDefault(); onDelete(b.id); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : !showAdd && (
        <div className="kit-empty">
          <p className="ds-muted">Your library is empty.</p>
          <a className="kit-link-primary" onClick={() => setA(true)}>Add your first book</a>
        </div>
      )}
    </div>
  );
}

function BookDetailPage({ book, currentUser, onNavigate, onRequest, requestStatus }) {
  const [submitted, setSub] = uS(false);
  const isOwner = book.owner_email === currentUser;
  const canRequest = !isOwner && book.is_lendable && !requestStatus;
  return (
    <div className="kit-detail">
      <div className="kit-detail-grid">
        <div className="kit-detail-cover"><BookCover book={{ ...book, is_lendable: undefined }} large /></div>
        <div className="kit-detail-info">
          <div>
            <h1 className="ds-h1">{book.title}</h1>
            <p className="ds-body-lg" style={{ color: 'var(--muted-foreground)' }}>{book.author}</p>
          </div>
          <div className="kit-detail-badges">
            {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
            {book.condition && <Badge variant="secondary" style={{ textTransform: 'capitalize' }}>{book.condition}</Badge>}
            {book.is_lendable
              ? <Badge variant="success">Available to borrow</Badge>
              : <Badge variant="outline">Not available</Badge>}
          </div>
          {book.description && <p className="ds-body" style={{ lineHeight: 1.625 }}>{book.description}</p>}
          {book.isbn && <p className="ds-micro">ISBN: {book.isbn}</p>}
          <div className="kit-card kit-pad-4">
            <p className="ds-muted">Owned by</p>
            <p style={{ fontWeight: 500 }}>{isOwner ? 'You' : book.owner}</p>
          </div>
          {requestStatus && (
            <div className="kit-banner kit-banner--info">
              You have a <strong>{requestStatus.replace(/_/g, ' ')}</strong> request for this book.
            </div>
          )}
          {canRequest && <BorrowRequestForm submitted={submitted} onSubmit={() => { setSub(true); onRequest(book.id); }} />}
          {isOwner && (
            <div className="kit-card kit-pad-4">
              <p className="ds-muted">This is your book. Manage borrow requests from the <a className="kit-link-primary" onClick={() => onNavigate('requests')}>Requests</a> page.</p>
            </div>
          )}
          {!isOwner && !book.is_lendable && !requestStatus && (
            <div className="kit-card kit-pad-4"><p className="ds-muted">This book is not currently available for borrowing.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestsPage({ incoming, outgoing, onAction }) {
  const pending = incoming.filter((r) => r.status === 'pending').length;
  return (
    <div className="kit-page" style={{ maxWidth: 768 }}>
      <div>
        <h1 className="ds-h1">Borrow Requests</h1>
        <p className="ds-muted">Manage incoming and outgoing borrow requests</p>
      </div>
      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">Incoming{pending > 0 && <Badge>{pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming">
          {incoming.length === 0
            ? <div className="kit-empty"><p className="ds-muted">No incoming borrow requests yet.</p></div>
            : <div className="kit-req-list">{incoming.map((r) => <BorrowRequestCard key={r.id} request={r} role="owner" onAction={onAction} />)}</div>}
        </TabsContent>
        <TabsContent value="outgoing">
          {outgoing.length === 0
            ? <div className="kit-empty"><p className="ds-muted">You haven't made any borrow requests yet.</p></div>
            : <div className="kit-req-list">{outgoing.map((r) => <BorrowRequestCard key={r.id} request={r} role="requester" onAction={onAction} />)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

Object.assign(window, { SignInPage, SignUpPage, BrowsePage, MyLibraryPage, BookDetailPage, RequestsPage });
