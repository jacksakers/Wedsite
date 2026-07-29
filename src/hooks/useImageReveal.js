import { useEffect, useRef, useState } from 'react'

/**
 * Shared "reveal once fully decoded" logic used by the polaroid-drop /
 * photo-reveal animations. Waits for `img.decode()` (not just the `load`
 * event) so the reveal transition never starts on top of a still-decoding
 * image, which otherwise reads as an abrupt pop instead of a smooth settle.
 *
 * Usage:
 *   const { loaded, imgRef, onLoad } = useImageReveal()
 *   <img ref={imgRef} onLoad={onLoad} className={loaded ? 'photo-reveal-landed' : 'photo-reveal-pending'} />
 */
export function useImageReveal() {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)

  const reveal = (img) => {
    if (!img) return
    if (typeof img.decode === 'function') {
      img.decode().then(() => setLoaded(true)).catch(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }

  useEffect(() => {
    // If the image was already cached/decoded before mount, `load` won't fire.
    if (imgRef.current?.complete) {
      reveal(imgRef.current)
    }
  }, [])

  const onLoad = (e) => reveal(e.currentTarget)

  return { loaded, imgRef, onLoad }
}
