async function api_request_character(way='name', param=document.getElementById('research_bar').value){
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(param.match(specialChars)){
        param = param.replace(specialChars, (char) => `(${char.charCodeAt(0)})`);
    }
    let url = (way === 'id') 
        ? `https://api.api-onepiece.com/v2/characters/fr/${param}`
        : `https://api.api-onepiece.com/v2/characters/fr/search/?${way}=${param}`;
    
    try {
        const response = await fetch(url);
        return await response.json();
    } catch {
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
        localStorage.setItem('lastSearchResults', JSON.stringify(apiResult));
        apiResult.forEach(character => {
            blocResultats.innerHTML += `<div><p class="res" onclick="redirectToDetails(${character.id})">${character.name}</p></div>`;
        });
    } else {
        blocResultats.innerHTML = '<p class="info-vide">(Aucun résultat trouvé)</p>';
    }
}

function restoreLastSearch() {
    const lastSearch = localStorage.getItem('lastSearchResults');
    if (lastSearch) {
        const characters = JSON.parse(lastSearch);
        const blocResultats = document.getElementById('bloc-resultats');
        blocResultats.innerHTML = '';
        characters.forEach(character => {
            blocResultats.innerHTML += `<div><p class="res" onclick="redirectToDetails(${character.id})">${character.name}</p></div>`;
        });
    }
}

document.addEventListener("DOMContentLoaded", restoreLastSearch);

function redirectToDetails(characterId) {
    window.location.href = `details.html?id=${characterId}`;
}

async function fetchCharacterDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');
    if (!characterId) return;

    try {
        const character = await api_request_character('id', characterId);
        if (!character || character.error) {
            document.getElementById('characterDetails').innerHTML = "<p>Personnage introuvable.</p>";
            return;
        }
        
        let crewName = character.crew?.name || "Aucun équipage connu";
        let yonko = character.crew?.is_yonko ? "Oui" : "Non";
        
        document.getElementById('characterDetails').innerHTML = `
            <h2>${character.name || "Nom inconnu"}</h2>
            <p>${character.description || "Description non disponible"}</p>
            <p>Rôle : ${character.role || "Non disponible"}</p>
            <p>Prime : ${character.bounty ? character.bounty + " Berries" : "Non disponible"}</p>
            <p>Équipage : ${crewName}</p>
            <p>Âge : ${character.age || "Non disponible"}</p>
            <p>Job : ${character.job || "Non disponible"}</p>
            <p>Status : ${character.status || "Non disponible"}</p>
            <p>Equipage de yonko : ${yonko}</p>
        `;
    } catch (error) {
        document.getElementById('characterDetails').innerHTML = "<p>Une erreur est survenue.</p>";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("#bloc-recherche input[type='text']");
    const searchButton = document.querySelector("#bloc-recherche button");
    if (searchInput && searchButton) {
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchButton.click();
            }
        });
    }
});