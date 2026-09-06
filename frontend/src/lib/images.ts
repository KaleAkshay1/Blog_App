// Bundle the sample photographs so the first visit doesn't wait on a third-party CDN.
const sampleImages: Record<string, string> = {
  'photo-1470770841072-f978cf4d019e': 'alpine-lake',
  'photo-1494438639946-1ebd1d20bf85': 'thoughtful-design',
  'photo-1464822759023-fed622ff2c3b': 'mountain-path',
  'photo-1496181133206-80ce9b88a853': 'quiet-technology',
  'photo-1493106641515-6b5631de4bb9': 'pottery',
  'photo-1441974231531-c6227db76b6e': 'forest-light',
  'photo-1442512595331-e89e73853f31': 'sunday-coffee',
  'photo-1455390582262-044cdead277a': 'notebook',
  'photo-1507842217343-583bb7270b66': 'bookshop',
  'photo-1534528741775-53994a69daeb': 'olivia',
  'photo-1500648767791-00dcc994a43e': 'alex',
  'photo-1524504388940-b1c1722653e1': 'sophie',
  'photo-1506794778202-cad84cf45f1d': 'james',
}

export function imageSource(src: string) {
  try {
    const url = new URL(src)
    const name =
      url.hostname === 'images.unsplash.com' ? sampleImages[url.pathname.slice(1)] : undefined
    return name ? `/images/${name}.jpg` : src
  } catch {
    return src
  }
}
