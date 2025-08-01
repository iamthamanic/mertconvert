import { describe, it, expect } from '@jest/globals';
import { validatePath, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../src/utils';

describe('validatePath', () => {
  it('should validate and return absolute path', () => {
    const result = validatePath('./test/path');
    expect(result).toContain('test/path');
  });

  it('should remove quotes from path', () => {
    const result = validatePath('"./test/path"');
    expect(result).toContain('test/path');
  });

  it('should remove single quotes from path', () => {
    const result = validatePath("'./test/path'");
    expect(result).toContain('test/path');
  });

  it('should trim whitespace', () => {
    const result = validatePath('  ./test/path  ');
    expect(result).toContain('test/path');
  });

  it('should throw error for path traversal with ..', () => {
    expect(() => validatePath('../../../etc/passwd')).toThrow('Invalid path: Path traversal detected');
  });

  it('should throw error for path with ~', () => {
    expect(() => validatePath('~/sensitive/file')).toThrow('Invalid path: Path traversal detected');
  });
});

describe('constants', () => {
  it('should have image extensions', () => {
    expect(IMAGE_EXTENSIONS).toContain('.jpg');
    expect(IMAGE_EXTENSIONS).toContain('.png');
    expect(IMAGE_EXTENSIONS).toContain('.gif');
  });

  it('should have video extensions', () => {
    expect(VIDEO_EXTENSIONS).toContain('.mp4');
    expect(VIDEO_EXTENSIONS).toContain('.mov');
    expect(VIDEO_EXTENSIONS).toContain('.webm');
  });
});