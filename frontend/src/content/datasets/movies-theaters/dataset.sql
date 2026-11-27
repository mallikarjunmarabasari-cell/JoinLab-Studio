CREATE TABLE movies (
    movie_id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    director VARCHAR(60) NOT NULL,
    genre VARCHAR(30) NOT NULL,
    producer VARCHAR(60) NOT NULL,
    language VARCHAR(30) NOT NULL,
    movie_code VARCHAR(10) NOT NULL UNIQUE
);

INSERT INTO movies (
    movie_id, title, director, genre, producer, language, movie_code
) VALUES
(1, 'KGF', 'Prashanth', 'Action', 'Hombale', 'Kannada', 'MOV001'),
(2, 'Kantara', 'Rishab', 'Drama', 'Hombale', 'Kannada', 'MOV002'),
(3, 'RRR', 'Rajamouli', 'Action', 'DVV', 'Telugu', 'MOV003'),
(4, 'Pushpa', 'Sukumar', 'Thriller', 'Mythri', 'Telugu', 'MOV004'),
(5, 'Dangal', 'Nitesh', 'Sports', 'Aamir', 'Hindi', 'MOV005'),
(6, 'PK', 'Hirani', 'Comedy', 'Vinod', 'Hindi', 'MOV006'),
(7, 'Drishyam', 'Jeethu', 'Thriller', 'Aashirvad', 'Malayalam', 'MOV007'),
(8, 'Premam', 'Alphonse', 'Romance', 'Anwar', 'Malayalam', 'MOV008'),
(9, 'Vikram', 'Lokesh', 'Action', 'Rajkamal', 'Tamil', 'MOV009'),
(10, 'Ponniyin', 'Mani', 'History', 'Lyca', 'Tamil', 'MOV010');

CREATE TABLE theaters (
    theater_id INTEGER PRIMARY KEY,
    theater_name VARCHAR(80) NOT NULL,
    city VARCHAR(60) NOT NULL,
    screen_type VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    movie_id INTEGER NOT NULL REFERENCES movies(movie_id)
);

INSERT INTO theaters (
    theater_id, theater_name, city, screen_type, capacity, movie_id
) VALUES
(301, 'Urvashi', 'Bangalore', 'IMAX', 500, 1),
(302, 'PVR', 'Mysore', '4DX', 400, 2),
(303, 'Inox', 'Hyderabad', '3D', 350, 3),
(304, 'Asian', 'Vijayawada', '2D', 300, 4),
(305, 'Carnival', 'Delhi', 'IMAX', 600, 5),
(306, 'Wave', 'Mumbai', '4DX', 450, 6),
(307, 'Sree', 'Kochi', '2D', 250, 7),
(308, 'Aashirvad', 'Trivandrum', '3D', 280, 8),
(309, 'Sathyam', 'Chennai', 'IMAX', 700, 9),
(310, 'Escape', 'Coimbatore', '4DX', 500, 10);