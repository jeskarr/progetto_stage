import { Engine } from 'json-rules-engine';
import { getTypes, getObjective, getOrder, getOrganized, getMultipleObs, closeInput } from './inputManager.js'
import { dataset as data} from './sampleData.js'

function start(data) {
    console.log('**************************\nBenvenuto in Chart-Chooser\n**************************'+
        '\nRispondi alle seguenti domande per trovare il grafico che fa al tuo caso.\n\n');

    /**
     * Get facts
     */
    const { numVariablesNo, catVariablesNo } = getTypes(data);
    const invalidVariables = (numVariablesNo > 1 && catVariablesNo > 1) || (numVariablesNo < 1 && catVariablesNo < 1);

    const order = (numVariablesNo <= 1 || invalidVariables) ? null : getOrder();
    const organized = (catVariablesNo <= 1 || invalidVariables) ? null : getOrganized();

    const multipleObs = Promise.all([order, organized])
            .then((orderResult, organizedResult) => {
                if (catVariablesNo >= 1 && numVariablesNo >= 1 && 
                    !invalidVariables && organizedResult !== 'independent') {
                        return getMultipleObs();
                }
                else {
                    return null;
                }
            }) 

    const objective = (multipleObs && !invalidVariables) ? multipleObs.then(d => getObjective()) : closeInput();

    /**
     * Setup a new engine
     */
    const engine = new Engine([], { allowUndefinedFacts: true });

    /**
     * Rules: type of variables
     */
    const numUnivRule = {
        conditions: {
            all: [{
                fact: 'numVariablesNo',
                operator: 'equal',
                value: 1
            },
            {
                fact: 'catVariablesNo',
                operator: 'lessThan',
                value: 1
            }]
        },
        event: { type: 'numUniv' },
        priority: 20,
        onSuccess: function (event, almanac) {
            almanac.addFact('numUniv', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('numUniv', false)
        }
    }
    engine.addRule(numUnivRule)

    const numMultiRule = {
        conditions: {
            all: [{
                fact: 'numVariablesNo',
                operator: 'greaterThan',
                value: 1
            },
            {
                fact: 'catVariablesNo',
                operator: 'lessThan',
                value: 1
            }]
        },
        event: { type: 'numMulti' },
        priority: 20,
        onSuccess: async function (event, almanac) {
            almanac.addFact('numMulti', true)

            almanac.addFact('order', function () {
                return order;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('numMulti', false)
        }
    }
    engine.addRule(numMultiRule)

    const numMultiOrdRule = {
        conditions: {
            all: [{
                fact: 'numMulti',
                operator: 'equal',
                value: true
            }, {
                fact: 'order',
                operator: 'equal',
                value: true
            }]
        },
        event: { type: 'numMultiOrd' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('numMultiOrd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('numMultiOrd', false)
        }
    }
    engine.addRule(numMultiOrdRule)

    const numMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'numMulti',
                operator: 'equal',
                value: true
            }, {
                fact: 'order',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'numMultiUnord' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('numMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('numMultiUnord', false)
        }
    }
    engine.addRule(numMultiUnordRule)

    const catUnivRule = {
        conditions: {
            all: [{
                fact: 'catVariablesNo',
                operator: 'equal',
                value: 1
            },
            {
                fact: 'numVariablesNo',
                operator: 'lessThan',
                value: 1
            }]
        },
        event: { type: 'catUniv' },
        priority: 20,
        onSuccess: function (event, almanac) {
            almanac.addFact('catUniv', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('catUniv', false)
        }
    }
    engine.addRule(catUnivRule)


    const catMultiRule = {
        conditions: {
            all: [{
                fact: 'catVariablesNo',
                operator: 'greaterThan',
                value: 1
            },
            {
                fact: 'numVariablesNo',
                operator: 'lessThan',
                value: 1
            }]
        },
        event: { type: 'catMulti' },
        priority: 20,
        onSuccess: async function (event, almanac) {
            almanac.addFact('catMulti', true)

            almanac.addFact('organized', function () {
                return organized;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('catMulti', false)
        }
    }
    engine.addRule(catMultiRule)

    const catMultiNestRule = {
        conditions: {
            all: [{
                fact: 'catMulti',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'nested'
            }]
        },
        event: { type: 'catMultiNest' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('catMultiNest', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('catMultiNest', false)
        }
    }
    engine.addRule(catMultiNestRule)

    const catMultiSubRule = {
        conditions: {
            all: [{
                fact: 'catMulti',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'subgroup'
            }]
        },
        event: { type: 'catMultiSub' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('catMultiSub', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('catMultiSub', false)
        }
    }
    engine.addRule(catMultiSubRule)

    const catMultiIndRule = {
        conditions: {
            all: [{
                fact: 'catMulti',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'independent'
            }]
        },
        event: { type: 'catMultiInd' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('catMultiInd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('catMultiInd', false)
        }
    }
    engine.addRule(catMultiIndRule)

    const mixUnivRule = {
        conditions: {
            all: [{
                fact: 'numVariablesNo',
                operator: 'equal',
                value: 1
            },
            {
                fact: 'catVariablesNo',
                operator: 'equal',
                value: 1
            }]
        },
        event: { type: 'mixUniv' },
        priority: 20,
        onSuccess: async function (event, almanac) {
            almanac.addFact('mixUniv', true);

            almanac.addFact('multipleObs', function () {
                return multipleObs;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixUniv', false)
        }
    }
    engine.addRule(mixUnivRule)

    const mixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'mixUniv',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'mixUnivOneObs' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixUnivOneObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixUnivOneObs', false)
        }
    }
    engine.addRule(mixUnivOneObsRule)

    const mixUnivMoreObsRule = {
        conditions: {
            all: [{
                fact: 'mixUniv',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { type: 'mixUnivMoreObs' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixUnivMoreObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixUnivMoreObs', false)
        }
    }
    engine.addRule(mixUnivMoreObsRule)

    const mixMultiNumRule = {
        conditions: {
            all: [{
                fact: 'numVariablesNo',
                operator: 'greaterThan',
                value: 1
            },
            {
                fact: 'catVariablesNo',
                operator: 'equal',
                value: 1
            }]
        },
        event: { type: 'mixMultiNum' },
        priority: 20,
        onSuccess: async function (event, almanac) {
            almanac.addFact('mixMultiNum', true);

            almanac.addFact('multipleObs', function () {
                return multipleObs;
            });

            almanac.addFact('order', function () {
                return order;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiNum', false)
        }
    }
    engine.addRule(mixMultiNumRule)

    const mixMultiNumOrdRule = {
        conditions: {
            all: [{
                fact: 'mixMultiNum',
                operator: 'equal',
                value: true
            },
            {
                fact: 'order',
                operator: 'equal',
                value: true
            }]
        },
        event: { type: 'mixMultiNumOrd' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiNumOrd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiNumOrd', false)
        }
    }
    engine.addRule(mixMultiNumOrdRule)

    const mixMultiNumUnordRule = {
        conditions: {
            all: [{
                fact: 'mixMultiNum',
                operator: 'equal',
                value: true
            },
            {
                fact: 'order',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'mixMultiNumUnord' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiNumUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiNumUnord', false)
        }
    }
    engine.addRule(mixMultiNumUnordRule)

    const mixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'mixMultiNum',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'mixMultiNumOneObs' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiNumOneObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiNumOneObs', false)
        }
    }
    engine.addRule(mixMultiNumOneObsRule)

    const mixMultiCatRule = {
        conditions: {
            all: [{
                fact: 'numVariablesNo',
                operator: 'equal',
                value: 1
            },
            {
                fact: 'catVariablesNo',
                operator: 'greaterThan',
                value: 1
            }]
        },
        event: { type: 'mixMultiCat' },
        priority: 20,
        onSuccess: async function (event, almanac) {
            almanac.addFact('mixMultiCat', true)

            almanac.addFact('organized', function () {
                return organized;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCat', false)
        }
    }
    engine.addRule(mixMultiCatRule)

    const mixMultiCatNestRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCat',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'nested'
            }]
        },
        event: { type: 'mixMultiCatNest' },
        priority: 15,
        onSuccess: async function (event, almanac) {
            almanac.addFact('mixMultiCatNest', true);

            almanac.addFact('multipleObs', function () {
                return multipleObs;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatNest', false)
        }
    }
    engine.addRule(mixMultiCatNestRule)

    const mixMultiCatNestOneObsRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCatNest',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'mixMultiCatNestOneObs' },
        priority: 10,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiCatNestOneObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatNestOneObs', false)
        }
    }
    engine.addRule(mixMultiCatNestOneObsRule)

    const mixMultiCatNestMoreObsRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCatNest',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { type: 'mixMultiCatNestMoreObs' },
        priority: 10,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiCatNestMoreObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatNestMoreObs', false)
        }
    }
    engine.addRule(mixMultiCatNestMoreObsRule)

    const mixMultiCatSubRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCat',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'subgroup'
            }]
        },
        event: { type: 'mixMultiCatSub' },
        priority: 15,
        onSuccess: async function (event, almanac) {
            almanac.addFact('mixMultiCatSub', true)

            almanac.addFact('multipleObs', function () {
                return multipleObs;
            });
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatSub', false)
        }
    }
    engine.addRule(mixMultiCatSubRule)

    const mixMultiCatSubOneObsRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCatSub',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: false
            }]
        },
        event: { type: 'mixMultiCatSubOneObs' },
        priority: 10,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiCatSubOneObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatSubOneObs', false)
        }
    }
    engine.addRule(mixMultiCatSubOneObsRule)

    const mixMultiCatSubMoreObsRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCatSub',
                operator: 'equal',
                value: true
            },
            {
                fact: 'multipleObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { type: 'mixMultiCatSubMoreObs' },
        priority: 10,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiCatSubMoreObs', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatSubMoreObs', false)
        }
    }
    engine.addRule(mixMultiCatSubMoreObsRule)

    const mixMultiCatIndRule = {
        conditions: {
            all: [{
                fact: 'mixMultiCat',
                operator: 'equal',
                value: true
            },
            {
                fact: 'organized',
                operator: 'equal',
                value: 'independent'
            }]
        },
        event: { type: 'mixMultiCatInd' },
        priority: 15,
        onSuccess: function (event, almanac) {
            almanac.addFact('mixMultiCatInd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('mixMultiCatInd', false)
        }
    }
    engine.addRule(mixMultiCatIndRule)

    /**
     * Rules: check if objective is defined
     */
    const checkObjectiveRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: undefined
            }]
        },
        event: { 
            type: 'checkObjective',
        },
        priority: 7,
        onSuccess: async function (event, almanac) {
            almanac.addFact('objective', function () {
                return objective;
            });
        },
    }
    engine.addRule(checkObjectiveRule)


    /**
     * Rules: Deviation 
     */
    const deviationNumUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 1
            }, {
                fact: 'numUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'deviationNumUniv',
            params: {
                charts: ['Diverging Bar', 'Diverging Area Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(deviationNumUnivRule)

    const deviationNumMultiOrdRule = {
        conditions: {
            all: [{
                    fact: 'objective',
                    operator: 'equal',
                    value: 1
                }, {
                    fact: 'numMultiOrd',
                    operator: 'equal',
                    value: true
                }
            ]
        },
        event: { 
            type: 'deviationNumMultiOrd',
            params: {
                charts: ['Diverging Stacked Bar', 'Butterfly Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(deviationNumMultiOrdRule)

    const deviationMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                    fact: 'objective',
                    operator: 'equal',
                    value: 1
                }, {
                    fact: 'mixMultiNumOneObs',
                    operator: 'equal',
                    value: true
                }
            ]
        },
        event: { 
            type: 'deviationMixMultiNumOneObs',
            params: {
                charts: ['Diverging Stacked Bar']
            } 
        },
        priority: 5,
    }
    engine.addRule(deviationMixMultiNumOneObsRule)


    /**
     * Rules: Correlation 
     */
    const correlationNumMultiOrdRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 2
            }, {
                fact: 'numMultiOrd',
                operator: 'equal',
                value: true
            },]
        },
        event: { 
            type: 'correlationNumMultiOrd',
            params: {
                charts: ['Connected Scatterplot']
            } 
        },
        priority: 5,
    }
    engine.addRule(correlationNumMultiOrdRule)

    const correlationNumMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 2
            }, {
                fact: 'numMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'correlationNumMultiUnord',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('correlationNumMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('correlationNumMultiUnord', false)
        }
    }
    engine.addRule(correlationNumMultiUnordRule)

    const correlationNumTwoVarUnordRule = {
        conditions: {
            all: [{
                fact: 'correlationNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'greaterThanInclusive',
                value: 2
            }]
        },
        event: { 
            type: 'correlationNumTwoVarUnord',
            params: {
                charts: ['Scatterplot']
            } 
        },
        priority: 2,
    }
    engine.addRule(correlationNumTwoVarUnordRule)

    const correlationNumThreeVarUnordRule = {
        conditions: {
            all: [{
                fact: 'correlationNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'greaterThanInclusive',
                value: 3
            }]
        },
        event: { 
            type: 'correlationNumThreeVarUnord',
            params: {
                charts: ['Bubble Chart']
            } 
        },
        priority: 2,
    }
    engine.addRule(correlationNumThreeVarUnordRule)

    const correlationNumLotsVarUnordRule = {
        conditions: {
            all: [{
                fact: 'correlationNumMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'correlationNumLotsVarUnord',
            params: {
                charts: ['Correlogram', 'Line+Column Chart']
            } 
        },
        priority: 1,
    }
    engine.addRule(correlationNumLotsVarUnordRule)

    const correlationMixMultiNumOrdRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 2
            }, {
                fact: 'mixMultiNumOrd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'correlationMixMultiNumOrd',
            params: {
                charts: ['Connected Scatterplot']
            } 
        },
        priority: 5
    }
    engine.addRule(correlationMixMultiNumOrdRule)

    const correlationMixMultiNumUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 2
            }, {
                fact: 'mixMultiNumUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'correlationMixMultiNumUnord',
            params: {
                charts: ['Correlogram', 'Grouped Scatterplot']
            } 
        },
        priority: 5
    }
    engine.addRule(correlationMixMultiNumUnordRule)

    const correlationMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 2
            }, {
                fact: 'mixMultiNumOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'correlationMixMultiNumOneObs',
            params: {
                charts: ['Grouped Scatterplot']
            } 
        },
        priority: 5
    }
    engine.addRule(correlationMixMultiNumOneObsRule)


    /**
     * Rules: Ranking 
     */
    const rankingNumMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'numMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingNumMultiUnord',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('rankingNumMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('rankingNumMultiUnord', false)
        }
    }
    engine.addRule(rankingNumMultiUnordRule)

    const rankingNumThreeVarUnordRule = {
        conditions: {
            all: [{
                fact: 'rankingNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'greaterThanInclusive',
                value: 3
            }]
        },
        event: { 
            type: 'rankingNumThreeVarUnord',
            params: {
                charts: ['Bubble Chart']
            } 
        },
        priority: 2,
    }
    engine.addRule(rankingNumThreeVarUnordRule)

    const rankingCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingCatUniv',
            params: {
                charts: ['Ordered Bar', 'Ordered Column', 'Lollipop Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(rankingCatUnivRule)

    const rankingCatMultiIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'catMultiInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingCatMultiInd',
            params: {
                charts: ['Slope Chart']
            }
        },
        priority: 5,
    }
    engine.addRule(rankingCatMultiIndRule)

    const rankingMixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'mixUnivOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingMixUnivOneObs',
            params: {
                charts: ['Ordered Bar', 'Ordered Column', 'Lollipop Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(rankingMixUnivOneObsRule)

    const rankingMixUnivMoreObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'mixUnivMoreObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingMixUnivMoreObs',
            params: {
                charts: ['Dot Strip Plot']
            } 
        },
        priority: 5,
    }
    engine.addRule(rankingMixUnivMoreObsRule)

    const rankingMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 3
            }, {
                fact: 'mixMultiNumOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'rankingMixMultiNumOneObs',
            params: {
                charts: ['Slope Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(rankingMixMultiNumOneObsRule)

    /**
     * Rules: Distribution
     */
    const distributionNumUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            }, {
                fact: 'numUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionNumUniv',
            params: {
                charts: ['Histogram', 'Density Plot', 'Cumulative curve']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionNumUnivRule)

    const distributionNumMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            }, {
                fact: 'numMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionNumMultiUnord', 
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('distributionNumMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('distributionNumMultiUnord', false)
        }
    }
    engine.addRule(distributionNumMultiUnordRule)

    const distributionNumTwoVarUnordRule = {
        conditions: {
            all: [{
                fact: 'distributionNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'greaterThanInclusive',
                value: 2
            }]
        },
        event: { 
            type: 'distributionNumTwoVarUnord',
            params: {
                charts: ['Histogram', '2D Density Plot']
            } 
        },
        priority: 2,
    }
    engine.addRule(distributionNumTwoVarUnordRule)

    const distributionNumLotsVarUnordRule = {
        conditions: {
            all: [{
                fact: 'distributionNumMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionNumLotsVarUnord',
            params: {
                charts: ['Boxplot', 'Violin Plot', 'Ridgeline', 'Dot Strip Plot']
            } 
        },
        priority: 1,
    }
    engine.addRule(distributionNumLotsVarUnordRule)

    const distributionMixUnivMoreObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            }, {
                fact: 'mixUnivMoreObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionMixUnivMoreObs',
            params: {
                charts: ['Histogram', 'Density Plot', 'Cumulative curve', 'Ridgeline', 'Boxplot', 'Violin Plot']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionMixUnivMoreObsRule)

    const distributionMixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            },  {
                fact: 'mixUnivOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionMixUnivOneObs',
            params: {
                charts: ['Histogram']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionMixUnivOneObsRule)

    const distributionMixMultiNumUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            },  {
                fact: 'mixMultiNumUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionMixMultiNumUnord',
            params: {
                charts: ['Boxplot', 'Violin Plot', '2D Density Plot']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionMixMultiNumUnordRule)

    const distributionMixMultiCatNestMoreObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            }, {
                fact: 'mixMultiCatNestMoreObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionMixMultiCatNestMoreObs',
            params: {
                charts: ['Boxplot', 'Violin Plot']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionMixMultiCatNestMoreObsRule)

    const distributionMixMultiCatSubMoreObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 4
            }, {
                fact: 'mixMultiCatSubMoreObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'distributionMixMultiCatSubMoreObs',
            params: {
                charts: ['Boxplot', 'Violin Plot']
            } 
        },
        priority: 5,
    }
    engine.addRule(distributionMixMultiCatSubMoreObsRule)

    /**
     * Rules: Change Over time
     */
    const timeNumUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'numUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeNumUniv',
            params: {
                charts: ['Calendar Heatmap', 'Seismogram']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeNumUnivRule)

    const timeNumMultiOrdRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'numMultiOrd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeNumMultiOrd',
            params: {
                charts: ['Connected Scatterplot', 'Area Chart', 'Line Chart', 'Line+Column Chart', 
                    'Column Chart', 'Lollipop Chart', 'Fan Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeNumMultiOrdRule)

    const timeCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeCatUniv',
            params: {
                charts: ['Priestley Timeline']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeCatUnivRule)

    const timeCatMultiIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'catMultiInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeCatMultiInd',
            params: {
                charts: ['Slope Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeCatMultiIndRule)

    const timeMixUnivMoreObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'mixUnivMoreObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeMixUnivMoreObs',
            params: {
                charts: ['Circle Timeline']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeMixUnivMoreObsRule)

    const timeMixMultiNumOrdRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'mixMultiNumOrd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeMixMultiNumOrd',
            params: {
                charts: ['Fan Chart', 'Connected Scatterplot', 'Line Chart', 
                    'Stacked Area Chart', 'Stream Graph'      
                ]
            } 
        },
        priority: 5,
    }
    engine.addRule(timeMixMultiNumOrdRule)

    const timeMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 5
            }, {
                fact: 'mixMultiNumOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'timeMixMultiNumOneObs',
            params: {
                charts: ['Slope Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(timeMixMultiNumOneObsRule)

    /**
     * Rules: Composition
     */
    const compositionCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionCatUniv',
            params: {
                charts: ['Pie Chart', 'Donut Chart', 'Waterfall', 'Waffle Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionCatUnivRule)

    const compositionCatMultiIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'catMultiInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionCatMultiInd',
            params: {
                charts: ['Venn Diagram']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionCatMultiIndRule)

    const compositionCatMultiNestRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'catMultiNest',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionCatMultiNest',
            params: {
                charts: ['Treemap', 'Sunburst', 'Icicle', 'Dendogram', 'Circular Packing']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionCatMultiNestRule)

    const compositionCatMultiSubRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'catMultiSub',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionCatMultiSub',
            params: {
                charts: ['Stacked Column Chart', 'Stacked Bar Chart', 'Proportional Stacked Bar']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionCatMultiSubRule)

    const compositionMixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'mixUnivOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionMixUnivOneObs',
            params: {
                charts: ['Pie Chart', 'Donut Chart', 'Waterfall', 'Waffle Chart', 'Proportional Stacked Bar']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionMixUnivOneObsRule)

    const compositionMixMultiCatNestOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'mixMultiCatNestOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionMixMultiCatNestOneObs',
            params: {
                charts: ['Dendogram', 'Circular Packing', 'Treemap', 'Sunburst', 'Icicle']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionMixMultiCatNestOneObsRule)

    const compositionMixMultiCatSubOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 6
            }, {
                fact: 'mixMultiCatSubOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionMixMultiCatSubOneObs',
            params: {
                charts: ['Stacked Column Chart', 'Stacked Bar Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(compositionMixMultiCatSubOneObsRule)

    /**
     * Rules: Magnitude
     */
    const magnitudeNumMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'numMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'magnitudeNumMultiUnord',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('magnitudeNumMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('magnitudeNumMultiUnord', false)
        }
    }
    engine.addRule(magnitudeNumMultiUnordRule)

    const magnitudeNumThreeVarUnordRule = {
        conditions: {
            all: [{
                fact: 'magnitudeNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'greaterThanInclusive',
                value: 3
            }]
        },
        event: { 
            type: 'magnitudeNumThreeVarUnord',
            params: {
                charts: ['Bubble Chart']
            } 
        },
        priority: 2,
    }
    engine.addRule(magnitudeNumThreeVarUnordRule)

    const magnitudeCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'magnitudeCatUniv',
            params: {
                charts: ['Bar Chart', 'Column Chart', 'Lollipop Chart', 'Pictogram']
            } 
        },
        priority: 5,
    }
    engine.addRule(magnitudeCatUnivRule)

    const magnitudeCatMultiSubRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'catMultiSub',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'compositionCatMultiSub',
            params: {
                charts: ['Grouped Barplot', 'Proportional Stacked Bar']
            } 
        },
        priority: 5,
    }
    engine.addRule(magnitudeCatMultiSubRule)

    const magnitudeMixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'mixUnivOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'magnitudeMixUnivOneObs',
            params: {
                charts: ['Bar Chart', 'Column Chart', 'Lollipop Chart', 
                    'Word Cloud', 'Pictogram', 'Proportional Stacked Bar']
            } 
        },
        priority: 5,
    }
    engine.addRule(magnitudeMixUnivOneObsRule)

    const magnitudeMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'mixMultiNumOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'magnitudeMixMultiNumOneObs',
            params: {
                charts: ['Grouped Barplot', 'Radar Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(magnitudeMixMultiNumOneObsRule)

    const magnitudeMixMultiCatSubOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 7
            }, {
                fact: 'mixMultiCatSubOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'magnitudeMixMultiCatSubOneObs',
            params: {
                charts: ['Grouped Barplot', 'Stacked Bar Chart']
            } 
        },
        priority: 5,
    }
    engine.addRule(magnitudeMixMultiCatSubOneObsRule)

    /**
     * Rules: Spatial
     */
    const spatialNumMultiUnordRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 8
            }, {
                fact: 'numMultiUnord',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'spatialNumMultiUnord',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('spatialNumMultiUnord', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('spatialNumMultiUnord', false)
        }
    }
    engine.addRule(spatialNumMultiUnordRule)

    const spatialNumTwoVarUnordRule = {
        conditions: {
            all: [{
                fact: 'spatialNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'equal',
                value: 2
            }]
        },
        event: { 
            type: 'spatialNumTwoVarUnord',
            params: {
                charts: ['Dot Density']
            } 
        },
        priority: 2,
    }
    engine.addRule(spatialNumTwoVarUnordRule)

    const spatialNumThreeVarUnordRule = {
        conditions: {
            all: [{
                fact: 'spatialNumMultiUnord',
                operator: 'equal',
                value: true
            }, {
                fact: 'numVariablesNo',
                operator: 'equal',
                value: 3
            }]
        },
        event: { 
            type: 'spatialNumThreeVarUnord',
            params: {
                charts: ['Proportional Symbol']
            } 
        },
        priority: 2,
    }
    engine.addRule(spatialNumThreeVarUnordRule)

    const spatialNumFourFiveVarUnordRule = {
        conditions: {
            all: [{
                fact: 'spatialNumMultiUnord',
                operator: 'equal',
                value: true
            }, {any: [{
                    fact: 'numVariablesNo',
                    operator: 'equal',
                    value: 4
                }, {
                    fact: 'numVariablesNo',
                    operator: 'equal',
                    value: 5
                }]
            }]
        },
        event: { 
            type: 'spatialNumFourFiveVarUnord',
            params: {
                charts: ['Flow Map']
            } 
        },
        priority: 2,
    }
    engine.addRule(spatialNumFourFiveVarUnordRule)

    const spatialCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 8
            },  {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'spatialCatUniv',
            params: {
                charts: ['Basic Choropleth', 'Equalized Cartogram', 'Contour Map', 'Scaled Cartogram']
            } 
        },
        priority: 5,
    }
    engine.addRule(spatialCatUnivRule)

    const spatialCatMultiIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 8
            },  {
                fact: 'catMultiInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'spatialCatMultiInd',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('spatialCatMultiInd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('spatialCatMultiInd', false)
        }
    }
    engine.addRule(spatialCatMultiIndRule)

    const spatialCatTwoVarIndRule = {
        conditions: {
            all: [{
                fact: 'spatialCatMultiInd',
                operator: 'equal',
                value: true
            }, {
                fact: 'catVariablesNo',
                operator: 'greaterThanInclusive',
                value: 2
            }]
        },
        event: { 
            type: 'spatialCatTwoVarInd',
            params: {
                charts: ['Flow Map']
            } 
        },
        priority: 2,
    }
    engine.addRule(spatialCatTwoVarIndRule)

    const spatialMixUnivOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 8
            },  {
                fact: 'mixUnivOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'spatialMixUnivOneObs',
            params: {
                charts: ['Basic Choropleth', 'Equalized Cartogram', 'Contour Map', 'Scaled Cartogram']
            } 
        },
        priority: 5,
    }
    engine.addRule(spatialMixUnivOneObsRule)

    const spatialMixMultiCatIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 8
            },  {
                fact: 'mixMultiCatInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'spatialMixMultiCatInd',
        },
        priority: 5,
        onSuccess: function (event, almanac) {
            almanac.addFact('spatialMixMultiCatInd', true)
        },
        onFailure: function (event, almanac) {
            almanac.addFact('spatialMixMultiCatInd', false)
        }
    }
    engine.addRule(spatialMixMultiCatIndRule)

    const spatialMixTwoCatIndRule = {
        conditions: {
            all: [{
                fact: 'spatialMixMultiCatInd',
                operator: 'equal',
                value: true
            },  {
                fact: 'catVariablesNo',
                operator: 'equal',
                value: 2
            }]
        },
        event: { 
            type: 'spatialMixTwoCatInd',
            params: {
                charts: ['Flow Map']
            }
        },
        priority: 2,
    }
    engine.addRule(spatialMixTwoCatIndRule)

    /**
     * Rules: Flow
     */
    const flowCatUnivRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'catUniv',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowCatUniv',
            params: {
                charts: ['Waterfall']
            } 
        },
        priority: 5,
    }
    engine.addRule(flowCatUnivRule)

    const flowCatMultiIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'catMultiInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowCatMultiInd',
            params: {
                charts: ['Heatmap', 'Sankey Diagram', 'Network Diagram',
                    'Chord Diagram', 'Arc Diagram'
                ]
            } 
        },
        priority: 5,
    }
    engine.addRule(flowCatMultiIndRule)

    const flowCatMultiSubRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'catMultiSub',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowCatMultiSub',
            params: {
                charts: ['Heatmap', 'Sankey Diagram']
            } 
        },
        priority: 5,
    }
    engine.addRule(flowCatMultiSubRule)

    const flowMixMultiNumOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'mixMultiNumOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowMixMultiNumOneObs',
            params: {
                charts: ['Sankey Diagram']
            } 
        },
        priority: 5,
    }
    engine.addRule(flowMixMultiNumOneObsRule)

    const flowMixMultiCatSubOneObsRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'mixMultiCatSubOneObs',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowMixMultiCatSubOneObs',
            params: {
                charts: ['Sankey Diagram', 'Heatmap']
            } 
        },
        priority: 5,
    }
    engine.addRule(flowMixMultiCatSubOneObsRule)

    const flowMixMultiCatIndRule = {
        conditions: {
            all: [{
                fact: 'objective',
                operator: 'equal',
                value: 9
            },  {
                fact: 'mixMultiCatInd',
                operator: 'equal',
                value: true
            }]
        },
        event: { 
            type: 'flowMixMultiCatInd',
            params: {
                charts: ['Heatmap', 'Sankey Diagram', 'Network Diagram',
                    'Chord Diagram', 'Arc Diagram'
                ]
            } 
        },
        priority: 5,
    }
    engine.addRule(flowMixMultiCatIndRule)


    /**
     * Facts
     * - objective      // from prompt, number from 1 to 9
     * - numVariablesNo
     * - catVariablesNo
     * - order      // for multivariate numerical variables (true if ordered, false if not), otherwise null
     * - organized      // for multivariate categorical variables (can be 'nested', 'subgroup', 'independent'), otherwise null
     * - multipleObs    // for mixed (if true there can be more obs per group, if false just one obs), otherwise null
     */
    let facts = {
        numVariablesNo: numVariablesNo,
        catVariablesNo: catVariablesNo
    }; 

    engine
        .run(facts)
        .then(({ events }) => {
            console.log('\nElaborazione terminata. Gli eventi emessi sono stati:\n', events.map(e => e.type));
            let eventsWithCharts = events.filter(e => e.params?.charts)
            console.log('Si consigliano dunque i seguenti grafici:\n', eventsWithCharts.map(e => e.params.charts));
        })

}

start(data);