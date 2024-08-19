/**
 * solve HammingCodes: Encoded Binary to Integer
 * 
 * @param {string} data the contract data
 * @return {number|""} the contract answer
 */
export function hammingCodesEncodedBinaryToInteger(data: string): number|"" {
  const parityWholeExp = parseInt(data.charAt(0));
  let parityWholeCal = 0;
  let parityExp = [];
  let parityCal = [];
  for (let i = 1; i < data.length; i++) {
    const c = parseInt(data.charAt(i));
    parityWholeCal ^= c;
    if ((i & (i - 1)) == 0) {
      parityExp.push(c);
      parityCal.push(0);
    } else {
      for (let j = 0; j < parityCal.length; j++) {
        if (i & (1 << j)) {
          parityCal[j] ^= c;
        }
      }
    }
  }

  let parityErr = false;
  if (parityWholeCal != parityWholeExp) {
    parityErr = true;
  }
  
  let errPos = 0;
  for (let i = 0; i < parityExp.length; i++) {
    if (parityExp[i] != parityCal[i]) {
      errPos += (1 << i);
    }
  }

  if (errPos > 0) {
    if (parityErr) {
      data = data.substring(0, errPos) + (data.charAt(errPos) == '1' ? '0' : '1') + data.substring(errPos + 1);
    } else {
      return "";
    }
  }

  //let res = 0;
  let resStr = '';
  for (let i = 1; i < data.length; i++) {
    //const c = parseInt(data.charAt(i));
    if ((i & (i - 1)) != 0) {
      //res = (res << 1) + c;
      resStr += data.charAt(i);
    }
  }

  return parseInt(resStr, 2)
}

/**
 * solve HammingCodes: Integer to Encoded Binary
 * 
 * @param {number} data the contract data
 * @return {string} the contract answer
 */
export function hammingCodesIntegerToEncodedBinary(data: number): string {
  let binStr = "";
  while (data > 0) {
    binStr = ((data & 1) ? '1' : '0') + binStr;
    data = Math.floor(data / 2);
  }

  let parityCal = [];
  let d = 0;
  let i = 1;
  while (d < binStr.length) {
    if ((i & (i - 1)) == 0) {
      parityCal.push(0);
    } else {
      for (let j = 0; j < parityCal.length; j++) {
        if (i & (1 << j)) {
          parityCal[j] ^= (binStr.charAt(d) == '1' ? 1 : 0);
        }
      }
      d++;
    }
    i++;
  }

  let parityWholeCal = 0;
  let resStr = "";
  i = 1;
  d = 0;
  while (d < binStr.length) {
    let ch = '';
    if ((i & (i - 1)) == 0) {
      ch = (parityCal.shift() ? '1' : '0');
    } else {
      ch = binStr.charAt(d);
      d++;
    }
    parityWholeCal ^= (ch == '1' ? 1 : 0);
    resStr += ch;
    i++;
  }

  resStr = (parityWholeCal ? '1' : '0') + resStr;

  return resStr;
}