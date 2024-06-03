document.addEventListener('DOMContentLoaded', () => {
    const filterIcon = document.querySelector('.filter-icon');
    const filterDialog = document.getElementById('filter-dialog');
    const filterCountElement = document.getElementById('filter-count');
    const searchInput = document.getElementById('search-input');
    const categoryInput = document.getElementById('category');
    const typeInput = document.getElementById('type');
    const quantityInput = document.getElementById('quantity');
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const applyFiltersButton = document.getElementById('apply-filters');
    const closeButton = document.querySelector('.close-button');
    const newsContainer = document.getElementById('news-container');

    let quantity = 10; // Inicializa a variável de quantidade
    let currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;

    // Abre o modal ao clicar no ícone de filtro
    filterIcon.addEventListener('click', () => {
        filterDialog.showModal();
    });

    // Fecha o modal ao clicar no botão de fechar
    closeButton.addEventListener('click', () => {
        filterDialog.close();
    });

    // Aplica os filtros ao carregar a página
    const urlParams = new URLSearchParams(window.location.search);
    let activeFiltersCount = 0;

    urlParams.forEach((value, key) => {
        if (key !== 'page' && key !== 'busca') {
            activeFiltersCount++;
        }
        if (key === 'busca') {
            searchInput.value = value;
        } else if (key === 'category') {
            categoryInput.value = value;
        } else if (key === 'type') {
            typeInput.value = value;
        } else if (key === 'quantity') {
            quantity = value; // Ajuste a variável quantity
        } else if (key === 'from') {
            fromInput.value = value;
        } else if (key === 'to') {
            toInput.value = value;
        }
    });

    // Exibe a contagem de filtros ativos
    if (activeFiltersCount > 0) {
        filterCountElement.textContent = activeFiltersCount;
    } else {
        filterCountElement.textContent = '';
    }

    // Função para buscar notícias da API do IBGE
    const fetchNews = async () => {
        let apiUrl = 'http://servicodados.ibge.gov.br/api/v3/noticias?';
        let params = new URLSearchParams();
    
        if (urlParams.has('busca')) {
            params.set('busca', urlParams.get('busca'));
        }
        if (urlParams.has('category')) {
            params.set('category', urlParams.get('category'));
        }
        if (urlParams.has('type')) {
            params.set('type', urlParams.get('type'));
        }
        if (urlParams.has('quantity')) {
            params.set('quantity', urlParams.get('quantity'));
            quantity = parseInt(urlParams.get('quantity')); // Ajuste a variável quantity
        } else {
            params.set('quantity', '10'); // Define o valor padrão para 10 notícias
            quantity = 10; // Ajuste a variável quantity
        }
        if (urlParams.has('from')) {
            params.set('from', urlParams.get('from'));
        }
        if (urlParams.has('to')) {
            params.set('to', urlParams.get('to'));
        }
    
        // Adiciona o parâmetro de página
        params.set('page', currentPage);
    
        apiUrl += params.toString();
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            //console.log(data)
            
            // Exibe as notícias na página
            newsWithNumbers = addNewsNumber(data.items)
            //console.log(newsWithNumbers);
            displayNews(newsWithNumbers);
            
            // Configura a paginação com o número total de páginas
            totalPages = Math.ceil(data.items.length / quantity);
            setupPagination(totalPages);
            console.log("total pages " + totalPages)
        } catch (error) {
            console.error('Erro ao buscar notícias:', error);
        }
    };

    // Função para adicionar o número da notícia a cada item
    const addNewsNumber = (items) => {
        let newsNumber = 1 
        return items.map(item => {
            item.news_number = newsNumber++;
            return item;
        });
    };
        

    // Função para calcular o tempo desde a publicação
    const calculateTimeSincePublished = (dateString) => {
        const parseDate = (dateString) => {
            const [datePart, timePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            return new Date(`${year}-${month}-${day}T${timePart}`);
        };
    
        const now = new Date();
        const publishedDate = parseDate(dateString);
    
        if (isNaN(publishedDate)) {
            return 'Data inválida';
        }
    
        const diffTime = now - publishedDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
        if (diffDays === 0) {
            return 'Publicado hoje';
        } else if (diffDays === 1) {
            return 'Publicado ontem';
        } else {
            return `Publicado há ${diffDays} dias`;
        }
    };

    // Função para exibir as notícias na página
    const displayNews = (news) => {
        // Limpa o contêiner de notícias e cria a lista de itens
        newsContainer.innerHTML = '<ul></ul>';
        const ulElement = newsContainer.querySelector('ul');
    
        // Filtra as notícias para a página atual com base no news_number
        const start = (currentPage - 1) * quantity + 1;
        const end = currentPage * quantity;
    
        const newsToDisplay = news.filter(item => item.news_number >= start && item.news_number <= end);
    
        // Exibe as notícias filtradas
        newsToDisplay.forEach(item => {
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
                <p>Editorias: ${item.editorias}</p>
                <p>${calculateTimeSincePublished(item.data_publicacao)}</p>
                <a href="${item.link}" target="_blank" class="read-more-button">Leia Mais</a>
            `;
    
            ulElement.appendChild(liElement);
        });
    
        // Adiciona a seção de paginação
        const paginationContainer = document.createElement('ul');
        paginationContainer.id = 'pagination';
        newsContainer.appendChild(paginationContainer);
    };
    


    // Função para configurar a paginação
    const setupPagination = (totalPages) => {
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
            if (endPage > totalPages) {
                endPage = totalPages;
            }
        }
    
        // Adiciona botão de "Anterior" se não estiver na primeira página
        if (currentPage > 1) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = 'Anterior';
            button.addEventListener('click', () => {
                currentPage--;
                // updateUrlAndFetchNews();
                displayNews(newsWithNumbers);
                setupPagination(totalPages);
            });
            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }
    
        for (let page = startPage; page <= endPage; page++) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = page;
            if (page === currentPage) {
                button.classList.add('selected');
            }
            button.addEventListener('click', () => {
                currentPage = page;
                // updateUrlAndFetchNews();
                displayNews(newsWithNumbers);
                setupPagination(totalPages);
            });
            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }
    
        // Adiciona botão de "Próximo" se não estiver na última página
        if (currentPage < totalPages) {
            const liElement = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = 'Próximo';
            button.addEventListener('click', () => {
                currentPage++;
                // updateUrlAndFetchNews();
                displayNews(newsWithNumbers);
                setupPagination(totalPages);
            });
            liElement.appendChild(button);
            paginationContainer.appendChild(liElement);
        }
    };
    
    // Aplica os filtros e atualiza a URL
    applyFiltersButton.addEventListener('click', () => {
        const newUrlParams = new URLSearchParams(window.location.search);

        if (categoryInput.value) {
            newUrlParams.set('category', categoryInput.value);
        } else {
            newUrlParams.delete('category');
        }

        if (typeInput.value) {
            newUrlParams.set('type', typeInput.value);
        } else {
            newUrlParams.delete('type');
        }

        if (quantityInput.value) {
            newUrlParams.set('quantity', quantityInput.value);
            quantity = quantityInput.value; // Atualiza a variável quantity
        } else {
            newUrlParams.delete('quantity');
            quantity = 10; // Define o valor padrão se não estiver especificado
        }

        if (fromInput.value) {
            newUrlParams.set('from', fromInput.value);
        } else {
            newUrlParams.delete('from');
        }

        if (toInput.value) {
            newUrlParams.set('to', toInput.value);
        } else {
            newUrlParams.delete('to');
        }

        // Redefine para a primeira página ao aplicar filtros
        newUrlParams.set('page', 1);
        currentPage = 1;

        window.history.pushState({}, '', `?${newUrlParams.toString()}`);
        filterDialog.close();
        displayNews(newsWithNumbers);
        totalPages = Math.ceil(newsWithNumbers.length / quantity);
        setupPagination(totalPages);
    });

    // Chama a função para buscar as notícias ao carregar a página
    fetchNews();
});
