import readline from 'readline';


// Check if first element of data for each string is a number or not (category)
function isVariableNumeric(data, columnIndex) {
    for (let i = 0; i < data.length; i++) {
        if (isNaN(data[i][columnIndex])) {
            return false;
        }
    }
    return true;
}

// Return # of numeric and categoric variables
function getTypes(data) {
    let numVariablesNo = 0;
    let catVariablesNo = 0;

    data.columns.forEach((column, columnIndex) => {
        if (isVariableNumeric(data.data, columnIndex)) {
            numVariablesNo++;
        } else {
            catVariablesNo++;
        }
    });

    
    //TEST (uncomment and adjust as needed)
    /*numVariablesNo = 1;
    catVariablesNo = 2;*/

    return { catVariablesNo, numVariablesNo };
}


// Question to ask the user
const questions = [
    {
        question: "I dati sono ordinati? (s/n)\n",
        choices: ["s", "n"],
    },
    {
        question: "Come sono organizzati i dati categorici? (subgroup/nested/independent)\n",
        choices: ["subgroup", "nested", "independent"],
    },
    {
        question: "Ci possono essere più occorrenze? (s/n)\n",
        choices: ["s", "n"],
    },
    {
        question: "Qual è l'obiettivo della visualizzazione? Fornisci una breve descrizione di ciò che vorresti rappresentare.\n",
    },
]

const objectives = [
    "Divergenza",
    "Correlazione",
    "Ranking",
    "Distribuzione",
    "Cambiamento nel tempo",
    "Composizione",
    "Grandezze",
    "Spazi",
    "Flussi"
]

function objectivePrompt (userInput) {
    return `Questa è una conversazione tra User e Llama, un chatbot amichevole. Llama è disponibile, onesto, bravo a scrivere e non manca mai di rispondere immediatamente e con precisione a qualsiasi richiesta.

User: 
Dati i seguenti obiettivi:
Obiettivo 1: Mostrami la differenza tra i dati; Confronta due serie di dati divergenti; Mostrami la variazione rispetto a un valore.
Obiettivo 2: Mostrami un dato in relazione ad un altro; Mostrami come sono associati i due dati; Mostrami la correlazione tra un dato e i suoi due fattori.
Obiettivo 3: Mostrami la classifica; Mostrami i top; Mostrami i dati più importanti; Mostrami i più comuni; Mostrami i principali.
Obiettivo 4: Mostrami quante volte si verifica un evento; Mostrami la distribuzione del dato; Mostrami la media; Mostrami la frequenza.
Obiettivo 5: Mostrami la variazione nel tempo del dato; Mostrami la tendenza del dato nel tempo; Mostrami le differenze tra i dati nel tempo; Mostrami il cambiamento dei dati nel tempo; Mostrami le previsioni future.
Obiettivo 6: Mostrami i componenti del dato; Mostrami il dato diviso nei sottogruppi; Mostrami la struttura del dato; Mostrami la ripartizione del dato.
Obiettivo 7: Mostrami la dimensione effettiva del dato; Mostrami le unità; Mostrami la misura del dato; Mostra la rilevanza del dato all'interno di un contesto; Mostrami la grandezza dei dati.
Obiettivo 8: Mostrami la posizione; Mostrami i flussi nel mondo; Mostrami la mappa di distribuzione; Mostrami i paesi in cui si verifica l'evento; Mostrami la variazione nello spazio del dato.
Obiettivo 9: Mostrami i flussi tra i vari punti; Mostrami la rete; Mostrami le relazioni e la loro intensità; Mostrami cosa influisce nel dato; Mostrami come sono relazionati all'interno di un sistema. 

Classifica la seguente frase, dimmi solamente il numero dell'obiettivo senza altre parole: 
${userInput}
Llama:` 
}

// Line reader
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask questions
function askUser(i) {
    return new Promise((resolve) => {
        rl.question(questions[i].question, (userInput) => {
            const trimmedInput = userInput.trim();

            if (questions[i].choices !== undefined && !questions[i].choices.includes(trimmedInput)) {
                console.log(`Input invalido. Inserire solo uno dei seguenti: ${questions[i].choices.join(", ")}.`)
                askUser(i).then(resolve);
            }
            else {
                resolve(trimmedInput);
            }
            
        })
    })
}

function getOrder() {
    return askUser(0).then(d => {
        return d === 's';
    });
}

function getOrganized() {
    return askUser(1).then(d => {
        return d;
    });
}

function getMultipleObs() {
    return askUser(2).then(d => {
        return d === 's';
    });
}

function getObjective() {
    return askUser(3).then((userInput) => {
            rl.close();
            return fetch("http://padova.zucchetti.it:8207/completion", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: objectivePrompt(userInput), stop: ["</s>", "Llama:", "User:"], temperature: 0 })
            });
        }).then(response => {
            if (!response.ok) {
                throw new Error('Si è verificato un errore nel fetch del LLM responsabile della classificazione per obiettivo.');
            }
            return response.json();
        }).then(data => {
            const firstAnswer = data.content.split('\n').filter(el => el.trim() !== "")[0];
            const obj_n_arr = firstAnswer.match(/\d/);
            const obj_n = obj_n_arr ? parseInt(obj_n_arr[0], 10) : null;
            console.log(`Obiettivo ricavato: ${obj_n} - ${objectives[obj_n-1]}`);
            return obj_n;
        }).catch(error => {
            console.error('Errore:', error);
        });
}


// Close the line reader
function closeInput() {
    rl.close();
    return null;
}

export { getTypes, getObjective, getOrder, getOrganized, getMultipleObs, closeInput };