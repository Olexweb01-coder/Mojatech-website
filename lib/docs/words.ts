/* Amounts written out, as Nigerian quotations and receipts expect:
 * 2,140,000.50 → "Two million, one hundred and forty thousand naira and fifty kobo only". */

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

function hundreds(n: number) {
  const h = Math.floor(n / 100), r = n % 100;
  const rest = r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? "-" + ONES[r % 10] : "");
  return [h ? `${ONES[h]} hundred` : "", h && r ? "and" : "", rest].filter(Boolean).join(" ");
}

function whole(n: number) {
  if (n === 0) return "zero";
  const groups: string[] = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) {
    const g = n % 1000;
    if (g) groups.unshift(`${i === 0 && n >= 1000 && g < 100 ? "and " : ""}${hundreds(g)}${SCALES[i] ? " " + SCALES[i] : ""}`);
  }
  return groups.join(", ").replace(", and", " and");
}

export function inWords(amount: number) {
  const naira = Math.floor(amount), kobo = Math.round((amount - naira) * 100);
  const s = `${whole(naira)} naira${kobo ? ` and ${whole(kobo)} kobo` : ""} only`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
