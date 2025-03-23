async function api_request_character(way='name',param=document.getElementById('research_bar').value){
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(param.match(specialChars)){
        param = param.replace(specialChars, (char) => `(${char.charCodeAt(0)})`);
    }
    let url=''
    if(way=='id'){
        url ='https://api.api-onepiece.com/v2/characters/fr/'+param;
    }else{
        url = 'https://api.api-onepiece.com/v2/characters/fr/search/?'+way+'='+param;
    }
    try{
        const response = await fetch(url);
        const result = await response.text();
        let formatedResult=JSON.parse(result);
        return formatedResult;
    }catch{
        return 0;
    }
}

async function api_request() {
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
    const gifAttente = document.getElementById('bloc-gif-attente');
    gifAttente.style.display = 'block';

    const apiResult = await api_request_character();
    gifAttente.style.display = 'none';

    if (apiResult.length > 0 && apiResult != 0) {
        console.log(apiResult[0].name);
        let resultsArray = [];

        for (let i = 0; i < apiResult.length; i++) {
            const characterHTML = `<div><p class="res" onclick="redirectToDetails(${apiResult[i].id})">${apiResult[i].name}</p></div>`;
            blocResultats.innerHTML += characterHTML;
            resultsArray.push({ id: apiResult[i].id, name: apiResult[i].name });
        }

        // Stocker les résultats dans sessionStorage
        sessionStorage.setItem('lastSearchResults', JSON.stringify(resultsArray));
    } else {
        blocResultats.innerHTML += '<p class="info-vide">(Aucun résultat trouvé)</p>';
    }

    console.log(apiResult);
}

// Fonction pour restaurer les résultats si disponibles
function restorePreviousResults() {
    const lastResults = sessionStorage.getItem('lastSearchResults');
    if (lastResults) {
        const blocResultats = document.getElementById('bloc-resultats');
        blocResultats.innerHTML = '';
        const resultsArray = JSON.parse(lastResults);

        resultsArray.forEach(character => {
            blocResultats.innerHTML += `<div><p class="res" onclick="redirectToDetails(${character.id})">${character.name}</p></div>`;
        });
    }
}

// Charger les anciens résultats au chargement de la page
document.addEventListener("DOMContentLoaded", restorePreviousResults);


function addFavoris(){
    console.log("addFavortis()");
    const research_bar=document.getElementById('research_bar');
    if(localStorage.length==0 & research_bar.value.length!=0){
        const pAucunFavoris = document.getElementById('aucun-favoris');
        pAucunFavoris.remove();
    }
    if(localStorage.getItem(research_bar.value)==null & research_bar.value.length!=0){
        localStorage.setItem(research_bar.value,research_bar.value);
        const liste_favoris=document.getElementById('liste-favoris');
        const newItem = document.createElement('li');
        newItem.id = research_bar.value;
    
        const span = document.createElement('span');
        span.textContent = research_bar.value;
        span.title = "Cliquer pour relancer la recherche";
        span.onclick = function() {
            api_request(this.textContent);
        };
    
        const img = document.createElement('img');
        img.src = "images/croix.svg";
        img.width = 15;
        img.alt = "Icone pour supprimer le favori";
        img.title = "Cliquer pour supprimer le favori";
        img.onclick = function() {
            deleteFavoris(this.parentNode.querySelector('span').textContent);
        };
    
        newItem.appendChild(span);
        newItem.appendChild(img);
    
        liste_favoris.appendChild(newItem);
    }
}

function deleteFavoris(favoris){
    console.log(favoris);
    const htmlFavoris=document.getElementById(favoris);
    htmlFavoris.remove();
    localStorage.removeItem(favoris);
    if(localStorage.length==0){
        const section_favoris=document.getElementById('section-favoris');
        section_favoris.innerHTML += '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
    }
}

function loadFavoris() {
    const liste_favoris = document.getElementById('liste-favoris');
    liste_favoris.innerHTML = "";

    Object.keys(localStorage).forEach(function (key) {
        const value = localStorage.getItem(key);

        // Vérification console pour voir les favoris chargés
        console.log(`Favori chargé : ${value}`);

        // Créer l'élément li et span dynamiquement
        const li = document.createElement('li');
        li.id = value;

        const span = document.createElement('span');
        span.textContent = value;
        span.title = "Cliquer pour relancer la recherche";
        span.onclick = function () {
            selectFavoris(value);
        };

        const img = document.createElement('img');
        img.src = "images/croix.svg";
        img.alt = "Icone pour supprimer le favori";
        img.width = 15;
        img.title = "Cliquer pour supprimer le favori";
        img.onclick = function () {
            deleteFavoris(value);
        };

        li.appendChild(span);
        li.appendChild(img);
        liste_favoris.appendChild(li);
    });

    if (localStorage.length === 0) {
        document.getElementById('liste-favoris').innerHTML = '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
    }
}

