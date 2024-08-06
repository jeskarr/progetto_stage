import readline from 'readline';

const questions = [
    {
        question: "A chi è rivolta l'infografica?\n",
        answer: null,
    },
    {
        question: "\nPerchè qualcuno dovrebbe ritenerti una fonte attendibile a presentare quest'infografica?\n",
        answer: null,
    },
    {
        question: "\nRacconta la storia che vuoi rappresentare con questa infografica.\n",
        answer: null,
    },
]


function askUser(i) {
    return new Promise((resolve) => {
        rl.question(questions[i].question, (userInput) => {
            const trimmedInput = userInput.trim();
            questions[i].answer = trimmedInput;
            resolve(trimmedInput);            
        })
    })
}

function composedPrompt (target, ethos, story) {
    return `Questa è una conversazione tra User e Llama, un chatbot amichevole. Llama è disponibile, onesto, bravo a scrivere e non manca mai di rispondere immediatamente e con precisione a qualsiasi richiesta.

User: 
Devo presentare il seguente testo a ${target}.
${ethos}.

Testo:
${story}

Domande:
1.	Supponi che un elemento è di "pathos" se può indurre il pubblico a sentire (o non sentire) una connessione emotiva con il contenuto.
    Riporta tutti gli elementi (frasi, espressioni e parole) di "pathos" del Testo, SOLO se hanno senso nel contesto del Testo. Suggerisci altre frasi incisive di "pathos" da poter inserire nel Testo.
2.  Supponi che un elemento è di "ethos" se può indurre il pubblico a ritenere che l'autore sia (o meno) affidabile e credibile.
    Riporta tutti gli elementi (frasi, espressioni e parole) di "ethos" del Testo, SOLO se hanno senso nel contesto del Testo. Suggerisci altre frasi incisive di "ethos" da poter inserire nel Testo basandoti sul mio ruolo SE rilevante al tema del Testo.
3.  Supponi che un elemento è di "logos" se può indurre il pubblico a credere che l'argomentazione sia (o meno) logica e supportata da prove adeguate.
    Riporta tutti gli elementi (frasi, espressioni e parole) di "logos" del Testo, SOLO se hanno senso nel contesto del Testo. Suggerisci altre frasi incisive di "logos" da poter inserire nel Testo.
4.	Supponi che un elemento è "estraneo" se può ritenersi estraneo rispetto al tema principale del Testo oppure può ritenersi un'assurdità.
    Riporta tutti gli elementi (frasi, espressioni e parole) "estraneo" presenti nel Testo.
5.	Quali sono le parti in cui si divide il testo? Per ogni parte, dimmi solo un titoletto breve.
6.	Tolta l'introduzione, identifica la relazione generale tra le parti come una delle seguenti:
    -	parti di una lista, 
    -	parti di una linea del tempo, 
    -	parti poste a confronto, 
    -	parti che compongono gerarchia, 
    -	parti correlate poste allo stesso livello, 
    -	parti di un processo ordinato. 

Fornisci solamente le risposte nel seguente formato JSON: 
{ "pathos": { "presente": boolean, "elementi": [string], "suggerimenti": [string] }, "ethos": { "presente": boolean, "elementi": [string], "suggerimenti": [string] }, "logos": { "presente": boolean, "elementi": [string], "suggerimenti": [string] }, "elementi_estraneo": {"presente": boolean, "elementi": [string]}, "parti": [string], "relazione": "string" } 


Llama:` 
}


