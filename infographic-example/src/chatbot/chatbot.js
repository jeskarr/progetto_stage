let faq = [];
d3.json("./src/chatbot/faq.json").then(data => {
    faq = data;
    d3.select("#chatButton").style("display", "block");
})


function answer(q) {   
    // Remove stop-words of user question
    let filteredUserQ = removeStopWords(q);

    // Remove stop-words from faq questions
    let filteredQs = faq.map(el => 
        removeStopWords(el.question)
    );

    // Stemming of user question
    var stem = PorterStemmerIt.newStemmer('italian').stem;
    filteredUserQ = filteredUserQ.map(el => stem(el));

    // Stemming of faq questions
    filteredQs = filteredQs.map(el => el =
        el.map(item => stem(item))
    );

    // Indexing: for each word in filteredUserQ returns indexes of filteredQs that has that word
    let invertedIndex = Array.from({ length: filteredUserQ.length }, () => []);
    filteredQs.forEach((q, q_index) => {
        filteredUserQ.forEach((word, i_word) => {
            if(q.includes(word)) {
                invertedIndex[i_word].push(q_index);
            }
        })
    });

    const qsIndexes = getQsIndexCorrespondence(invertedIndex);      // sorted array of [q_index, terms_count_in_q_index_question]

    if (qsIndexes.length > 0) {
        const highestCorr = faq[parseInt(qsIndexes[0][0])];
        return highestCorr.answer + `<br /><br /> Per maggiori informazioni si consulti <a href="${highestCorr.section}">questa sezione</a> dell'infografica.`;
    }
    else {
        return "Spiacente, non sembra esserci questa informazione nell'infografica. &#128542;";
    }
}


function removeStopWords(text) {   
    const stopWords = new Set(
        [
            "a", "degl", "lui", "qua", "sui",
            "ad", "degli", "lungo", "quale", "sul",
            "adesso", "dei", "ma", "quanta", 
            "agl", "del", "quante", "sull",
            "agli", "dell", "me", "quanti", "sulla",
            "ai", "della", "meglio", "quanto", 
            "al", "delle", "mi", "quarto", "sulle",
            "all", "dello", "mia", "quasi", "sullo",
            "alla", "dentro", "mie", "quattro", "suo",
            "alle", "deve", "miei", "quella", "suoi",
            "allo", "devo", "mio", "quelle", "tanto",
            "allora", "di", "molta", "quelli", "te",
            "altre", "doppio", "molti", "quello", "tempo",
            "altri", "dov", "molto", "terzo",
            "altro", "ne", "questa", "ti",
            "anche", "due", "negl", "queste", "tra",
            "e", "negli", "questi", 
            "ancora", "ecco", "nei", "questo", "tre",
            "avere", "ed", "triplo",
            "aveva", "fare", "nel", "qui", "tu",
            "avevano", "fine", "nell", "quindi", "tua",
            "ben", "fino", "nella", "quinto", "tue",
            "buono", "fra", "nelle", "rispetto", "tuo",
            "che", "gente", "no", "sara", "tuoi",
            "giu", "noi", "se", "tutti",
            "chi", "gli", "secondo", "tutto",
            "ha", "nome", "sei", "ultimo",
            "ci", "hai", "non", "sembra", "un",
            "cinque", "hanno", "nostra", "sembrava",
            "coi", "ho", "nostre", "senza", "una",
            "col", "il", "nostri", "sette",
            "nostro", "si", "uno",
            "comprare", "in", "sia",
            "con", "indietro", "nove", "siamo", "va",
            "invece", "nuovi", "siete", "vai",
            "consecutivi", "io", "nuovo", "solo", "vi",
            "consecutivo", "o", "sono", "voi",
            "contro", "la", "oltre", "sopra", 
            "cosa", "ora", "soprattutto", "volte",
            "lavoro", "otto", "sotto", "vostra",
            "cui", "peggio", "stati", "vostre",
            "da", "le", "per", "stato", "vostri",
            "dagl", "lei", "perché", "stesso", "vostro",
            "dagli", "pero", "su", 
            "dai", "li", "persone", 
            "dal", "lo", "piu", "sua",
            "dall", "più", "subito",
            "dalla", "loro", "poco", "sue",
            "dalle", "primo", "sugl",
            "dallo", "promesso", "sugli"
        ]
    );      // tolto dove, come
    
    // Text segmentation (split on any whitespace)
    const segmentedText =  text
        .toLowerCase()
        .replace(/\W/g, " ")     // remove all not-word
        .trim()
        .split(/\s+/);

    // Filter out words that are in the set of stop words
    return segmentedText
        .filter(word => !stopWords.has(word));
}


function getQsIndexCorrespondence(indexPerWord) {
    const correspondenceCount = {};

    // Count occurrences of each document ID
    indexPerWord.flat().forEach(i => {
        if (correspondenceCount[i]) {
            correspondenceCount[i]++;
        } 
        else {
            correspondenceCount[i] = 1;
        }
    });

    const sortedQs = Object.entries(correspondenceCount)
        .sort(([, countA], [, countB]) => countB - countA);  // Sort by count in descending order

    return sortedQs;
}