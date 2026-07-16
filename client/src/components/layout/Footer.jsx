import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-surface bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link to="/" className="text-lg font-bold text-primary">
            CineStream
          </Link>
          <p className="text-sm text-txt-muted">
            &copy; {new Date().getFullYear()} CineStream. AI-powered movie discovery.
          </p>
        </div>
      </div>
    </footer>
  );
}
