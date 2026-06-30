-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM - SEED DATA
-- Group 4 | seed.sql
-- Run AFTER schema.sql
-- ============================================================

-- ---- Authors ------------------------------------------------
INSERT INTO authors (first_name, last_name, bio, nationality) VALUES
  ('Chinua',    'Achebe',    'Nigerian novelist and poet, author of Things Fall Apart.',      'Nigerian'),
  ('Chimamanda','Adichie',   'Nigerian author known for Half of a Yellow Sun.',               'Nigerian'),
  ('Ngugi',     'wa Thiong''o','Kenyan novelist and academic.',                               'Kenyan'),
  ('Wole',      'Soyinka',   'Nobel Prize laureate in Literature 1986.',                      'Nigerian'),
  ('Robert',    'Sedgewick', 'Professor at Princeton, author of Algorithms.',                 'American'),
  ('Andrew',    'Tanenbaum', 'Author of Modern Operating Systems.',                           'Dutch'),
  ('James',     'Kurose',    'Co-author of Computer Networking: A Top-Down Approach.',        'American'),
  ('Abraham',   'Silberschatz','Co-author of Database System Concepts.',                      'American'),
  ('Thomas',    'Cormen',    'Co-author of Introduction to Algorithms (CLRS).',               'American'),
  ('George',    'Orwell',    'English novelist and essayist, famous for 1984 and Animal Farm.','British');

-- ---- Categories ---------------------------------------------
INSERT INTO categories (name, description) VALUES
  ('African Literature',  'Works by African authors exploring African themes and history.'),
  ('Computer Science',    'Textbooks and references for computing, algorithms, and systems.'),
  ('Database Systems',    'Books covering relational databases, SQL, and data management.'),
  ('Networking',          'Computer networking, protocols, and distributed systems.'),
  ('Operating Systems',   'Books on OS theory, design, and implementation.'),
  ('Classic Literature',  'Timeless works of fiction and prose from world literature.'),
  ('Science Fiction',     'Speculative fiction exploring futuristic and scientific themes.'),
  ('Mathematics',         'Pure and applied mathematics textbooks.');

-- ---- Books --------------------------------------------------
INSERT INTO books (isbn, title, author_id, category_id, publisher, publish_year, total_copies, available_copies, shelf_location, description) VALUES
  ('978-0385474542', 'Things Fall Apart',                    1, 1, 'Anchor Books',     1958, 4, 4, 'A1-01', 'A classic of African literature set in pre-colonial Nigeria.'),
  ('978-1400095209', 'Half of a Yellow Sun',                 2, 1, 'Knopf',            2006, 3, 3, 'A1-02', 'Novel set during the Biafran War in Nigeria.'),
  ('978-0143039020', 'A Grain of Wheat',                     3, 1, 'Penguin Classics',  1967, 2, 2, 'A1-03', 'Story of Kenyan independence and its aftermath.'),
  ('978-0679720201', 'Death and the King''s Horseman',        4, 1, 'Norton',           1975, 2, 2, 'A1-04', 'Play based on a real event in Yoruba history.'),
  ('978-0321573513', 'Algorithms (4th Edition)',              5, 2, 'Addison-Wesley',   2011, 3, 3, 'B2-01', 'Comprehensive introduction to algorithms and data structures.'),
  ('978-0136006633', 'Modern Operating Systems',             6, 5, 'Pearson',           2014, 3, 3, 'B2-02', 'Modern OS concepts including processes, memory, and file systems.'),
  ('978-0136079675', 'Computer Networking: Top-Down Approach',7, 4, 'Pearson',          2016, 4, 4, 'B2-03', 'Networking from application layer down to physical layer.'),
  ('978-0073523321', 'Database System Concepts',             8, 3, 'McGraw-Hill',       2010, 3, 3, 'B3-01', 'Comprehensive coverage of database management systems.'),
  ('978-0262033848', 'Introduction to Algorithms (CLRS)',    9, 2, 'MIT Press',         2009, 2, 2, 'B2-04', 'The definitive reference for algorithms — "the big red book".'),
  ('978-0451524935', '1984',                                10, 7, 'Signet Classic',    1949, 5, 5, 'C1-01', 'Dystopian novel about totalitarianism and surveillance.');

