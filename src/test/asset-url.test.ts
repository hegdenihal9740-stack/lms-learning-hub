import { describe, expect, it } from 'vitest';
import { assetUrl } from '@/lib/asset-url';

describe('local media URLs', () => {
  it('serves CDN media from a reachable origin on localhost', () => {
    expect(assetUrl('/__l5e/assets-v1/student/boy.png', true)).toBe('https://id-preview--59b23c25-7388-45ec-b696-df4ad8eaa52b.lovable.app/__l5e/assets-v1/student/boy.png');
  });
  it('preserves same-origin media in production and bundled logos locally', () => {
    expect(assetUrl('/__l5e/assets-v1/student/boy.png', false)).toBe('/__l5e/assets-v1/student/boy.png');
    expect(assetUrl('/assets/logo.png', true)).toBe('/assets/logo.png');
  });
});