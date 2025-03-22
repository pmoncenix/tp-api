async function api_request(param=document.getElementById('research_bar').value){
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
    const gifAttente = document.getElementById('bloc-gif-attente');
    gifAttente.style.display = 'block';
    

    let research=param;
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(research.match(specialChars)){
        research.replace(specialChars, (char) => {
            return `(${char.charCodeAt(0)})`;  // Remplace le caractère spécial par son code ASCII
          });
    }
    const url = 'https://api.api-onepiece.com/v2/characters/fr/search/?name='+research;
    try{
        const response = await fetch(url);
        const result = await response.text();
        if(response.ok){
            let formatedResult=JSON.parse(result);
            console.log(formatedResult);
            console.log(typeof(formatedResult))
    
            gifAttente.style.display = 'none';
            if(formatedResult.length>0){
                console.log(formatedResult[0].name);
                for(let i=0; i<formatedResult.length;i++){
                    blocResultats.innerHTML += '<div><p class="res">'+formatedResult[i].name+'</p></div>';
                }
            }
            else{
                blocResultats.innerHTML += '<p class="info-vide">(Aucun résultat trouvé)</p>';
            }
            console.log(result);
        }else{
            gifAttente.style.display = 'none';
    
            blocResultats.innerHTML += '<p class="info-vide">(Erreur lors de la recherche)</p>';
        }
    }catch{
        gifAttente.style.display = 'none';
        blocResultats.innerHTML += '<p class="info-vide">(Erreur lors de la recherche)</p>';
    }


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
