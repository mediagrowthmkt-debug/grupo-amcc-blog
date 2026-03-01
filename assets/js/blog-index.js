// ========================================
// BLOG INDEX - AMCC
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize blog
    initBlog();
});

// ========================================
// SECURITY UTILITIES
// ========================================

function escapeHtmlAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Sanitiza URLs para prevenir javascript: e data: protocols maliciosos
function sanitizeUrl(url) {
    if (!url) return '';
    const str = String(url).trim();
    // Permite apenas URLs relativas ou http/https
    if (str.startsWith('/') || str.startsWith('./') || str.startsWith('../') || 
        str.startsWith('http://') || str.startsWith('https://')) {
        return escapeHtmlAttr(str);
    }
    // URLs que não começam com protocolo são tratadas como relativas
    if (!str.includes(':')) {
        return escapeHtmlAttr(str);
    }
    // Bloqueia protocols perigosos (javascript:, data:, vbscript:, etc)
    return '';
}

// ========================================
// BLOG INITIALIZATION
// ========================================

let allPosts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

async function initBlog() {
    try {
        // Load posts from posts folder
        await loadPosts();
        
        // Setup search
        setupSearch();
        
        // Setup category filter
        setupCategoryFilter();
        
        // Render posts
        renderPosts();
    } catch (error) {
        console.error('Erro ao inicializar blog:', error);
        showEmptyState();
    }
}

// ========================================
// LOAD POSTS
// ========================================

async function loadPosts() {
    try {
        // Detectar se está rodando localmente ou no GitHub Pages
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:';
        
        console.log('🌍 Ambiente:', isLocal ? 'LOCAL' : 'GITHUB PAGES');
        
        let htmlFiles = [];
        
        if (isLocal) {
            // Modo LOCAL - Lista manual de posts
            htmlFiles = [
                { name: 'marble-or-granite-guide-for-your-home-in-worcester.html' },
                { name: 'window-replacement-massachusetts-guide.html' }
            ];
            console.log('📁 Posts locais:', htmlFiles.length);
        } else {
            // Modo GITHUB PAGES - Busca via API
            const response = await fetch('https://api.github.com/repos/mediagrowthmkt-debug/grupo-amcc-blog/contents/posts');
            
            if (!response.ok) {
                throw new Error('Erro ao buscar posts da API');
            }
            
            const files = await response.json();
            console.log('📁 Arquivos da API:', files.length);
            
            // Filtrar apenas arquivos HTML (excluir README.md e index.html)
            htmlFiles = files.filter(file => 
                file.name.endsWith('.html') && 
                file.name !== 'index.html' &&
                file.type === 'file'
            ).map(file => ({ name: file.name }));
            
            console.log('✅ Posts encontrados:', htmlFiles.length);
        }
        
        // Carregar metadados de cada post
        const postPromises = htmlFiles.map(file => 
            loadPostMetadata(`posts/${file.name}`)
        );
        
        allPosts = await Promise.all(postPromises);
        allPosts = allPosts.filter(post => post !== null);
        
        // Sort by date (newest first)
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('📚 Total de posts carregados:', allPosts.length);
        
    } catch (error) {
        console.error('❌ Erro ao carregar posts:', error);
        // Fallback: use example post
        allPosts = getExamplePosts();
    }
}

async function loadPostMetadata(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract metadata from post - sanitizar na origem
        const rawTitle = doc.querySelector('h1')?.textContent || doc.querySelector('title')?.textContent || 'Post sem título';
        const rawDescription = doc.querySelector('meta[name="description"]')?.content || 
                          doc.querySelector('p')?.textContent?.substring(0, 150) || '';
        const rawImage = doc.querySelector('meta[property="og:image"]')?.content || 
                     doc.querySelector('img')?.src || '';
        const rawCategory = doc.querySelector('meta[name="category"]')?.content || 'Geral';
        const rawAuthor = doc.querySelector('meta[name="author"]')?.content || 'AMCC';
        const dateStr = doc.querySelector('meta[name="publish-date"]')?.content || 
                       doc.querySelector('time')?.getAttribute('datetime') || 
                       new Date().toISOString();
        
        // Sanitiza todos os dados da fonte remota
        return {
            title: sanitizeTextContent(rawTitle.trim()),
            excerpt: sanitizeTextContent(rawDescription.trim()),
            image: sanitizeUrl(rawImage) || '../assets/images/logo-amcc.webp',
            category: sanitizeTextContent(rawCategory.trim()),
            author: sanitizeTextContent(rawAuthor.trim()),
            date: sanitizeTextContent(dateStr),
            url: sanitizeUrl(url) || '#'
        };
    } catch (error) {
        console.error('Erro ao carregar post:', url, error);
        return null;
    }
}

// Sanitiza conteúdo de texto para prevenir XSS em textContent
function sanitizeTextContent(str) {
    if (!str) return '';
    // Remove qualquer tag HTML que possa estar no texto
    return String(str).replace(/<[^>]*>/g, '').trim();
}

