/** Centralized query key factories for React Query cache management */
export const queryKeys = {
  movies: {
    all:       ()       => ['movies'],
    popular:   (params) => ['movies', 'popular', params],
    trending:  (params) => ['movies', 'trending', params],
    genre:     (genre, params) => ['movies', 'genre', genre, params],
    detail:    (id)     => ['movies', id],
  },
  movie: (id) => ['movie', id],
  search: (q, params) => ['search', q, params],
  recommendations: {
    home:    (params) => ['recommendations', 'home', params],
    similar: (id, params) => ['recommendations', 'similar', id, params],
  },
  watchlist: {
    all: () => ['watchlist'],
  },
  auth: {
    me: () => ['auth', 'me'],
  },
  originals: {
    all:    ()              => ['originals'],
    list:   (params)        => ['originals', 'list', params],
    detail: (id)            => ['originals', id],
  },
  continueWatching: (params) => ['continueWatching', params],
  profile: () => ['profile'],
};
