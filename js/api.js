const API_URL = '/api';

export async function fetchRandomPoem() {
    const response = await fetch(API_URL + '/poems/random');
    if (!response.ok) {
        throw new Error('Failed to fetch random poem');
    }
    return response.json();
}

export async function fetchPoemById(poemId) {
    const response = await fetch(API_URL + `/poems/${poemId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch poem with ID ${poemId}`);
    }
    return response.json();
}

export async function fetchSimilarPoems(poemId) {
    const response = await fetch(API_URL + `/poems/similar/${poemId}`);
    if (response.status === 429) {
        return { rateLimited: true };
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch similar poems for ${poemId}`);
    }
    return { poems: await response.json() };
}

export async function searchPoems(queryText) {
    const response = await fetch(
        `${API_URL}/poems/search?query_text=${encodeURIComponent(queryText)}&poems_num=1`
    );
    if (response.status === 429) {
        return { rateLimited: true };
    }
    if (!response.ok) {
        throw new Error('Failed to search poems');
    }
    return { poems: await response.json() };
}
