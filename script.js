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
    crews: "Entrez un nom d'équipage (ex: Chapeau de Paille)",
    ships: "Entrez un nom de bateau (ex: Thousand Sunny)", 
    locations: "Entrez un nom de lieu (ex: Marine Ford)"
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
        
        updateFavoriStar();
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
  
    // Affiche les détails complets d'un élément sur la page de détails
    async function displayFullDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const id = urlParams.get('id');

        if (!category || !id) {
            document.getElementById('characterDetails').innerHTML = '<p>Paramètres manquants</p>';
            return;
        }

        try {
            const endpoint = apiConfig[category];
            const apiUrl = `https://api.api-onepiece.com/v2/${endpoint.url}/${id}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const details = await response.json();

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
// Gestion des favoris avec drag & drop
function getFavorites() {
    const favorites = localStorage.getItem('favoris'); // On récupère les données dans le localStorage
    return favorites ? JSON.parse(favorites) : []; // On s'assure de renvoyer un objet JSON
  }
  
  function saveFavorites(favorites) {
    localStorage.setItem('favoris', JSON.stringify(favorites)); // On enregistre le favoris dans le localStorage
  }
  
  function updateFavoriStar() {
    const researchBar = document.getElementById('research_bar');
    const btnFavoris = document.getElementById('btn-favoris');
    
    if (!researchBar || !btnFavoris) return;
    
    const starImg = btnFavoris.querySelector('img');
    const currentSearch = researchBar.value.trim();
    
    const favorites = getFavorites();
    const isFavorite = favorites.includes(currentSearch);
    
    if (isFavorite && currentSearch !== '') {
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

    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        const pAucunFavoris = document.getElementById('aucun-favoris');
        if (pAucunFavoris) pAucunFavoris.remove();
    }
    
    if (!favorites.includes(value)) {
        favorites.push(value);
        saveFavorites(favorites);
        updateFavoritesList(value);
        updateFavoriStar();
        
        // Mise à jour de l'autocomplétion si besoin
        if (researchBar.value.trim().length >= 2) {
            researchBar.dispatchEvent(new Event('input'));
        }
    } else {
        deleteFavoris(value);
        const btnFavoris = document.getElementById('btn-favoris');        
        const starImg = btnFavoris.querySelector('img');
        starImg.src = "images/etoile-vide.svg";
        starImg.alt = "Etoile vide";
    }
}
  
  function updateFavoritesList(value) {
    const listeFavoris = document.getElementById('liste-favoris');
    const newItem = document.createElement('li');
    newItem.id = value;
    newItem.draggable = true;
    
    // Gestion du drag & drop
    newItem.addEventListener('dragstart', dragStart);
    newItem.addEventListener('dragover', dragOver);
    newItem.addEventListener('drop', drop);
    newItem.addEventListener('dragend', dragEnd);
  
    const imgDrag = document.createElement('img');
    imgDrag.src = "images/burger-icon.png";
    imgDrag.width = 15;
    imgDrag.alt = "Déplacer le favori";
    imgDrag.title = "Déplacer le favori";

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
  
    newItem.append(imgDrag, span, img);
    listeFavoris.appendChild(newItem);
  }
  
  // Variables globales pour le drag & drop
  let draggedItem = null;
  let draggedIndex = -1;
  
  function dragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    const items = Array.from(this.parentNode.children);
    draggedIndex = items.indexOf(this);
  }
  
  function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetItem = e.target.closest('li');
    if (!targetItem || targetItem === draggedItem) return;
    
    const items = Array.from(this.parentNode.children);
    const targetIndex = items.indexOf(targetItem);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedItem, targetItem.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedItem, targetItem);
    }
    
    // Mise à jour de l'index pendant le déplacement
    draggedIndex = items.indexOf(draggedItem);
  }
  
  function drop(e) {
    e.preventDefault();
    return false;
  }
  
  function dragEnd() {
    // Sauvegarder la nouvelle position
    const listeFavoris = document.getElementById('liste-favoris');
    const newOrder = Array.from(listeFavoris.children).map(item => item.id);
    
    saveFavorites(newOrder);
    draggedItem = null;
  }
  
  function deleteFavoris(value) {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette recherche des favoris ?");
    
    if (!confirmation) return;
    
    const item = document.getElementById(value);
    if (item) item.remove();
    
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(fav => fav !== value);
    saveFavorites(updatedFavorites);
    
    if (updatedFavorites.length === 0) {
        document.getElementById('liste-favoris').innerHTML = 
            '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
    }
    
    updateFavoriStar();
    
    // Mise à jour de l'autocomplétion si besoin
    const input = document.getElementById("research_bar");
    if (input.value.trim().length >= 2) {
        input.dispatchEvent(new Event('input'));
    }
}
  
  function loadFavoris() {
    const listeFavoris = document.getElementById('liste-favoris');
    listeFavoris.innerHTML = "";
  
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
      listeFavoris.innerHTML = '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
      return;
    }
  
    favorites.forEach(value => {
      updateFavoritesList(value);
    });
  }
  
  function selectFavoris(value) {
    const researchBar = document.getElementById('research_bar');
    if (researchBar) {
      researchBar.value = value;
      updateFavoriStar();
      api_request();
    }
  }
  
  // Initialisation
document.addEventListener("DOMContentLoaded", function() {
  // 1. Configuration des styles
  const style = document.createElement('style');
  style.textContent = `
      /* Styles pour les favoris et drag & drop */
      #liste-favoris li {
          cursor: grab;
          user-select: none;
          padding: 5px;
          margin: 3px 0;
          border-radius: 4px;
      }
      #liste-favoris li.dragging {
          opacity: 0.5;
          cursor: grabbing;
      }
      
      /* Styles pour l'autocomplétion */
      .autocomplete-items {
          position: absolute;
          border: 1px solid #2d2d2d;
          border-radius: 0 0 4px 4px;
          z-index: 99;
          top: 100%;
          left: 0;
          right: 0;
          background: #2d2d2d;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .autocomplete-items div {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
      }
      .autocomplete-items strong {
          color: #0066cc;
      }
      #bloc-recherche {
          position: relative;
      }
      
      /* Style pour le bouton de suppression */
      #liste-favoris li img[src="images/croix.svg"] {
          float: right;
          cursor: pointer;
          margin-left: 10px;
      }
      
      /* Style pour l'icône de drag */
      #liste-favoris li img[src="images/burger-icon.png"] {
          margin-right: 8px;
          vertical-align: middle;
      }
  `;
  document.head.appendChild(style);

  // 2. Initialisation des composants
  updateSearchPlaceholder();  // Met à jour le placeholder selon la catégorie
  restorePreviousResults();   // Restaure les résultats de la dernière recherche
  updateFavoriStar();         // Met à jour l'état de l'étoile des favoris
  loadFavoris();              // Charge la liste des favoris
  setupAutocomplete();        // Initialise le système d'autocomplétion

  // 3. Gestion des événements de la barre de recherche
  const researchBar = document.getElementById('research_bar');
  if (researchBar) {
      // Met à jour l'étoile quand le texte change
      researchBar.addEventListener('input', function() {
          updateFavoriStar();
      });
      
      // Lance la recherche quand on appuie sur Entrée
      researchBar.addEventListener("keypress", function(e) {
          if (e.key === "Enter") {
              e.preventDefault();
              api_request();
          }
      });
  }
});
  
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
  if (researchBar) {
    researchBar.addEventListener('input', updateFavoriStar);
    
    researchBar.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        api_request();
      }
    });
  }
});

function setupAutocomplete() {
  const input = document.getElementById("research_bar");
  const autocompleteList = document.createElement("div");
  autocompleteList.id = "autocomplete-list";
  autocompleteList.className = "autocomplete-items";
  input.parentNode.appendChild(autocompleteList);

  input.addEventListener("input", function() {
      const val = this.value.trim();
      autocompleteList.innerHTML = '';
      
      if (val.length < 2) return;
      
      const favorites = getFavorites();
      const suggestions = favorites.filter(item => 
          item.toLowerCase().includes(val.toLowerCase())
      );
      
      suggestions.slice(0, 8).forEach(item => {
          const itemElement = document.createElement("div");
          const matchedText = item.replace(
              new RegExp(val, 'gi'), 
              match => `<strong>${match}</strong>`
          );
          itemElement.innerHTML = matchedText;
          
          itemElement.addEventListener("click", function() {
              input.value = item;
              autocompleteList.innerHTML = '';
              updateFavoriStar();
              api_request();
          });
          
          autocompleteList.appendChild(itemElement);
      });
  });
  
  document.addEventListener("click", function(e) {
      if (e.target !== input) {
          autocompleteList.innerHTML = '';
      }
  });
}
 
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