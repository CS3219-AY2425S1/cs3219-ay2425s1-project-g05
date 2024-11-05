/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert separate array of categories and categoriesIds 
 */
export function convertToCombinedCategoryId(categories: string[], categoriesId: number[]): { category: string, id: number }[] {
  const output = []
  for (let i = 0; i < categories.length; i++) {
    output.push({
      category: categories[i],
      id: categoriesId[i]
    })
  }

  return output;
}

/**
 * Convert a Date object into 12-hour time
 * 
 * @param date The date (in Date object)
 * @returns 
 */
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}
