API_URL = "http://84.201.178.218:8000"

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const poemId = urlParams.get('poem');
    
    if (poemId) {
        loadPoemById(poemId);
    } else {
        loadRandomPoem();
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

async function loadRandomPoem() {
    try {
        const response = await fetch(API_URL + '/poems/random');
        if (!response.ok) {
            throw new Error('Failed to fetch random poem');
        }
        const poem = await response.json();
        displayPoem(poem);
        loadSimilarPoems(poem.id);
    } catch (error) {
        console.error('Error loading random poem:', error);
        document.getElementById('poem-title').textContent = 'Error loading poem';
    }
}

async function loadPoemById(poemId) {
    try {
        const response = await fetch(API_URL + `/poems/${poemId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch poem with ID ${poemId}`);
        }
        const poem = await response.json();
        displayPoem(poem);
        loadSimilarPoems(poem.id);
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
                window.open(window.location.href + '?poem=' + poem.id, '_blank');
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
    if (event.state && event.state.poemId) {
        loadPoemById(event.state.poemId);
    } else {
        loadRandomPoem();
    }
});