-- ---- Users (library members) --------------------------------
INSERT INTO users (member_id, first_name, last_name, email, phone, address, user_type) VALUES
  ('LIB-2024-001', 'Amara',    'Okonkwo',  'amara.o@uni.edu',    '08012345678', '12 Palm St, Lagos',         'student'),
  ('LIB-2024-002', 'Kwame',    'Mensah',   'kwame.m@uni.edu',    '08023456789', '5 Accra Rd, Kumasi',        'student'),
  ('LIB-2024-003', 'Fatima',   'Ibrahim',  'fatima.i@uni.edu',   '08034567890', '22 Gidan Kwano, Minna',     'student'),
  ('LIB-2024-004', 'Emeka',    'Chukwu',   'emeka.c@uni.edu',    '08045678901', '9 Ring Rd, Enugu',          'student'),
  ('LIB-2024-005', 'Aisha',    'Bello',    'aisha.b@uni.edu',    '08056789012', '3 Zaria St, Kaduna',        'student'),
  ('LIB-2024-006', 'David',    'Osei',     'david.o@uni.edu',    '08067890123', '17 Liberation Rd, Accra',   'student'),
  ('LIB-2024-007', 'Ngozi',    'Eze',      'ngozi.e@uni.edu',    '08078901234', '44 Owerri Rd, Imo',         'student'),
  ('LIB-2024-008', 'Samuel',   'Adeyemi',  'samuel.a@staff.edu', '08089012345', 'Faculty Block B, Room 201', 'staff'),
  ('LIB-2024-009', 'Grace',    'Mwangi',   'grace.m@uni.edu',    '08090123456', '8 Uhuru Rd, Nairobi',       'student'),
  ('LIB-2024-010', 'Kofi',     'Asante',   'kofi.a@uni.edu',     '08001234567', '2 Independence Ave, Tema',  'student');

-- ---- Sample Borrowings (some returned, some active, some overdue) ----

-- Returned borrowings
INSERT INTO borrowings (book_id, user_id, issued_by, issue_date, due_date, return_date, status) VALUES
  (1,  1, 'Mrs. Adaeze', datetime('now','-30 days'), datetime('now','-16 days'), datetime('now','-18 days'), 'returned'),
  (5,  2, 'Mrs. Adaeze', datetime('now','-25 days'), datetime('now','-11 days'), datetime('now','-12 days'), 'returned'),
  (8,  3, 'Mr. Tunde',   datetime('now','-20 days'), datetime('now','-6 days'),  datetime('now','-7 days'),  'returned'),
  (10, 4, 'Mr. Tunde',   datetime('now','-15 days'), datetime('now','-1 day'),   datetime('now','-2 days'),  'returned');

-- Active (on-time) borrowings
INSERT INTO borrowings (book_id, user_id, issued_by, issue_date, due_date, status) VALUES
  (2,  5, 'Mrs. Adaeze', datetime('now','-5 days'), datetime('now','+9 days'), 'issued'),
  (6,  6, 'Mr. Tunde',   datetime('now','-3 days'), datetime('now','+11 days'),'issued'),
  (9,  7, 'Mrs. Adaeze', datetime('now','-2 days'), datetime('now','+12 days'),'issued');

-- Overdue borrowings (past due date, not returned)
INSERT INTO borrowings (book_id, user_id, issued_by, issue_date, due_date, status) VALUES
  (3,  8, 'Mr. Tunde',   datetime('now','-21 days'), datetime('now','-7 days'), 'overdue'),
  (7,  9, 'Mrs. Adaeze', datetime('now','-18 days'), datetime('now','-4 days'), 'overdue'),
  (4, 10, 'Mr. Tunde',   datetime('now','-25 days'), datetime('now','-11 days'),'overdue');

-- Update book available_copies for active/overdue issues
UPDATE books SET available_copies = available_copies - 1 WHERE book_id IN (2, 3, 4, 6, 7, 9);

-- ---- Fines for overdue borrowings ---------------------------
INSERT INTO fines (borrowing_id, user_id, overdue_days, rate_per_day, total_amount, paid) VALUES
  (9,  8, 7,  0.50, 3.50, 0),
  (10, 9, 4,  0.50, 2.00, 0),
  (11, 10, 11, 0.50, 5.50, 0);

-- One historical paid fine
INSERT INTO fines (borrowing_id, user_id, overdue_days, rate_per_day, total_amount, paid, paid_at) VALUES
  (1, 1, 2, 0.50, 1.00, 1, datetime('now','-17 days'));
