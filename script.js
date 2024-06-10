document.addEventListener('DOMContentLoaded', () => {
    const lupaIcon = document.getElementById('lupa');
    const searchForm = document.querySelector('.search-form');
    const filterIcon = document.querySelector('.filter-icon');
    const filterDialog = document.getElementById('filter-dialog');
    const filterCountElement = document.getElementById('filter-count');
    const searchInput = document.getElementById('search-input');
    const categoryInput = document.getElementById('category');
    const tipoInput = document.getElementById('tipo');
    const qtdInput = document.getElementById('qtd');
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const applyFiltersButton = document.getElementById('apply-filters');
    const closeButton = document.querySelector('.close-button');
    const newsContainer = document.getElementById('news-container');

    let quantity = 10; // Inicializa a variável de quantidade
    let currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    let totalPage = 0;

    filterIcon.addEventListener('click', () => {
        filterDialog.showModal();
    });

    closeButton.addEventListener('click', () => {
        filterDialog.close();
    });

    // Função para aplicar a busca
    const applySearch = () => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchInput.value) {
            searchParams.set('busca', searchInput.value);
        } else {
            searchParams.delete('busca');
        }
        searchParams.set('page', 1);
        currentPage = 1;
        window.history.pushState({}, '', `?${searchParams.toString()}`);
        fetchAndDisplayNews();
    };

    // Impede o comportamento padrão do formulário de busca
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        applySearch();
    });

    // Evento para clicar no ícone de lupa
    lupaIcon.addEventListener('click', (event) => {
        event.preventDefault();
        applySearch();
    });

    // Evento para pressionar "Enter" na busca
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applySearch();
        }
    });

    const applyUrlParamsToInputs = () => {
        const urlParams = new URLSearchParams(window.location.search);
    
        const updateFilterCount = () => {
            let count = 0;
            if (searchInput.value) count++;
            if (tipoInput.value && tipoInput.value != "null") count++;
            if (qtdInput.value) count++;
            if (fromInput.value) count++;
            if (toInput.value) count++;
            filterCountElement.textContent = count;
        };
    
        urlParams.forEach((value, key) => {
            if (key === 'busca') {
                searchInput.value = value;
            } else if (key === 'tipo') {
                tipoInput.value = value;
            } else if (key === 'qtd') {
                qtdInput.value = value;
                quantity = parseInt(value); 
            } else if (key === 'de') {
                fromInput.value = value;
            } else if (key === 'ate') {
                toInput.value = value;
            }
        });
    
        updateFilterCount();
    
        searchInput.addEventListener('input', updateFilterCount);
        tipoInput.addEventListener('change', updateFilterCount);
        qtdInput.addEventListener('input', updateFilterCount);
        fromInput.addEventListener('input', updateFilterCount);
        toInput.addEventListener('input', updateFilterCount);
    };

    const fetchNews = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let apiUrl = 'https://servicodados.ibge.gov.br/api/v3/noticias?'; // Alterado para HTTPS
        let params = new URLSearchParams();
    
        if (urlParams.has('busca')) {
            params.set('busca', urlParams.get('busca'));
        }
        if (urlParams.has('category')) {
            params.set('category', urlParams.get('category'));
        }
        if (urlParams.has('tipo')) {
            params.set('tipo', urlParams.get('tipo'));
        }
        if (urlParams.has('qtd')) {
            params.set('qtd', urlParams.get('qtd'));
            quantity = parseInt(urlParams.get('qtd')); // Ajuste a variável quantity
        } else {
            params.set('qtd', '10'); // Define o valor padrão para 10 notícias
            quantity = 10; // Ajuste a variável quantity
        }
        if (urlParams.has('de')) {
            params.set('de', urlParams.get('de'));
        }
        if (urlParams.has('ate')) {
            params.set('ate', urlParams.get('ate'));
        }
    
        params.set('page', currentPage);
        apiUrl += params.toString();
        console.log(apiUrl)
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            totalPage = data.totalPages;
            return data.items;
        } catch (error) {
            console.error('Erro ao buscar notícias:', error);
            return [];
        }
    };

    const calculateTimeSincePublished = (dateString) => {
        const parseDate = (dateString) => {
            const [datePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            return new Date(year, month - 1, day);
        };
    
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const publishedDate = parseDate(dateString);
    
        if (isNaN(publishedDate)) {
            return 'Data inválida';
        }
    
        const diffTime = today - publishedDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
        if (diffDays === 0) {
            return 'Publicado hoje';
        } else if (diffDays === 1) {
            return 'Publicado ontem';
        } else {
            return `Publicado há ${diffDays} dias`;
        }
    };
    
    const displayNews = (news) => {
        newsContainer.innerHTML = '<ul></ul>';
        const ulElement = newsContainer.querySelector('ul');

        news.forEach(item => {
            const liElement = document.createElement('li');
            liElement.className = 'news-item';

            let imageUrl = '';
            if (item.imagens) {
                try {
                    const imagensObj = JSON.parse(item.imagens);
                    imageUrl = `https://agenciadenoticias.ibge.gov.br/${imagensObj.image_fulltext}`;
                } catch (error) {
                    console.error('Erro ao parsear JSON:', error);
                }
            }

            liElement.innerHTML = `
                <img src="${imageUrl}" alt="${item.titulo}">
                <h2>${item.titulo}</h2>
                <p>${item.introducao}</p>
                <p>Editorias: #${item.editorias}</p>
                <p>${calculateTimeSincePublished(item.data_publicacao)}</p>
                <a href="${item.link}" target="_blank" class="read-more-button">Leia Mais</a>
            `;

            ulElement.appendChild(liElement);
        });

        const paginationContainer = document.createElement('ul');
        paginationContainer.id = 'pagination';
        newsContainer.appendChild(paginationContainer);
    };

    const setupPagination = (totalPage) => {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = ''; // Limpa a paginação existente

        const maxVisibleButtons = 10;

        let startPage = 1;
        let endPage = 10;
        let lossPage = 0;

        if (currentPage == 1) {
            startPage = 1;
            endPage = 10;
        } else {
            startPage = currentPage - maxVisibleButtons / 2;
            if (startPage < 1) {
                lossPage = startPage * (-1);
                startPage = 1;
            }
            endPage = currentPage + maxVisibleButtons / 2 - 1 + lossPage;
            if(startPage == 1){
                endPage = 10;
            }
            if (endPage > totalPage) {
                endPage = totalPage;
            }
        }

        if (currentPage > 1) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = '<<';
            button.onclick = () => changePage(currentPage - 1);
            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }

        for (let page = startPage; page <= endPage; page++) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = page;
            button.onclick = () => changePage(page);

            if (page === currentPage) {
                button.classList.add('selected');
            }

            if (page === currentPage) {
                button.disabled = true;
            }

            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }

        if (currentPage < totalPage) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = '>>';
            button.onclick = () => changePage(currentPage + 1);
            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }
    };

    const changePage = (page) => {
        currentPage = page;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', page);
        window.history.pushState({}, '', `?${searchParams.toString()}`);
        fetchAndDisplayNews();
    };

    const fetchAndDisplayNews = async () => {
        const news = await fetchNews();
        displayNews(news);
        setupPagination(totalPage);
    };

    applyFiltersButton.addEventListener('click', () => {
        const searchParams = new URLSearchParams(window.location.search);

        if (tipoInput.value) {
            searchParams.set('tipo', tipoInput.value);
        } else {
            searchParams.delete('tipo');
        }
        if (qtdInput.value) {
            searchParams.set('qtd', qtdInput.value);
        } else {
            searchParams.delete('qtd');
        }
        if (fromInput.value) {
            searchParams.set('de', fromInput.value);
        } else {
            searchParams.delete('de');
        }
        if (toInput.value) {
            searchParams.set('ate', toInput.value);
        } else {
            searchParams.delete('ate');
        }

        currentPage = 1;
        searchParams.set('page', currentPage);

        window.history.pushState({}, '', `?${searchParams.toString()}`);
        filterDialog.close();
        fetchAndDisplayNews();
    });

    applyUrlParamsToInputs();
    fetchAndDisplayNews();
});
