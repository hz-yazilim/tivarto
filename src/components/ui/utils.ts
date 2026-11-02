/** İstemci bileşenlerinde className birleştirmek için. */
export function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
