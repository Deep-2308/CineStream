import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Info, Star } from 'lucide-react';
import { backdropUrl } from '../../lib/tmdbImage.js';
import Image from '../common/Image.jsx';
import Button from '../ui/Button.jsx';

const HeroBanner = memo(({ movie }) => {
  if (!movie) return null;

  // Fallback to posterPath if backdrop is missing
  const bgPath = movie.backdropPath || movie.posterPath;
  const url = backdropUrl(bgPath, 'w1280');
  
  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
  // Truncate overview if too long
  const overview = movie.overview?.length > 180 
    ? `${movie.overview.substring(0, 180)}...` 
    : movie.overview;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative w-full h-[60vh] md:h-[80vh] min-h-[400px] max-h-[800px] bg-background"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradients for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent w-[80%]" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-12 md:pb-24 pt-32">
        <div className="max-w-2xl relative z-10 flex flex-col items-start gap-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-txt drop-shadow-md">
            {movie.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm md:text-base text-txt-muted font-medium">
            {movie.voteAverage > 0 && (
              <span className="flex items-center gap-1 text-secondary">
                <Star size={16} className="fill-secondary" />
                {movie.voteAverage.toFixed(1)}
              </span>
            )}
            {releaseYear && <span>{releaseYear}</span>}
            {movie.runtime > 0 && <span>{movie.runtime} min</span>}
            {movie.genres?.length > 0 && (
              <span className="hidden sm:inline-block border border-surface px-2 py-0.5 rounded text-xs bg-surface/50 backdrop-blur-sm text-txt">
                {movie.genres[0]}
              </span>
            )}
          </div>

          <p className="text-sm md:text-lg text-txt-muted max-w-xl drop-shadow-sm line-clamp-3 md:line-clamp-4">
            {overview}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Button 
              variant="primary" 
              size="lg" 
              className="gap-2 px-6"
              onClick={() => alert("Video playback placeholder")}
            >
              <Play size={20} className="fill-current" />
              Play
            </Button>
            
            <Link to={`/movie/${movie._id}`} tabIndex={-1}>
              <Button variant="secondary" size="lg" className="gap-2 px-6 bg-surface/50 hover:bg-surface backdrop-blur-md">
                <Info size={20} />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
