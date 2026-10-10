import { ATLAS_HEIGHT, ATLAS_URL, ATLAS_WIDTH } from './atlas';

let pending: Promise<HTMLImageElement> | null = null;

export function loadAtlas(): Promise<HTMLImageElement> {
  if (pending) return pending;
  const request = new Promise<HTMLImageElement>((accept, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== ATLAS_WIDTH || image.naturalHeight !== ATLAS_HEIGHT) {
        reject(new Error('Map artwork dimensions are incompatible with this build. Reload online to update the cache.'));
      } else accept(image);
    };
    image.onerror = () => reject(new Error('Map artwork could not load. Reconnect and retry, or reload online.'));
    image.src = ATLAS_URL;
  });
  pending = request.catch(error => { pending = null; throw error; });
  return pending;
}
