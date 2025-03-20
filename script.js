async function api_request(){
    const blocResultats = document.getElementById('bloc-resultats');
    blocResultats.innerHTML = '';
    const gifAttente = document.getElementById('bloc-gif-attente');
    gifAttente.style.display = 'block';
    

    let research=document.getElementById('research_bar').value;
    const specialChars = /[^a-zA-Z0-9]/g; 
    if(research.match(specialChars)){
        research.replace(specialChars, (char) => {
            return `(${char.charCodeAt(0)})`;  // Remplace le caractère spécial par son code ASCII
          });
    }
    const url = 'https://api.api-onepiece.com/v2/characters/fr/search/?name='+research;
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
                blocResultats.innerHTML += '<p class="res">'+formatedResult[i].name+'</p>';
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

}