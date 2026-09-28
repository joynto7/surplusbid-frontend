/** Helpers for <input type="datetime-local"> values ("YYYY-MM-DDTHH:mm", local time). */

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localInputToIso(value: string) {
  return new Date(value).toISOString();
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3_600_000);
}

/** Rounds up to the next quarter hour so default times look intentional. */
export function nextQuarterHour(date = new Date()) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return d;
}
