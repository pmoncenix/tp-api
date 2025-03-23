async function api_request_character(way='name',param=document.getElementById('research_bar').value){
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(param.match(specialChars)){
        param.replace(specialChars, (char) => {
            return `(${char.charCodeAt(0)})`;  // Remplace le caractère spécial par son code ASCII
          });
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

async function api_request(){
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
    const gifAttente = document.getElementById('bloc-gif-attente');
    gifAttente.style.display = 'block';
    const apiResult=await api_request_character();
    gifAttente.style.display = 'none';
    if(apiResult.length>0 & apiResult!=0){
        console.log(apiResult[0].name);
        for(let i=0; i<apiResult.length;i++){
            blocResultats.innerHTML += '<div><p class="res" onclick="redirectToDetails('+apiResult[i].id+')">'+apiResult[i].name+'</p></div>';
        }
    }
    else{
        blocResultats.innerHTML += '<p class="info-vide">(Aucun résultat trouvé)</p>';
    }
    console.log(apiResult);
}

function addFavoris(){
    console.log("addFavortis()");
    const research_bar=document.getElementById('research_bar');
    if(localStorage.length==0){
        const pAucunFavoris = document.getElementById('aucun-favoris');
        pAucunFavoris.remove();
    }
    if(localStorage.getItem(research_bar.value)==null){
        localStorage.setItem(research_bar.value,research_bar.value);
        const liste_favoris=document.getElementById('liste-favoris');
        liste_favoris.innerHTML += '<li id='+research_bar.value+'><span title="Cliquer pour relancer la recherche" onclick="api_request(this.textContent)">'+research_bar.value+'</span><img src="images/croix.svg" alt="Icone pour supprimer le favori" width="15" title="Cliquer pour supprimer le favori" onclick="deleteFavoris(this.parentNode.querySelector(\'span\').textContent)"/>';
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

function loadFavoris(){
    const liste_favoris=document.getElementById('liste-favoris');
    Object.keys(localStorage).forEach(function(key) {
        const value = localStorage.getItem(key);
        liste_favoris.innerHTML += '<li id='+value+'><span title="Cliquer pour relancer la recherche" onclick="api_request(this.textContent)">'+value+'</span><img src="images/croix.svg" alt="Icone pour supprimer le favori" width="15" title="Cliquer pour supprimer le favori" onclick="deleteFavoris(this.parentNode.querySelector(\'span\').textContent)"/>';
        console.log(`Clé : ${key}, Valeur : ${value}`);
    });
    if(localStorage.length==0){
        const section_favoris=document.getElementById('section-favoris');
        section_favoris.innerHTML += '<p id="aucun-favoris" class="info-vide">(Aucune recherche favorite)</p>';
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

        const detailsContainer = document.getElementById('characterDetails');
        detailsContainer.innerHTML = `
            <h2>${character.name || "Nom inconnu"}</h2>
            <p>${character.description || "Description non disponible"}</p>
            <p>Rôle : ${character.role || "Non disponible"}</p>
            <p>Prime : ${character.bounty ? character.bounty + " Berries" : "Non disponible"}</p>
            <p>Équipage : ${crewName}</p>
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