function selectFavoris(favoris) {
    console.log(`Sélection du favori : ${favoris}`);
    const researchBar = document.getElementById('research_bar');
    
    if (researchBar) {
        researchBar.value = favoris;
        console.log("Recherche mise à jour :", researchBar.value);
        api_request();
    } else {
        console.error("La barre de recherche n'a pas été trouvée !");
    }
}

function redirectToDetails(characterId) {
    // Rediriger vers la page de détails avec l'ID du personnage dans l'URL
    window.location.href = `details.html?id=${characterId}`;
}

async function fetchCharacterDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id'); // Récupérer l'ID du personnage depuis l'URL

    if (!characterId) {
        console.error("Aucun ID de personnage trouvé dans l'URL.");
        return;
    }

    try {
        const character = await api_request_character('id', characterId);
        
        if (!character || character.error) {
            console.error("Erreur lors de la récupération du personnage :", character?.error || "Personnage non trouvé.");
            document.getElementById('characterDetails').innerHTML = "<p>Personnage introuvable.</p>";
            return;
        }

        // Vérifier si l'équipage est un objet et récupérer son nom
        let crewName = "Aucun équipage connu";
        if (character.crew && typeof character.crew === 'object') {
            crewName = character.crew.name || "Nom d'équipage inconnu";
        }

        let yonko = "Non disponible";
        if (character.crew && typeof character.crew === 'object') {
            yonko = character.crew.is_yonko === 'true' ? "Oui" : "Non";
        }

        let fruit = "Aucun fruit";
        if (character.fruit && typeof character.fruit === 'object') {
            fruit = character.fruit.name || "Aucun fruit";
        }

        let fruitType = "Non disponible";
        if (character.fruit && typeof character.fruit === 'object') {
            fruitType = character.fruit.type || "Non disponible";
        }

        let fruitImage = "";
        if (character.fruit && character.fruit.filename) {
            fruitImage = `<img src="${character.fruit.filename}" alt="${fruit}" style="max-width: 200px; height: auto;">`;
        }

        const detailsContainer = document.getElementById('characterDetails');
        detailsContainer.innerHTML = `
            <h2>${character.name || "Nom inconnu"}</h2>
            <p>${character.description || "Description non disponible"}</p>
            <p>Rôle : ${character.job || "Non disponible"}</p>
            <p>Prime : ${character.bounty ? character.bounty + " Berries" : "Non disponible"}</p>
            <p>Équipage : ${crewName}</p>
            <p>Âge : ${character.age || "Non disponible"}</p>
            <p>Job : ${character.job || "Non disponible"}</p>
            <p>Status : ${character.status || "Non disponible"}</p>
            <p>Equipage de yonko : ${yonko}</p>
            <p>Fruit : ${fruit}</p>
            <p>Type du fruit : ${fruitType}</p>
            <p> ${fruitImage} </p>
        `;
    } catch (error) {
        console.error("Erreur de récupération des détails du personnage :", error);
        document.getElementById('characterDetails').innerHTML = "<p>Une erreur est survenue.</p>";
    }
}

function createBubble() {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    const size = Math.random() * 30 + 10;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    bubble.style.left = `${Math.random() * 100}vw`;
    bubble.style.animationDuration = `${Math.random() * 3 + 4}s`; // DUrée des bulles

    document.getElementById("bubble-container").appendChild(bubble);

    // Suppression des bulles
    setTimeout(() => bubble.remove(), 7000);
}

// Création de bulles en continu
setInterval(createBubble, 1000);

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("#bloc-recherche input[type='text']");
    const searchButton = document.querySelector("#bloc-recherche button");
  
    if (searchInput && searchButton) {
      searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          event.preventDefault(); // Empêche le rechargement de la page
          searchButton.click(); // Simule un clic sur le bouton de recherche
        }
      });
    }
  });
  