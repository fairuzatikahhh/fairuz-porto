import type { Frame } from '../frames';

// frame video transisi berjalan (null = karakter di luar layar), fps, frame saat karakter pindah
// tepi layar (teks berganti di sini), lebar video & geseran kepala di akhir (px file)
export interface WalkVideo { frames: (Frame | null)[]; fps: number; swapAt: number; videoW: number; endDx: number }
