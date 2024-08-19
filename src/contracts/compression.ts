/**
 * solve Compression I: RLE Compression
 * 
 * @param {string} data the contract data
 * @return {string} the contract answer
 */
export function compression1RleCompression(data: string): string {
  let ch = data.charAt(0);
  let cnt = 1;
  let res = "";
  for (let i = 1; i < data.length; i++) {
    if (ch !== data.charAt(i) || cnt == 9) {
      res += cnt.toString() + ch;
      ch = data.charAt(i);
      cnt = 0;
    }
    cnt++;
  }
  res += cnt.toString() + ch;

  return res;
}