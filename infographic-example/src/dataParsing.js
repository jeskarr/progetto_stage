/**
 * Loading map data of locations
 */
const mapInfo = d3.json("./src/assets//data/sedi.json").then(data => {
    createMap(data);
})


/**
 * Csv data about students background (gender, age, school, grades)
 */
const studentsInfo = d3.dsv(";", "./src/assets//data/IMMATRICOLATI_per_corso_genere_età_voto_2022-23.csv").then(data => {
    const courseData = data.find(d => d["Corso di laurea - sede"] === "INFORMATICA - PADOVA");
    loadDataIntoCard(["grade-avg", "age-avg"], [`${courseData["Totale voto medio"]}`, `${courseData["Totale età media"]}`]);
})

const studentsBackground = d3.dsv(";", "./src/assets//data/IMMATRICOLATI_per_corso_genere_titolo_scuola_2022-23.csv").then(data => {
    const courseData = data.find(d => d["Corso di laurea - sede"] === "INFORMATICA - PADOVA");
    const demographicsSvg = d3.select("#demographics .section-content > .dataviz-wrapper svg g");
    createSankeyViz(demographicsSvg, courseData)
})


/**
 *  Csv data about uni journey of students (duration, grade, opinions)
 */ 
const studentsJourney = d3.dsv(";", "./src/assets//data/LAUREATI_per_corso_genere_voto_durata_2023.csv").then(data => {
    const courseData = data.find(d => d["Corso di laurea - Sede"] === "INFORMATICA - PADOVA");
    loadDataIntoCard(["years-avg", "uni-grade-avg"], [`${courseData["Totale durata media"]}`, `${courseData["Totale voto medio"]}`]);
})

d3.text('./src/assets//data/profilo_laureati_2022.csv').then(function(data) {
    const parsedData = parseAlmaLaureaCsv(data);

    // Duration of uni journey
    const durationData = parsedData.find(d => d.section === "4. RIUSCITA NEGLI STUDI UNIVERSITARI").questions[2];
    const durationSvg = d3.select("#exit-results .section-content svg g");
    createOrderedBarViz(durationSvg, durationData);

    // Students opinion
    const opinions = parsedData.find(d => d.section === "7. GIUDIZI SULL'ESPERIENZA UNIVERSITARIA");

    const courseOpinionSvg = d3.select("#course-outline .section-appendix > .dataviz-wrapper svg g");
    d3.select("#course-outline .section-appendix > .dataviz-wrapper .chart-title")
        .text(opinions.questions[14].question);
    createDivergingBarViz(courseOpinionSvg, opinions.questions[14]);

    const fellowsOpinionSvg = d3.select("#demographics .section-appendix > .dataviz-wrapper svg g");
    d3.select("#demographics .section-appendix > .dataviz-wrapper .chart-title")
        .text(opinions.questions[2].question);
    createDivergingBarViz(fellowsOpinionSvg, opinions.questions[2]);

    const uniOpinionSvg = d3.select("#redo-opinion svg g");
    d3.select("#redo-opinion .chart-title")
        .text(opinions.questions[15].question)
    createWaffleViz(uniOpinionSvg, opinions.questions[15]);

    const generalOpinionSvg = d3.select("#general-opinion svg g");
    d3.select("#general-opinion .chart-title")
        .text(opinions.questions[0].question)
    createDivergingBarViz(generalOpinionSvg, opinions.questions[0], "small");

    const classroomOpinionsSvg = d3.select("#room-opinion svg g");
    d3.select("#room-opinion .chart-title")
        .text(opinions.questions[3].question)
    createWaffleViz(classroomOpinionsSvg, opinions.questions[3]);

    const studyroomOpinionsSvg = d3.select("#study-room-opinion svg g");
    d3.select("#study-room-opinion .chart-title")
        .text(opinions.questions[7].question)
    createDivergingBarViz(studyroomOpinionsSvg, opinions.questions[7], "small", 1);

    const labsOpinionSvg = d3.select("#labs-opinion svg g");
    d3.select("#labs-opinion .chart-title")
        .text(opinions.questions[6].question)
    createWaffleViz(labsOpinionSvg, opinions.questions[6]);
    
    const libraryOpinionsSvg = d3.select("#library-opinion svg g");
    d3.select("#library-opinion .chart-title")
        .text(opinions.questions[5].question)
    createDivergingBarViz(libraryOpinionsSvg, opinions.questions[5], "small");
});


/**
 * Csv data about exams/course overview
 */ 
