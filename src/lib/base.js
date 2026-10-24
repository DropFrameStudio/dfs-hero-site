// Where the model, decoders and textures live.
// Full site: served from the site root. Embed build: next to dfs-hero.js, wherever that is hosted.
const ROOT = typeof __DFS_EMBED__ !== 'undefined' && __DFS_EMBED__ ? new URL('./', import.meta.url).href : '/'
export const asset = (path) => ROOT + path
