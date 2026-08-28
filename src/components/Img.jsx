import { useEffect, useRef, useState } from 'react'

/**
 * Responsive image. Every source resolves to WebP at 400/800/1400,
 * lazy below the fold, and fades up from a warm placeholder so a slow
 * connection never shows a white hole.
 *
 * A cached image can finish loading before React attaches its onLoad
 * handler, so the ref is checked on mount too — otherwise anything
 * already in cache would sit at zero opacity forever.
 */
export default function Img({ data, alt = '', sizes, className = '', priority = false, position = 'center' }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el?.complete && el.naturalWidth > 0) setLoaded(true)
  }, [data?.src])

  if (!data) {
    return <div className={`bg-warm-100 ${className}`} aria-hidden="true" />
  }

  return (
    <img
      ref={ref}
      src={data.src}
      srcSet={data.srcSet}
      sizes={sizes || '100vw'}
      alt={alt}
      width={data.width}
      height={data.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      data-loaded={loaded ? 'true' : 'false'}
      className={`img-fade bg-warm-100 ${className}`}
      style={{ objectPosition: position }}
    />
  )
}