let exams = [];

d3.dsv(";", "./src/assets//data/esami_obbligatori.csv", function(data) {
    if(data.Insegnamento !== "")
        return data;
}).then(data => {
    exams = data;

    const cfu_tot = d3.rollup(
        exams,
        v => d3.sum(v, d => d["CFU\r\ntotali"]),
        d => d.SSD
    );

    loadDataIntoCard(
        ["tot-cfu", "INF-cfu", "MAT-cfu", "ALTRO-cfu"],
        [
            `${cfu_tot.get("INF")+cfu_tot.get("MAT")+cfu_tot.get("ALTRO")} CFU`,
            `(${cfu_tot.get("INF")} CFU)`,
            `(${cfu_tot.get("MAT")} CFU)`,
            `(${cfu_tot.get("ALTRO")} CFU)`
        ]
    );
    createTreemapViz();
})

/**
 * Csv data about the status of students after grad (work, study)
 */ 
d3.text('./src/assets//data/situazione_occupazionale_2022.csv').then(function(data) {
    const parsedData = parseAlmaLaureaCsv(data);

    // Overview
    const studyWorkSvg = d3.select("#post-graduation .section-content > .dataviz-wrapper svg g");
    const studyWorkData = parsedData.find(d => d.section === "3. Condizione occupazionale").questions[0];
    const sets = [
        {sets: ["Lavoratori"], size: studyWorkData.answers[0].value+studyWorkData.answers[1].value}, 
        {sets: ["Studenti"], size: studyWorkData.answers[2].value+studyWorkData.answers[1].value}, 
        {sets: ["NEET che cercano"], size: studyWorkData.answers[4].value},
        {sets: ["NEET che non cercano"], size: studyWorkData.answers[3].value},
        {sets: ["Lavoratori", "Studenti"], size: studyWorkData.answers[1].value},
    ];
    createVennViz(studyWorkSvg, sets);

    // Work 
    const workData = parsedData.find(d => d.section === "5. Caratteristiche dell'attuale lavoro").questions[0];
    const workSvg = d3.select("#post-graduation .section-content-gridlike .dataviz-wrapper:nth-child(2) svg g");
    d3.select("#post-graduation .section-content-gridlike .dataviz-wrapper:nth-child(2) .chart-title")
        .text(workData.question)
    createWaffleViz(workSvg, workData);

    // Study
    const studyData = parsedData.find(d => d.section === "2a. Formazione di secondo livello").questions[3];
    const studySvg = d3.select("#post-graduation .section-content-gridlike .dataviz-wrapper:nth-child(1) svg g");
    d3.select("#post-graduation .section-content-gridlike .dataviz-wrapper:nth-child(1) .chart-title")
        .text(studyData.question)
    createWaffleViz(studySvg, studyData);

});



/** 
 * Function to parse csv file from Almalaurea source
 */
function parseAlmaLaureaCsv(data) {
    const parsedData = d3.csvParseRows(data);
  
    const structuredData = [];
    let currentSection = null;
    let currentQuestion = null;
  
    // Process each row in the parsed data
    parsedData.forEach(row => {
        const [key, value] = row.map(d => d.trim());

        if (key && value === undefined) {         // if the row is [string], then it's the title of a section
            if (currentSection) {           // it's the one object created in the prec. forEach 
                structuredData.push(currentSection);
            }
            currentSection = { section: key, questions: [], extraData: []};
            currentQuestion = null;
        } 
        else if (key && value!==undefined) {        // if the row is [string, string]
            if (currentSection) {
                if(value==="") {            // if the row is [string, ""], then it's a question which has multiple answers
                    currentSection.questions.push({
                        question: key,
                        answers: []
                    });
                    currentQuestion = key;
                }
                else {  // the row is [string, string]
                    const foundQuestion = currentSection.questions.find( d => d.question === currentQuestion ); 
                    if(foundQuestion && !key.includes("(%)") && !key.includes("(medie") && !key.includes("(rapporto")){      // the row is one of the answer of the currentQuestion
                        foundQuestion.answers.push({
                            answer: key,
                            value: parseFloat(value==="-" ? 0 : value.replace(',', '.'))
                        });
                    }
                    else {
                        currentSection.extraData.push({
                            data: key,
                            value: parseFloat(value==="-" ? 0 : value.replace(',', '.'))
                        });
                    }
                }
            }
        }
    });

    // Push the last section if any
    if (currentSection) {
        structuredData.push(currentSection);
    }

    return structuredData
}