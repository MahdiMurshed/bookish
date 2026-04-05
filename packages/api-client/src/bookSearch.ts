/**
 * Book search using Google Books API
 */

export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  imageUrl?: string;
  isbn?: string;
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const apiKey =
      typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY : undefined;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedQuery}&maxResults=10&printType=books${keyParam}`,
    );

    if (!response.ok) {
      throw new Error('Failed to search books');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: Record<string, unknown>) => {
      const volumeInfo = item.volumeInfo as Record<string, unknown>;
      const imageLinks = (volumeInfo.imageLinks as Record<string, string>) || {};
      const identifiers = volumeInfo.industryIdentifiers as
        | Array<{ identifier: string }>
        | undefined;

      return {
        id: item.id as string,
        title: (volumeInfo.title as string) || '',
        authors: (volumeInfo.authors as string[]) || [],
        description: (volumeInfo.description as string) || undefined,
        categories: (volumeInfo.categories as string[]) || [],
        imageUrl:
          (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace(
            'http://',
            'https://',
          ) || undefined,
        isbn: identifiers?.[0]?.identifier || undefined,
      };
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Book search failed');
  }
}

export function mapCategoryToGenre(categories: string[]): string | undefined {
  if (!categories || categories.length === 0) return undefined;

  const category = categories[0]!.toLowerCase();
  const genreMap: Record<string, string> = {
    fiction: 'Fiction',
    'science fiction': 'Science Fiction',
    fantasy: 'Fantasy',
    mystery: 'Mystery',
    thriller: 'Thriller',
    romance: 'Romance',
    biography: 'Biography',
    autobiography: 'Biography',
    history: 'History',
    'non-fiction': 'Non-Fiction',
    'self-help': 'Self-Help',
    poetry: 'Poetry',
    horror: 'Horror',
    philosophy: 'Philosophy',
    science: 'Science',
    technology: 'Technology',
    business: 'Business',
    education: 'Education',
    cooking: 'Cooking',
    travel: 'Travel',
    art: 'Art',
    comics: 'Comics',
  };

  for (const [key, value] of Object.entries(genreMap)) {
    if (category.includes(key)) {
      return value;
    }
  }

  return 'Other';
}
