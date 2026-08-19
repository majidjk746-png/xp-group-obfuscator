import { z } from "zod";

const MZ_MAGIC = Buffer.from([0x4d, 0x5a]);
const PE_SIG = Buffer.from([0x50, 0x45, 0x00, 0x00]);
const ELF_MAGIC = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
const MACHO_32 = Buffer.from([0xfe, 0xed, 0xfa]);
const MACHO_64 = Buffer.from([0xfe, 0xed, 0xfa, 0xcf]);

const ALLOWED_EXTENSIONS = [".exe", ".dll"];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export interface PeInfo {
  is32Bit: boolean;
  is64Bit: boolean;
  machine: number;
  subsystem: number;
  timestamp: number;
  sections: string[];
  isGui: boolean;
}

export const UploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export function validatePeMagic(bytes: Buffer): { valid: boolean; error?: string } {
  if (bytes.length < 64) {
    return { valid: false, error: "File too small to be a valid PE" };
  }

  if (!MZ_MAGIC.equals(bytes.subarray(0, 2))) {
    return { valid: false, error: "Invalid MZ header — not a PE file" };
  }

  const e_lfanew = bytes.readUInt32LE(0x3c);
  if (e_lfanew < 0x40 || e_lfanew + 4 >= bytes.length) {
    return { valid: false, error: "Invalid PE header offset" };
  }

  if (!PE_SIG.equals(bytes.subarray(e_lfanew, e_lfanew + 4))) {
    return { valid: false, error: "Invalid PE signature" };
  }

  return { valid: true };
}

export function parsePeInfo(bytes: Buffer): PeInfo | null {
  if (bytes.length < 64) return null;

  const e_lfanew = bytes.readUInt32LE(0x3c);
  if (e_lfanew + 24 >= bytes.length) return null;

  const peOffset = e_lfanew;
  const machine = bytes.readUInt16LE(peOffset + 4);
  const numSections = bytes.readUInt16LE(peOffset + 6);
  const timestamp = bytes.readUInt32LE(peOffset + 8);

  const optHeaderOffset = peOffset + 24;
  const magic = bytes.readUInt16LE(optHeaderOffset);

  const is32Bit = magic === 0x10b;
  const is64Bit = magic === 0x20b;

  let subsystem = 0;
  if (is32Bit && optHeaderOffset + 68 + 2 <= bytes.length) {
    subsystem = bytes.readUInt16LE(optHeaderOffset + 68);
  } else if (is64Bit && optHeaderOffset + 84 + 2 <= bytes.length) {
    subsystem = bytes.readUInt16LE(optHeaderOffset + 84);
  }

  const sections: string[] = [];
  const sectionHeaderSize = 40;
  const sectionStart = optHeaderOffset + (is32Bit ? 96 : 112);
  for (let i = 0; i < Math.min(numSections, 96); i++) {
    const off = sectionStart + i * sectionHeaderSize;
    if (off + 8 > bytes.length) break;
    const name = bytes.subarray(off, off + 8).toString("ascii").replace(/\0+$/, "");
    if (name) sections.push(name);
  }

  const isGui = subsystem === 2 || subsystem === 3;

  return { is32Bit, is64Bit, machine, subsystem, timestamp, sections, isGui };
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid extension "${ext}". Only .exe and .dll allowed.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 100MB.` };
  }
  if (file.size < 64) {
    return { valid: false, error: "File too small to be a valid PE" };
  }
  return { valid: true };
}

export { MAX_FILE_SIZE, ALLOWED_EXTENSIONS };
