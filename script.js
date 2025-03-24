// Configuration des endpoints API
const apiConfig = {
    characters: {
      url: "characters/fr",
      search: (query) => `https://api.api-onepiece.com/v2/characters/fr/search?name=${encodeURIComponent(query)}`
    },
    crews: {
      url: "crews/fr",
      search: (query) => `https://api.api-onepiece.com/v2/crews/fr/search?name=${encodeURIComponent(query)}`
    },
    ships: {
      url: "boats/fr",
      search: (query) => `https://api.api-onepiece.com/v2/boats/fr/search?name=${encodeURIComponent(query)}`
    },
    locations: {
      url: "locates/fr",
      search: (query) => `https://api.api-onepiece.com/v2/locates/fr/search?name=${encodeURIComponent(query)}`
    }
  };
  
  // Placeholders pour la barre de recherche
  const placeholders = {
    characters: "Entrez un nom de personnage (ex: Luffy)",
    crews: "Entrez un nom d'équipage (ex: Straw Hat)",
    ships: "Entrez un nom de bateau (ex: Thousand Sunny)", 
    locations: "Entrez un nom de lieu (ex: Marineford)"
  };
  
  // Mettre à jour le placeholder
  function updateSearchPlaceholder() {
    const category = document.getElementById('category').value;
    document.getElementById('research_bar').placeholder = placeholders[category] || "Entrez votre recherche";
  }
  
  // Fonction principale de recherche
  async function api_request() {
    const category = document.getElementById('category').value;
    const query = document.getElementById('research_bar').value.trim();
    
    if (!query) {
      alert("Veuillez entrer un terme de recherche");
      return;
    }
  
    const blocResultats = document.getElementById('bloc-resultats');
    const gifAttente = document.getElementById('bloc-gif-attente');
    
    blocResultats.innerHTML = '';
    gifAttente.style.display = 'block';
  
    try {
      const results = await fetchData(category, query);
      gifAttente.style.display = 'none';
  
      if (results.length > 0) {
        displayResults(results, category);
      } else {
        blocResultats.innerHTML = '<p class="info-vide">(Aucun résultat trouvé)</p>';
      }
    } catch (error) {
      gifAttente.style.display = 'none';
      blocResultats.innerHTML = '<p class="info-vide">(Erreur lors de la recherche)</p>';
      console.error("Erreur API:", error);
    }
  }
  
  // Fonction pour récupérer les données avec nettoyage
  async function fetchData(category, query) {
    const config = apiConfig[category];
    if (!config) throw new Error("Catégorie inconnue");
  
    try {
      const response = await fetch(config.search(query));
      if (!response.ok) throw new Error("Erreur API");
  
      const data = await response.json();
      const normalizedData = normalizeAPIData(data);
      
      // Nettoyer les données avant de les retourner
      return normalizedData.map(item => {
        // S'assurer que le nom est une string valide
        if (item.name && typeof item.name !== 'string') {
          item.name = String(item.name).replace('[object Object]', '').trim() || 'Sans nom';
        }
        return item;
      }).filter(item => item.name && item.name !== 'Sans nom');
    } catch (error) {
      console.error(`Erreur API ${category}:`, error);
      throw error;
    }
  }
  
  // Normaliser les données de l'API
  function normalizeAPIData(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.id) return [data];
    return [];
  }
  
  // Afficher les résultats filtrés
  function displayResults(results, category) {
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
    
    // Filtrer les résultats invalides
    const validResults = results.filter(item => {
      return item && item.name && item.name !== '[object Object]' && item.name !== 'Sans nom';
    });
  
    if (validResults.length === 0) {
      blocResultats.innerHTML = '<p class="info-vide">(Aucun résultat valide trouvé)</p>';
      return;
    }
  
    validResults.forEach(item => {
      let displayText = item.name;
      const itemId = item.id;
  
      // Ajouter des informations supplémentaires selon la catégorie
      switch(category) {
        case 'ships':
          if (item.crew_name && typeof item.crew_name === 'string') {
            displayText += ` (${item.crew_name})`;
          } else if (item.crew && typeof item.crew === 'string') {
            displayText += ` (${item.crew})`;
          }
          break;
        case 'locations':
          if (item.region && typeof item.region === 'string') {
            displayText += ` (${item.region})`;
          }
          break;
        case 'crews':
          if (item.main_ship && typeof item.main_ship === 'string') {
            displayText += ` (${item.main_ship})`;
          }
          break;
      }
  
      blocResultats.innerHTML += 
        `<p class="res" onclick="redirectToDetails('${category}', ${itemId})">${displayText}</p>`;
    });
  
    saveLastResults(category, validResults);
  }
  
  // Sauvegarder les derniers résultats
  function saveLastResults(category, results) {
    sessionStorage.setItem('lastSearchResults', JSON.stringify({
      category,
      results
    }));
  }
  
  // Redirection vers la page de détails
  function redirectToDetails(category, id) {
    window.location.href = `details.html?category=${category}&id=${id}`;
  }
  
  // Fonction pour afficher les détails complets
  async function displayFullDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const id = urlParams.get('id');
  
    if (!category || !id) {
      document.getElementById('characterDetails').innerHTML = '<p>Paramètres manquants</p>';
      return;
    }
  
    try {
      let details;
      const endpoint = apiConfig[category];
      
      // Utilisation du nouvel endpoint 'single' pour les requêtes par ID
      const apiUrl = endpoint.single ? endpoint.single(id) : `https://api.api-onepiece.com/v2/${endpoint.url}/${id}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        // Tentative de fallback pour les épées si la première requête échoue
        if (category === 'swords') {
          const fallbackResponse = await fetch(`https://api.api-onepiece.com/v2/swords/en/${id}`);
          if (!fallbackResponse.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          details = await fallbackResponse.json();
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      } else {
        details = await response.json();
      }
  
      if (!details) throw new Error("Détails non trouvés");
  
      // Debug: Afficher les données reçues dans la console
      console.log(`Détails ${category}:`, details);
  
      const detailsContainer = document.getElementById('characterDetails');
      detailsContainer.innerHTML = generateDetailsHTML(category, details);
  
    } catch (error) {
      console.error("Erreur:", error);
      document.getElementById('characterDetails').innerHTML = `
        <div class="error-message">
          <p>Erreur lors du chargement des détails</p>
          <p class="error-detail">${error.message}</p>
          ${category === 'swords' ? '<p>Essayez de rechercher à nouveau cette épée</p>' : ''}
        </div>
      `;
    }
  }
  
  // Génère le HTML des détails selon la catégorie
  function generateDetailsHTML(category, data) {
    // Helper pour gérer les données imbriquées et les valeurs nulles
    const getValue = (obj, path, fallback = 'Inconnu') => {
      const keys = path.split('.');
      let result = obj;
      for (const key of keys) {
        if (result && result[key] !== undefined && result[key] !== null && result[key] !== "") {
          result = result[key];
        } else {
          return fallback;
        }
      }
      return result;
    };
  
    switch(category) {
      case 'characters':
        return `
          <h2>${data.name}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Métier:</span>
              <span class="detail-value">${getValue(data, 'job')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Taille:</span>
              <span class="detail-value">${getValue(data, 'size')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Âge:</span>
              <span class="detail-value">${getValue(data, 'age')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Prime:</span>
              <span class="detail-value">${data.bounty ? `${data.bounty} Berries` : 'Inconnu'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut:</span>
              <span class="detail-value">${getValue(data, 'status')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Équipage:</span>
              <span class="detail-value">${getValue(data.crew, 'name')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fruit du démon:</span>
              <span class="detail-value">${getValue(data.fruit, 'name', 'Aucun')}</span>
            </div>
            ${data.fruit?.description ? `
            <div class="detail-item full-width">
              <span class="detail-label">Description du fruit:</span>
              <span class="detail-value">${data.fruit.description}</span>
            </div>` : ''}
          </div>
        `;
  
      case 'ships':
        return `
          <h2>${getValue(data, 'name')}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${getValue(data, 'type')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Équipage:</span>
              <span class="detail-value">${getValue(data.crew, 'name')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Capitaine:</span>
              <span class="detail-value">${getValue(data.character_captain, 'name')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Prime équipage:</span>
              <span class="detail-value">${getValue(data.crew, 'total_prime', '0')} Berries</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Nombre de membres:</span>
              <span class="detail-value">${getValue(data.crew, 'number')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Bateau d'un Yonko:</span>
              <span class="detail-value">${data.crew.is_yonko ? 'Oui' : 'Non'}</span>
            </div>
            ${data.description ? `
            <div class="detail-item full-width">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${data.description}</span>
            </div>` : ''}
          </div>
        `;
  
      case 'crews':
        return `
          <h2>${getValue(data, 'name')}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Prime totale:</span>
              <span class="detail-value">${getValue(data, 'total_prime', '0')} Berries</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Nombre de membres:</span>
              <span class="detail-value">${getValue(data, 'number')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Equipage de Yonko:</span>
              <span class="detail-value">${data.is_yonko ? 'Oui' : 'Non'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut:</span>
              <span class="detail-value">${getValue(data, 'status')}</span>
            </div>
            ${data.description ? `
            <div class="detail-item full-width">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${data.description}</span>
            </div>` : ''}
          </div>
        `;
  
      case 'locations':
        return `
          <h2>${getValue(data, 'name')}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Mer:</span>
              <span class="detail-value">${getValue(data, 'sea_name')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Région:</span>
              <span class="detail-value">${getValue(data, 'region_name')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Affiliation:</span>
              <span class="detail-value">${getValue(data, 'affiliation_name')}</span>
            </div>
            ${data.description ? `
            <div class="detail-item full-width">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${data.description}</span>
            </div>` : ''}
          </div>
        `;
  
      default:
        return '<p>Catégorie inconnue</p>';
    }
  }
  
  // Restaurer les résultats précédents
  function restorePreviousResults() {
    const lastResults = sessionStorage.getItem('lastSearchResults');
    if (!lastResults) return;
  
    const { category, results } = JSON.parse(lastResults);
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
  
    results.forEach(item => {
      blocResultats.innerHTML += 
        `<p class="res" onclick="redirectToDetails('${category}', ${item.id})">${item.name}</p>`;
    });
  }
  
  // Gestion des favoris
  function updateFavoriStar() {
    const researchBar = document.getElementById('research_bar');
    const btnFavoris = document.getElementById('btn-favoris');
    const starImg = btnFavoris.querySelector('img');
    
    if (researchBar.value && localStorage.getItem(researchBar.value) !== null) {
      starImg.src = "images/etoile-pleine.svg";
      starImg.alt = "Etoile pleine";
    } else {
      starImg.src = "images/etoile-vide.svg";
      starImg.alt = "Etoile vide";
    }
  }
  
  function addFavoris() {
    const researchBar = document.getElementById('research_bar');
    const value = researchBar.value.trim();
    
    if (!value) return;
  
    if (localStorage.length === 0) {
      const pAucunFavoris = document.getElementById('aucun-favoris');
      if (pAucunFavoris) pAucunFavoris.remove();
    }
    
    if (!localStorage.getItem(value)) {
      localStorage.setItem(value, value);
      updateFavoritesList(value);
      updateFavoriStar();
    }
  }
  
  function updateFavoritesList(value) {
    const listeFavoris = document.getElementById('liste-favoris');
    const newItem = document.createElement('li');
    newItem.id = value;
  
    const span = document.createElement('span');
    span.textContent = value;
    span.title = "Cliquer pour relancer la recherche";
    span.onclick = () => selectFavoris(value);
  
    const img = document.createElement('img');
    img.src = "images/croix.svg";
    img.width = 15;
    img.alt = "Supprimer le favori";
    img.title = "Supprimer le favori";
    img.onclick = () => deleteFavoris(value);
  
    newItem.append(span, img);
    listeFavoris.appendChild(newItem);
  }
  
  function deleteFavoris(value) {
    const item = document.getElementById(value);
    if (item) item.remove();
    localStorage.removeItem(value);
    
    if (localStorage.length === 0) {
      document.getElementById('liste-favoris').innerHTML = 
        '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
    }
    
    updateFavoriStar();
  }
  
  function loadFavoris() {
    const listeFavoris = document.getElementById('liste-favoris');
    listeFavoris.innerHTML = "";
  
    if (localStorage.length === 0) {
      listeFavoris.innerHTML = '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
      return;
    }
  
    Object.keys(localStorage).forEach(value => {
      updateFavoritesList(value);
    });
  }
  
  function selectFavoris(value) {
    const researchBar = document.getElementById('research_bar');
    if (researchBar) {
      researchBar.value = value;
      api_request();
    }
  }
  
  // Requête API spécifique pour les personnages
  async function api_request_character(way = 'name', param = '') {
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(param.match(specialChars)){
        param = param.replace(specialChars, (char) => `(${char.charCodeAt(0)})`);
    }
    
    let url;
    if(way === 'id'){
        url = `https://api.api-onepiece.com/v2/characters/fr/${param}`;
    } else {
        url = `https://api.api-onepiece.com/v2/characters/fr/search/?${way}=${param}`;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur API");
        return await response.json();
    } catch(error) {
        console.error("Erreur API personnages:", error);
        return null;
    }
  }
  
  // Initialisation
  document.addEventListener("DOMContentLoaded", function() {
    updateSearchPlaceholder();
    restorePreviousResults();
    updateFavoriStar();
    loadFavoris();
    
    const researchBar = document.getElementById('research_bar');
    researchBar.addEventListener('input', updateFavoriStar);
    
    researchBar.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        api_request();
      }
    });
  });
  
  // Animation des bulles
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.style.width = `${Math.random() * 30 + 10}px`;
    bubble.style.height = bubble.style.width;
    bubble.style.left = `${Math.random() * 100}vw`;
    bubble.style.animationDuration = `${Math.random() * 3 + 4}s`;
    document.getElementById("bubble-container").appendChild(bubble);
    setTimeout(() => bubble.remove(), 7000);
  }
  
  setInterval(createBubble, 1000);