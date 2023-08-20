import * as utils from '../utils/utils.js';

import { scriptConfig } from './script.js';

export class ScriptChecker {

    static check(script) {
        script.every(step => step.every(subStep => {
            if (type == 'clearResult') {
                ScriptChecker.checkClearResult(subStep);
                return;
            }
            if (type == 'tgMsg') {
                ScriptChecker.checkTgMsg(subStep);
                return;
            }
            ScriptChecker.checkCommonProperties(subStep);
            const type = subStep.type;
            if (type == 'event') {
                ScriptChecker.checkEvent(subStep);
            } else if (type == 'rFunc') {
                ScriptChecker.checkRFunc(subStep);
            } else if (type == 'wFunc') {
                ScriptChecker.checkWFunc(subStep);
            } else if (type == 'pendingTx') {
                ScriptChecker.checkPendingExecutedTx(subStep);
            } else if (type == 'executedTx') {
                ScriptChecker.checkPendingExecutedTx(subStep);
            }
        }))
    }

    static checkProperties(emptyObjects, arrayObjects) {
        if (emptyObjects != null) {
            for (const [key, value] of Object.entries(emptyObjects)) {
                if (utils.isEmptyObj(value)) 
                    throw key + ' property is empty';
            }
        }
        if (arrayObjects != null) {
            for (const [key, value] of Object.entries(arrayObjects)) {
                if (!value instanceof Array) throw key + ' property is not Array';
            } 
        }
    }

    static checkCommonProperties(subStep) {
        ScriptChecker.checkProperties({type: subStep.type, chainId: subStep.chainId, name: subStep.name, to: subStep.to}, {result: subStep.result});
        if (!utils.isEmptyObj(subStep.signature)) {
            if (subStep.to.split(',') > 1) throw 'to property has too many addresses';
        }
    }

    static checkClearResult(subStep) {
        ScriptChecker.checkProperties({type: subStep.type}, {indexList: subStep.indexList});
        ScriptChecker.checkDependence(subStep);
    }

    static checkTgMsg(subStep) {
        
    }

    static checkDependence(subStep) {
        if (!utils.isEmptyObj(subStep.dependencies)) {
            ScriptChecker.checkProperties({logic: subStep.dependencies.logic, conditions: subStep.dependencies.conditions}, {conditions: subStep.dependencies.conditions});
            if ('and/or'.indexOf(subStep.dependencies.logic) == -1) throw 'the value of logic property is invalid';
            const length = subStep.dependencies.conditions.length;
            for (var i = 0; i < length; i++) {
                const condition = subStep.dependencies.conditions[i];
                ScriptChecker.checkProperties({index: condition.index, subIndex: condition.subIndex});
                const dependentSubStep = this.scriptConfig[condition.index][condition.subIndex];
                if (dependentSubStep.type == 'event' || dependentSubStep.type == 'rFunc') {
                    ScriptChecker.checkProperties({dependentCondition: condition.dependentCondition}, {dependentCondition: condition.dependentCondition});
                    condition.dependentCondition.map(subCondition => {
                        ScriptChecker.checkProperties({paraName: subCondition.paraName}, {paraIndex: subCondition.paraIndex}, {compareType: subCondition.compareType}, {compareValue: subCondition.compareValue});
                        if ('eq/lt/gt/lte/gte/between/include/includedBy'.indexOf(subCondition.compareType) == -1) throw 'the value of compareType property is invalid';
                    })
                } else if (dependentSubStep.type == 'wFunc') {
                    ScriptChecker.checkProperties({dependentCondition: condition.dependentCondition}, {dependentCondition: condition.dependentCondition});
                    condition.dependentCondition.map(subCondition => {
                        ScriptChecker.checkProperties({status: subCondition.status});
                    })
                }
            }
        }
    }

    static checkInputValue(subStep) {
        if (!utils.isEmptyObj(subStep.parameters)) {
            ScriptChecker.checkProperties(null, {parameters: subStep.parameters});
            subStep.parameters.map(parameter => {
                if (parameter.index == null || parameter.subIndex == null) {
                    ScriptChecker.checkProperties({paraName: parameter.paraName, value: parameter.value});
                } else {
                    ScriptChecker.checkProperties({index: parameter.index, subIndex: parameter.subIndex, 
                                     paraName: parameter.paraName, referenceParaName: parameter.referenceParaName});
                    if (!utils.isEmptyObj(parameter.op)) {
                        if (parameter.op.length != 1 || '+-*/%'.indexOf(parameter.op) == -1) throw 'value of op is invalid';
                        ScriptChecker.checkProperties({externalValue: parameter.externalValue});
                    }
                    const refSubStep = this.scriptConfig[parameter.index][parameter.subIndex];
                    if (refSubStep.type == 'rFunc' || refSubStep.type == 'pendingTx' || refSubStep.type == 'executedTx') {
                        ScriptChecker.checkProperties({referenceParaIndex: parameter.referenceParaIndex});
                    }
                    if (refSubStep.type == 'pendingTx' || refSubStep.type == 'executedTx') {
                        ScriptChecker.checkProperties({referenceType: parameter.referenceType});
                        if ('from/to/value/gasPrice/paramter'.indexOf(parameter.referenceType) == -1) throw 'value of referenceType is invalid';
                    }
                }
            })
        }
    }

    static checkEvent(subStep) {
        ScriptChecker.checkProperties({filter: subStep.filter});
    }

    static checkRFunc(subStep) {
        ScriptChecker.checkDependence(subStep);
        ScriptChecker.checkInputValue(subStep);
    }

    static checkWFunc(subStep) {
        ScriptChecker.checkDependence(subStep);

        ScriptChecker.checkProperties({gasPriceType: subStep.gasPriceType, value: subStep.value});
        if ('fivePercent/tenPercent/twentyPercent/constant'.indexOf(subStep.gasPriceType) == -1) throw 'the value of gasPriceType property is invalid';
        if (subStep.gasPriceType == 'constant') {
            ScriptChecker.checkProperties({maxFeePerGas: subStep.maxFeePerGas});
        }

        ScriptChecker.checkInputValue(subStep);
    }

    static checkPendingExecutedTx(subStep) {
        ScriptChecker.checkProperties({valueCondition: subStep.valueCondition, parameterCondition: subStep.parameterCondition});
    }
}

try {
    ScriptChecker.check(scriptConfig['1']);
    console.log('check pass!')
} catch (error) {
    console.log('check error:' + error);
}