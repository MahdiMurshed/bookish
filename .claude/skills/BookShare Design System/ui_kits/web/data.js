// Seed data for the demo prototype.
window.GENRES = ['Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller','Romance','Biography','History','Philosophy','Poetry'];

const covers = [
  { bg: 'linear-gradient(160deg,#7a3b2e,#2c1810)', fg: '#f3e8c8' },
  { bg: 'linear-gradient(160deg,#1a3a5c,#0a1828)', fg: '#e8eef7' },
  { bg: 'linear-gradient(160deg,#2d5048,#0f2320)', fg: '#e3f1e8' },
  { bg: 'linear-gradient(160deg,#5a4828,#231a0d)', fg: '#f4e6c4' },
  { bg: 'linear-gradient(160deg,#4a2860,#180a28)', fg: '#eedcff' },
  { bg: 'linear-gradient(160deg,#8c2d2d,#2b0808)', fg: '#ffe6d4' },
  { bg: 'linear-gradient(160deg,#184a5a,#061e28)', fg: '#d7ecf1' },
  { bg: 'linear-gradient(160deg,#3a3a3a,#0a0a0a)', fg: '#ffffff' },
  { bg: 'linear-gradient(160deg,#c28a2d,#463010)', fg: '#0f0a00' },
  { bg: 'linear-gradient(160deg,#214e2d,#081a0d)', fg: '#dff3e4' },
];

let _id = 0;
const mk = (title, author, genre, ownerEmail, ownerName, is_lendable, description, condition, cidx) => ({
  id: 'b' + (++_id),
  title, author, genre,
  owner: ownerName, owner_email: ownerEmail,
  is_lendable, description, condition,
  cover_bg: covers[cidx % covers.length].bg,
  cover_fg: covers[cidx % covers.length].fg,
  isbn: '9780' + (1000000000 + _id * 13),
});

window.SEED_BOOKS = [
  mk('The Left Hand of Darkness','Ursula K. Le Guin','Science Fiction','rhea@bookshare.io','Rhea',true,'A lone human envoy is sent to Winter, an alien world whose inhabitants can change gender.','excellent',0),
  mk('Piranesi','Susanna Clarke','Fantasy','sam@bookshare.io','Sam',true,'Piranesi\'s house is no ordinary building: its rooms are infinite, its corridors endless.','mint',1),
  mk('Braiding Sweetgrass','Robin Wall Kimmerer','Non-Fiction','maya@bookshare.io','Maya',true,'Indigenous wisdom, scientific knowledge, and the teachings of plants.','good',2),
  mk('The Overstory','Richard Powers','Fiction','demo@bookshare.io','You',true,'Nine strangers, each summoned in different ways by trees.','good',3),
  mk('Pachinko','Min Jin Lee','Fiction','rhea@bookshare.io','Rhea',true,'Four generations of a Korean family make their way in the 20th century.','fair',4),
  mk('The Three-Body Problem','Liu Cixin','Science Fiction','leo@bookshare.io','Leo',false,'Set against the backdrop of China\'s Cultural Revolution.','excellent',5),
  mk('Sea of Tranquility','Emily St. John Mandel','Science Fiction','sam@bookshare.io','Sam',true,'A virtuoso novel in which time travel is real and paradoxes abound.','mint',6),
  mk('The Goldfinch','Donna Tartt','Fiction','maya@bookshare.io','Maya',true,'A young boy survives an accident that kills his mother.','good',7),
  mk('Educated','Tara Westover','Biography','demo@bookshare.io','You',false,'A memoir of a young woman\'s quest for knowledge.','good',8),
  mk('Klara and the Sun','Kazuo Ishiguro','Science Fiction','leo@bookshare.io','Leo',true,'From her place in the store, Klara, an Artificial Friend, observes.','excellent',9),
  mk('The Night Circus','Erin Morgenstern','Fantasy','rhea@bookshare.io','Rhea',true,'A magical competition between two young illusionists.','fair',0),
  mk('Station Eleven','Emily St. John Mandel','Fiction','sam@bookshare.io','Sam',true,'Set in the days of civilization\'s collapse.','good',2),
];

window.SEED_REQUESTS = [
  { id: 'r1', book: window.SEED_BOOKS[0], requester: 'Leo', requester_email: 'leo@bookshare.io', owner_email: 'rhea@bookshare.io', status: 'pending', message: 'Been meaning to read this for ages. Promise to return it by the end of the month!', due_date: '2026-05-15', requested_at: 'Apr 15, 2026' },
  { id: 'r2', book: window.SEED_BOOKS[3], requester: 'Sam', requester_email: 'sam@bookshare.io', owner_email: 'demo@bookshare.io', status: 'pending', message: null, due_date: null, requested_at: 'Apr 16, 2026' },
  { id: 'r3', book: window.SEED_BOOKS[8], requester: 'Maya', requester_email: 'maya@bookshare.io', owner_email: 'demo@bookshare.io', status: 'approved', message: 'Would love to borrow this.', due_date: '2026-05-01', requested_at: 'Apr 10, 2026' },
  { id: 'r4', book: window.SEED_BOOKS[1], requester: 'You', requester_email: 'demo@bookshare.io', owner_email: 'sam@bookshare.io', status: 'handed_over', message: null, due_date: '2026-05-20', requested_at: 'Apr 8, 2026' },
  { id: 'r5', book: window.SEED_BOOKS[5], requester: 'You', requester_email: 'demo@bookshare.io', owner_email: 'leo@bookshare.io', status: 'denied', message: 'Really want to read this.', due_date: null, requested_at: 'Apr 2, 2026' },
];
