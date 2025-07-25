API_URL = "https://poetry-search.ru:8000"

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const poemId = urlParams.get('poem');
    
    if (poemId) {
        loadPoemById(poemId, true);
    } else {
        loadRandomPoem(true, true); // true for skipPush, true for replaceStateOnFirstLoad
    }

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    if (searchInput && searchBtn) {
        function handleSearch() {
            const query = searchInput.value.trim();
            if (query) {
                searchPoemsByText(query);
            }
        }
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Add random button logic
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', function() {
            loadRandomPoem();
        });
    }
});

function formatDate(dateFrom, dateTo) {
    if (!dateFrom) return '';
    
    const fromYear = Math.floor(parseFloat(dateFrom));
    const toYear = dateTo ? Math.floor(parseFloat(dateTo)) : null;
    
    if (toYear && fromYear !== toYear) {
        return `${fromYear}-${toYear}`;
    } else {
        return fromYear.toString();
    }
}

// Add replaceStateOnFirstLoad param
async function loadRandomPoem(skipPush, replaceStateOnFirstLoad) {
    try {
        const response = await fetch(API_URL + '/poems/random');
        if (!response.ok) {
            throw new Error('Failed to fetch random poem');
        }
        const poem = await response.json();
        displayPoem(poem);
        loadSimilarPoems(poem.id);
        if (replaceStateOnFirstLoad) {
            history.replaceState({}, '', '?poem=' + poem.id);
        } else if (!skipPush) {
            history.pushState({}, '', '?poem=' + poem.id);
        }
    } catch (error) {
        console.error('Error loading random poem:', error);
        document.getElementById('poem-title').textContent = 'Error loading poem';
    }
}

async function loadPoemById(poemId, skipPush) {
    try {
        const response = await fetch(API_URL + `/poems/${poemId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch poem with ID ${poemId}`);
        }
        const poem = await response.json();
        displayPoem(poem);
        loadSimilarPoems(poem.id);
        if (!skipPush) {
            history.pushState({}, '', '?poem=' + poem.id);
        }
    } catch (error) {
        console.error(`Error loading poem ${poemId}:`, error);
        document.getElementById('poem-title').textContent = 'Error loading poem';
    }
}

async function loadSimilarPoems(poemId) {
    const similarContainer = document.getElementById('similar-poems');
    similarContainer.innerHTML = '<div class="loading">Loading recommendations...</div>';
    
    try {
        const response = await fetch(API_URL + `/poems/similar/${poemId}`);
        if (response.status === 429) {
            similarContainer.innerHTML = '<div class="loading">Слишком частые запросы</div>';
            return;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch similar poems for ${poemId}`);
        }
        const similarPoems = await response.json();
        displaySimilarPoems(similarPoems);
    } catch (error) {
        console.error('Error loading similar poems:', error);
        similarContainer.innerHTML = '<div class="loading">Could not load recommendations</div>';
    }
}

async function searchPoemsByText(queryText) {
    try {
        const response = await fetch(`${API_URL}/poems/search?query_text=${encodeURIComponent(queryText)}&poems_num=1`);
        if (response.status === 429) {
            document.getElementById('poem-title').textContent = 'Слишком частые запросы';
            document.getElementById('poem-author').textContent = '';
            document.getElementById('poem-text').textContent = '';
            document.getElementById('poem-date').style.display = 'none';
            document.getElementById('similar-poems').innerHTML = '';
            return;
        }
        if (!response.ok) {
            throw new Error('Failed to search poems');
        }
        const poems = await response.json();
        if (poems && poems.length > 0) {
            displayPoem(poems[0]);
            loadSimilarPoems(poems[0].id);
            history.pushState({}, '', '?poem=' + poems[0].id);
        } else {
            document.getElementById('poem-title').textContent = 'Ничего не найдено';
            document.getElementById('poem-author').textContent = '';
            document.getElementById('poem-text').textContent = '';
            document.getElementById('poem-date').style.display = 'none';
            document.getElementById('similar-poems').innerHTML = '';
        }
    } catch (error) {
        console.error('Error searching poems:', error);
        document.getElementById('poem-title').textContent = 'Ошибка поиска';
    }
}

function displayPoem(poem) {
    document.getElementById('poem-title').textContent = poem.name || 'Без названия';
    document.getElementById('poem-author').textContent = `${poem.author}`;
    document.getElementById('poem-text').textContent = poem.text;
    
    const formattedDate = formatDate(poem.date_from, poem.date_to);
    const dateElement = document.getElementById('poem-date');
    if (formattedDate) {
        dateElement.textContent = formattedDate;
        dateElement.style.display = 'block';
    } else {
        dateElement.style.display = 'none';
    }
}

function displaySimilarPoems(poems) {
    const similarContainer = document.getElementById('similar-poems');
    similarContainer.innerHTML = '';
    
    if (poems.length === 0) {
        similarContainer.innerHTML = '<div class="loading">No similar poems found</div>';
        return;
    }
    
    const poemsToShow = poems.slice(0, 3);
    
    poemsToShow.forEach(poem => {
        const poemElement = document.createElement('div');
        poemElement.className = 'similar-poem';
        poemElement.addEventListener('click', (event) => {
            if (event.ctrlKey) {
                window.open(window.location.origin + '?poem=' + poem.id, '_blank');
            } else {
                loadPoemById(poem.id);
            }
        });
        
        const previewLines = poem.text.split('\r\n').slice(0, 3).join('\r\n');
        
        poemElement.innerHTML = `
            <h4>${poem.name || 'Без названия'}</h4>
            <p>${poem.author}</p>
            <div class="preview-text">${previewLines}</div>
        `;
        
        similarContainer.appendChild(poemElement);
    });
}

window.addEventListener('popstate', function(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const poemId = urlParams.get('poem');
    if (poemId) {
        loadPoemById(poemId, true);
    } else {
        loadRandomPoem(true);
    }
});
