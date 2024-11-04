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