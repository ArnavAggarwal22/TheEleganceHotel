import { useState, type ImgHTMLAttributes } from 'react';

/** Image with lazy loading, a soft fade-in and a graceful branded fallback. */
const Img = ({ className = '', alt = '', loading = 'lazy', ...rest }: ImgHTMLAttributes<HTMLImageElement>) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} bg-gradient-to-br from-ink-700 via-ink-600 to-gold-dark/60`}
      />
    );
  }

  return (
    <img
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      {...rest}
    />
  );
};

export default Img;
