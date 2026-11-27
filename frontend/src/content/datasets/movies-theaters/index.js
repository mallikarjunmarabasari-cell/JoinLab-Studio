import datasetSql from './dataset.sql?raw'

const datasetId = 'movies-theaters'

const practiceItems = [
    {
        id: 'view-movie-details',
        slug: 'view-movie-details',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'View movie details',
        prompt: 'Retrieve all details of the movies.',
        topic: 'SELECT',
        difficulty: 'easy',
        starter_sql: `SELECT
    -- Choose the columns to retrieve
FROM movies;`,
        hints: [
            'Use SELECT to specify the columns.',
            'The table name is movies.',
        ],
        points: 10,
        sort_order: 1,
        reference_sql: `SELECT *
FROM movies;`,
    },
    {
        id: 'filter-action-thriller-movies',
        slug: 'filter-action-thriller-movies',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter by multiple genres',
        prompt: 'Retrieve the titles of movies whose genre is Action or Thriller.',
        topic: 'IN',
        difficulty: 'easy',
        starter_sql: `SELECT title
FROM movies
WHERE -- Filter the requested genres;`,
        hints: [
            'Use IN to match multiple genre values.',
            'Text values must be enclosed in single quotes.',
        ],
        points: 10,
        sort_order: 2,
        reference_sql: `SELECT title
FROM movies
WHERE genre IN ('Action', 'Thriller');`,
    },
    {
        id: 'telugu-or-action-movies',
        slug: 'telugu-or-action-movies',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Combine conditions with OR',
        prompt: 'Display the title, director and producer for movies whose language is Telugu or whose genre is Action.',
        topic: 'OR',
        difficulty: 'easy',
        starter_sql: `SELECT title, director, producer
FROM movies
WHERE -- Add the language and genre conditions;`,
        hints: [
            'Use OR when either condition can qualify a movie.',
            'Compare language with Telugu and genre with Action.',
        ],
        points: 15,
        sort_order: 3,
        reference_sql: `SELECT title, director, producer
FROM movies
WHERE language = 'Telugu'
   OR genre = 'Action';`,
    },
    {
        id: 'maximum-theater-capacity',
        slug: 'maximum-theater-capacity',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find maximum theater capacity',
        prompt: 'Find the maximum capacity among all theaters.',
        topic: 'MAX',
        difficulty: 'easy',
        starter_sql: `SELECT
    -- Calculate the maximum capacity
FROM theaters;`,
        hints: [
            'Use the MAX aggregate function.',
            'The column is capacity in the theaters table.',
        ],
        points: 10,
        sort_order: 4,
        reference_sql: `SELECT MAX(capacity) AS maximum_capacity
FROM theaters;`,
    },
    {
        id: 'count-theaters-by-screen-type',
        slug: 'count-theaters-by-screen-type',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Count theaters by screen type',
        prompt: 'Count the number of theaters for each screen type.',
        topic: 'GROUP BY',
        difficulty: 'medium',
        starter_sql: `SELECT screen_type, COUNT(*) AS theater_count
FROM theaters
GROUP BY -- Group by the screen type;`,
        hints: [
            'Use COUNT(*) to count the theaters.',
            'Group rows using screen_type.',
        ],
        points: 15,
        sort_order: 5,
        reference_sql: `SELECT screen_type, COUNT(*) AS theater_count
FROM theaters
GROUP BY screen_type
ORDER BY screen_type;`,
    },
    {
        id: 'rajamouli-movies-by-language',
        slug: 'rajamouli-movies-by-language',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Count Rajamouli movies by language',
        prompt: 'Count movies by language for movies directed by Rajamouli.',
        topic: 'WHERE / GROUP BY',
        difficulty: 'medium',
        starter_sql: `SELECT language, COUNT(*) AS movie_count
FROM movies
WHERE -- Filter movies by director
GROUP BY language;`,
        hints: [
            'Filter the director before grouping the rows.',
            'Use COUNT(*) with GROUP BY language.',
        ],
        points: 15,
        sort_order: 6,
        reference_sql: `SELECT language, COUNT(*) AS movie_count
FROM movies
WHERE director = 'Rajamouli'
GROUP BY language;`,
    },
    {
        id: 'find-repeated-genres',
        slug: 'find-repeated-genres',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find repeated genres',
        prompt: 'Find the genre names that occur more than once.',
        topic: 'GROUP BY / HAVING',
        difficulty: 'medium',
        starter_sql: `SELECT genre
FROM movies
GROUP BY genre
HAVING -- Keep genres occurring more than once;`,
        hints: [
            'GROUP BY creates one group per genre.',
            'Use HAVING with COUNT(*) to filter repeated genres.',
        ],
        points: 20,
        sort_order: 7,
        reference_sql: `SELECT genre
FROM movies
GROUP BY genre
HAVING COUNT(*) > 1
ORDER BY genre;`,
    },
    {
        id: 'producers-with-multiple-movies',
        slug: 'producers-with-multiple-movies',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find producers with multiple movies',
        prompt: 'Count movies for each producer, showing only producers who produced more than one movie.',
        topic: 'GROUP BY / HAVING',
        difficulty: 'medium',
        starter_sql: `SELECT producer, COUNT(*) AS movie_count
FROM movies
GROUP BY producer
HAVING -- Keep producers with multiple movies;`,
        hints: [
            'Group the movies by producer.',
            'Use HAVING to filter groups with a count greater than one.',
        ],
        points: 20,
        sort_order: 8,
        reference_sql: `SELECT producer, COUNT(*) AS movie_count
FROM movies
GROUP BY producer
HAVING COUNT(*) > 1;`,
    },
    {
        id: 'languages-with-multiple-movies',
        slug: 'languages-with-multiple-movies',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find languages with multiple movies',
        prompt: 'Count movies for each language, showing only languages with more than one movie.',
        topic: 'GROUP BY / HAVING',
        difficulty: 'medium',
        starter_sql: `SELECT language, COUNT(*) AS movie_count
FROM movies
GROUP BY language
HAVING -- Keep languages with multiple movies;`,
        hints: [
            'Group rows by language.',
            'Use HAVING COUNT(*) to filter the grouped results.',
        ],
        points: 20,
        sort_order: 9,
        reference_sql: `SELECT language, COUNT(*) AS movie_count
FROM movies
GROUP BY language
HAVING COUNT(*) > 1
ORDER BY language;`,
    },
    {
        id: 'theaters-by-capacity-or-imax',
        slug: 'theaters-by-capacity-or-imax',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter theaters by capacity or screen',
        prompt: 'Return theater name and theater ID for theaters whose capacity is 500 or 600, or whose screen type is IMAX.',
        topic: 'IN / OR',
        difficulty: 'medium',
        starter_sql: `SELECT theater_name, theater_id
FROM theaters
WHERE -- Filter by capacity or screen type;`,
        hints: [
            'Use IN for the two capacity values.',
            'Combine the capacity condition and IMAX condition with OR.',
        ],
        points: 15,
        sort_order: 10,
        reference_sql: `SELECT theater_name, theater_id
FROM theaters
WHERE capacity IN (500, 600)
   OR screen_type = 'IMAX';`,
    },
    {
        id: 'sort-movie-titles',
        slug: 'sort-movie-titles',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Sort movie titles alphabetically',
        prompt: 'Display movie titles in alphabetical order.',
        topic: 'ORDER BY',
        difficulty: 'easy',
        starter_sql: `SELECT title
FROM movies
ORDER BY -- Sort titles alphabetically;`,
        hints: [
            'Use ORDER BY on the title column.',
            'Ascending order is the default.',
        ],
        points: 10,
        sort_order: 11,
        preserve_order: true,
        reference_sql: `SELECT title
FROM movies
ORDER BY title ASC;`,
    },
    {
        id: 'join-theaters-with-movies',
        slug: 'join-theaters-with-movies',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Join theaters with movies',
        prompt: 'Display each theater name and city together with the title and language of its assigned movie.',
        topic: 'INNER JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT
    -- Select theater and movie details
FROM theaters AS t
INNER JOIN movies AS m
    ON -- Match the assigned movie;`,
        hints: [
            'The theaters table stores the movie_id foreign key.',
            'Join theaters.movie_id with movies.movie_id.',
        ],
        points: 25,
        sort_order: 12,
        preserve_order: true,
        reference_sql: `SELECT
    t.theater_name,
    t.city,
    m.title,
    m.language
FROM theaters AS t
INNER JOIN movies AS m
    ON t.movie_id = m.movie_id
ORDER BY t.theater_id;`,
    },
]

const moviesTheatersDataset = {
    id: datasetId,
    slug: datasetId,
    name: 'Movies & Theaters',
    description: 'A linked movie and theater dataset for practising filters, aggregate functions, grouping, HAVING, sorting and INNER JOIN.',
    dataset_sql: datasetSql,
    expected_tables: ['movies', 'theaters'],
    version: 1,
    practice_items: practiceItems,
}

export default moviesTheatersDataset