const grammarGbnf = `elementi-estraneo ::= "{" space elementi-estraneo-presente-kv "," space elementi-estraneo-elementi-kv "}" space
elementi-estraneo-elementi ::= "[" space (string ("," space string)*)? "]" space
elementi-estraneo-elementi-kv ::= "\\"elementi\\"" space ":" space elementi-estraneo-elementi
elementi-estraneo-kv ::= "\\"elementi_estraneo\\"" space ":" space elementi-estraneo
elementi-estraneo-presente-kv ::= "\\"presente\\"" space ":" space boolean
boolean ::= ("true" | "false") space
char ::= [^"\\\\] | "\\\\" (["\\\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F])
ethos ::= "{" space ethos-presente-kv ( "," space ( ethos-elementi-kv ethos-elementi-rest | ethos-suggerimenti-kv ) )? "}" space
ethos-elementi ::= "[" space (string ("," space string)*)? "]" space
ethos-elementi-kv ::= "\\"elementi\\"" space ":" space ethos-elementi
ethos-elementi-rest ::= ( "," space ethos-suggerimenti-kv )?
ethos-kv ::= "\\"ethos\\"" space ":" space ethos
ethos-presente-kv ::= "\\"presente\\"" space ":" space boolean
ethos-suggerimenti ::= "[" space (string ("," space string)*)? "]" space
ethos-suggerimenti-kv ::= "\\"suggerimenti\\"" space ":" space ethos-suggerimenti
logos ::= "{" space logos-presente-kv ( "," space ( logos-elementi-kv logos-elementi-rest | logos-suggerimenti-kv ) )? "}" space
logos-elementi ::= "[" space (string ("," space string)*)? "]" space
logos-elementi-kv ::= "\\"elementi\\"" space ":" space logos-elementi
logos-elementi-rest ::= ( "," space logos-suggerimenti-kv )?
logos-kv ::= "\\"logos\\"" space ":" space logos
logos-presente-kv ::= "\\"presente\\"" space ":" space boolean
logos-suggerimenti ::= "[" space (string ("," space string)*)? "]" space
logos-suggerimenti-kv ::= "\\"suggerimenti\\"" space ":" space logos-suggerimenti
parti ::= "[" space (string ("," space string)*)? "]" space
parti-kv ::= "\\"parti\\"" space ":" space parti
pathos ::= "{" space pathos-presente-kv ( "," space ( pathos-elementi-kv pathos-elementi-rest | pathos-suggerimenti-kv ) )? "}" space
pathos-elementi ::= "[" space (string ("," space string)*)? "]" space
pathos-elementi-kv ::= "\\"elementi\\"" space ":" space pathos-elementi
pathos-elementi-rest ::= ( "," space pathos-suggerimenti-kv )?
pathos-kv ::= "\\"pathos\\"" space ":" space pathos
pathos-presente-kv ::= "\\"presente\\"" space ":" space boolean
pathos-suggerimenti ::= "[" space (string ("," space string)*)? "]" space
pathos-suggerimenti-kv ::= "\\"suggerimenti\\"" space ":" space pathos-suggerimenti
relazione ::= "\\"parti di un processo ordinato\\"" | "\\"parti di una lista\\"" | "\\"parti di una linea del tempo\\"" | "\\"parti poste a confronto\\"" | "\\"parti di una gerarchia\\"" | "\\"parti correlate poste allo stesso livello\\"" 
relazione-kv ::= "\\"relazione\\"" space ":" space relazione
root ::= "{" space pathos-kv "," space ethos-kv "," space logos-kv "," space elementi-estraneo-kv "," space parti-kv "," space relazione-kv "}" space
space ::= " "?
string ::= "\\"" char* "\\"" space`


// Ask questions to user 
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('*******************************\nBenvenuto in Infographic-Helper\n*******************************'+
    '\nRispondi alle seguenti domande per trovare la storia perfetta alla tua infografica.\n\n');


for (let question in questions) {
    await askUser(question);
}
rl.close();

// Ask llm
const jsonInfo = fetch("http://padova.zucchetti.it:8207/completion", {
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
        prompt: composedPrompt(questions[0].answer, questions[1].answer, questions[2].answer), 
        stop: ["</s>", "Llama:", "User:"], 
        temperature: 0, 
        grammar: grammarGbnf,
    })
}).then(response => {
    if (!response.ok) {
        throw new Error('Si è verificato un errore nel fetch del LLM .');
    }
    return response.json();
}).then(data => {
    return JSON.parse(data.content);
}).catch(error => {
    console.error("ERRORE: " + error);
});


console.log(await jsonInfo)