function getExamplePosts() {
    // Example posts for testing
    return [
        {
            title: 'Como Acelerar o Crescimento da Sua Empresa com Growth Marketing',
            excerpt: 'Descubra as estratégias de growth marketing que estão transformando empresas e acelerando resultados de forma exponencial.',
            image: '../assets/images/logo-mediagrowth.webp',
            category: 'Growth',
            author: 'MediaGrowth',
            date: '2026-02-15',
            url: 'posts/marble-or-granite-guide-for-your-home-in-worcester.html'
        },
        {
            title: 'SEO em 2026: Estratégias Essenciais para Ranquear no Google',
            excerpt: 'As melhores práticas de SEO atualizadas para garantir visibilidade orgânica e conquistar as primeiras posições.',
            image: '../assets/images/logo-mediagrowth.webp',
            category: 'SEO',
            author: 'MediaGrowth',
            date: '2026-02-10',
            url: 'posts/marble-or-granite-guide-for-your-home-in-worcester.html'
        },
        {
            title: 'Automação de Marketing: Como Escalar Sem Perder Qualidade',
            excerpt: 'Aprenda a implementar automações inteligentes que economizam tempo e aumentam a conversão dos seus leads.',
            image: '../assets/images/logo-mediagrowth.webp',
            category: 'Automação',
            author: 'MediaGrowth',
            date: '2026-02-05',
            url: 'posts/marble-or-granite-guide-for-your-home-in-worcester.html'
        }
    ];
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value.toLowerCase();
            renderPosts();
        }, 300);
    });
}

// ========================================
// CATEGORY FILTER
// ========================================

function setupCategoryFilter() {
    // Get unique categories
    const categories = ['all', ...new Set(allPosts.map(post => post.category))];
    
    // Create category buttons using DOM API (mais seguro)
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn' + (cat === 'all' ? ' active' : '');
        btn.dataset.category = cat;
        btn.textContent = cat === 'all' ? 'Todos' : cat;
        
        btn.addEventListener('click', function() {
            // Update active button
            categoryFilter.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category and render
            currentCategory = this.dataset.category;
            renderPosts();
        });
        
        categoryFilter.appendChild(btn);
    });
}

// ========================================
// RENDER POSTS
// ========================================

function renderPosts() {
    const postsGrid = document.getElementById('postsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Filter posts
    let filteredPosts = allPosts;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
    }
    
    // Filter by search term
    if (currentSearchTerm) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(currentSearchTerm) ||
            post.excerpt.toLowerCase().includes(currentSearchTerm) ||
            post.category.toLowerCase().includes(currentSearchTerm)
        );
    }
    
    // Show empty state if no posts
    if (filteredPosts.length === 0) {
        postsGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Render posts usando DOM API para segurança
    postsGrid.innerHTML = '';
    filteredPosts.forEach(post => {
        postsGrid.appendChild(createPostCardElement(post));
    });
}

// Cria elemento de card usando DOM API (mais seguro que innerHTML)
function createPostCardElement(post) {
    const date = formatDate(post.date);
    
    // Cria elementos usando DOM API para prevenir XSS
    const card = document.createElement('a');
    card.href = sanitizeUrl(post.url) || '#';
    card.className = 'post-card';
    
    const img = document.createElement('img');
    img.src = sanitizeUrl(post.image) || '../assets/images/logo-amcc.webp';
    img.alt = post.title || '';
    img.className = 'post-image';
    img.loading = 'lazy';
    img.onerror = function() { this.src = '../assets/images/logo-amcc.webp'; };
    
    const content = document.createElement('div');
    content.className = 'post-content';
    
    const category = document.createElement('span');
    category.className = 'post-category';
    category.textContent = post.category || 'Geral';
    
    const title = document.createElement('h2');
    title.className = 'post-title';
    title.textContent = post.title || '';
    
    const excerpt = document.createElement('p');
    excerpt.className = 'post-excerpt';
    excerpt.textContent = post.excerpt || '';
    
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'post-author';
    authorSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const authorText = document.createTextNode(' ' + (post.author || 'AMCC'));
    authorSpan.appendChild(authorText);
    
    const dateSpan = document.createElement('span');
    dateSpan.className = 'post-date';
    dateSpan.textContent = date;
    
    // Monta a estrutura
    meta.appendChild(authorSpan);
    meta.appendChild(dateSpan);
    content.appendChild(category);
    content.appendChild(title);
    content.appendChild(excerpt);
    content.appendChild(meta);
    card.appendChild(img);
    card.appendChild(content);
    
    return card;
}

// Função legada mantida para compatibilidade
function createPostCard(post) {
    const date = formatDate(post.date);
    
    return `
        <a href="${sanitizeUrl(post.url)}" class="post-card">
            <img src="${sanitizeUrl(post.image)}" alt="${escapeHtmlAttr(post.title)}" class="post-image" loading="lazy" onerror="this.src='../assets/images/logo-amcc.webp'">
            <div class="post-content">
                <span class="post-category">${escapeHtmlAttr(post.category)}</span>
                <h2 class="post-title">${escapeHtmlAttr(post.title)}</h2>
                <p class="post-excerpt">${escapeHtmlAttr(post.excerpt)}</p>
                <div class="post-meta">
                    <span class="post-author">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${escapeHtmlAttr(post.author)}
                    </span>
                    <span class="post-date">${escapeHtmlAttr(date)}</span>
                </div>
            </div>
        </a>
    `;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
}

function showEmptyState() {
    const postsGrid = document.getElementById('postsGrid');
    const emptyState = document.getElementById('emptyState');
    
    postsGrid.innerHTML = '';
    emptyState.style.display = 'block';
}

// ========================================
// SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
