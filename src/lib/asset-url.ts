// Local Vite has no Lovable asset proxy; use the project's asset-serving origin there.
export function assetUrl(path: string, local = import.meta.env.DEV) {
  return local && path.startsWith('/__l5e/assets-v1/')
    ? `https://id-preview--59b23c25-7388-45ec-b696-df4ad8eaa52b.lovable.app${path}`
    : path;
}