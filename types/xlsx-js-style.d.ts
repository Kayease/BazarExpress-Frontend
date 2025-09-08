declare module 'xlsx-js-style' {
  export type WorkBook = any
  export type WorkSheet = any
  export const utils: {
    aoa_to_sheet(data: any[][]): WorkSheet
    book_new(): WorkBook
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void
    encode_cell(cell: { r: number; c: number }): string
    encode_range(range: { s: { r: number; c: number }; e: { r: number; c: number } }): string
  }
  export function writeFile(wb: WorkBook, filename: string): void
  const xlsx: any
  export default xlsx
}


