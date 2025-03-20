async function api_request(){
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
    let formatedResult=JSON.parse(result);
    console.log(formatedResult);
    console.log(formatedResult[0].name);
    console.log(typeof(formatedResult))
    document.getElementById("bloc-resultats").textContent =formatedResult[0].name;
    document.getElementById("image-perso").textContent =formatedResult[0].name;


    fetch(url)
    .then(response => response.json())
    .catch(err => console.error(err));

    console.log(result);
}