import React, { FC, useEffect, useState } from 'react';
import {
    Button,
    Heading,
    Box,
    HStack,
    useToast,
    useDisclosure,    
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
  } from '@chakra-ui/react';
import { Typography, Space, Input, Modal, Form, Select, Tooltip, InputNumber, Card, Divider, DatePicker } from 'antd';
import { PlusCircleOutlined, SyncOutlined, EditOutlined, ExclamationCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined, PlusOutlined, MinusCircleOutlined, CaretDownOutlined } from '@ant-design/icons';
import moment from "moment";
import Web3 from 'web3';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import {arrayMoveImmutable} from 'array-move';
import { isEmptyObj } from 'utils/utils';
import { BroswerScan, getABIUrl, CEXInfo, evmChainIds } from 'utils/config';
import Converter from 'scriptEngine/Converter';
import BinanceSymbols from 'asset/BinanceAssetList.json';
import BinancePairs from 'asset/BinancePairs.json';
import { useRouter } from 'next/router';
import { useWeb3React } from "@web3-react/core";

import { ETHLogo, BSCLogo, AvaxLogo, PolygonLogo, ArbitrumLogo, OptimismLogo } from 'utils/chainLogos';
import { NamePath } from 'antd/es/form/interface';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const ScriptEditor: FC = () => {
    const { account } = useWeb3React();
    const router = useRouter();
    
    const [accountList, setAccountList] = useState<string[]>([]);
    const [mmAccounts, setMMAccounts] = useState<string[]>(!isEmptyObj(account) ? [account] : []);
    const [web3, setWeb3] = useState(new Web3());
    const [evmChainInfo, setEvmChainInfo] = useState(evmChainIds);
    const [contractABIInfo, setContractABIInfo] = useState({});
    const [scriptList, setScriptList] = useState([]);
    const [script, setScript] = useState({name: '', subScripts: {}});
    const [keyLoading, setKeyLoading] = useState(false);
    const [configChainContractVisible, setConfigChainContractVisible] = useState(false);
    const [chainContractConfig, setChainContractConfig] = useState({title: ''});
    const [eventConfig, setEventConfig] = useState({});
    const [txMonitorConfig, setTxMonitorConfig] = useState({});
    const [functionSelectedConfig, setFunctionSelectedConfig] = useState({});
    const [dependencyConfig, setDependencyConfig] = useState({});
    const [leftConfig, setLeftConfig] = useState({});
    const [rCexConfig, setRCexConfig] = useState({title: ''});
    const [rWeb2Config, setRWeb2Config] = useState({title: ''});
    const [tgMsgConfig, setTgMsgConfig] = useState({title: ''});
    const [clearResultConfig, setClearResultConfig] = useState({title: ''});
    const [stopScriptConfig, setStopScriptConfig] = useState({});
    const [modalTitle, setModalTitle] = useState('');
    const [currentScriptType, setCurrentScriptType] = useState('');
    const [addEventMonitorVisible, setAddEventMonitorVisible] = useState(false);
    const [addTxMonitorVisible, setAddTxMonitorVisible] = useState(false);
    const [selectFunctionInContractVisible, setSelectFunctionInContractVisible] = useState(false);
    const [newChainVisible, setNewChainVisible] = useState(false);
    const [readCEXVisible, setReadCEXVisible] = useState(false);
    const [readWeb2Visible, setReadWeb2Visible] = useState(false);
    const [sendTGMsgVisible, setSendTGMsgVisible] = useState(false);
    const [clearResultVisible, setClearResultVisible] = useState(false);
    const [stopScriptVisible, setStopScriptVisible] = useState(false);
    const [importABIVisible, setImportABIVisible] = useState(false);
    const [leftConfigVisible, setLeftConfigVisible] = useState(false);
    const [dependencyConfigVisible, setDependencyConfigVisible] = useState(false);
    const [curStep, SetCurStep] = useState(1);
    const [totalStep, SetTotalStep] = useState(0);
    const [dependencyLength, setDependencyLength] = useState(0);
    const [initialValuesOfChainContract, setInitialValuesOfChainContract] = useState({});
    const [initialValuesOfEvent, setInitialValuesOfEvent] = useState({});
    const [initialValuesOfTxMonitor, setInitialValuesOfTxMonitor] = useState({});
    const [initialValuesOfFunctionSelected, setInitialValuesOfFunctionSelected] = useState({});
    const [initialValuesOfDependency, setInitialValuesOfDependency] = useState({});
    const [initialValuesOfLeftConfig, setInitialValuesOfLeftConfig] = useState({});
    const [initialValuesOfReadCEXConfig, setInitialValuesOfReadCEXConfig] = useState({});
    const [initialValuesOfReadWeb2Config, setInitialValuesOfReadWeb2Config] = useState({});
    const [initialValuesOfTgMsgConfig, setInitialValuesOfTgMsgConfig] = useState({});
    const [initialValuesOfClearResult, setInitialValuesOfClearResult] = useState({});
    const [initialValuesOfStopScript, setInitialValuesOfStopScript] = useState({});
    const [modifyScript, setModifyScript] = useState(false);
    const [curModifiedTitle, setCurModifiedTitle] = useState('');
    const [curScriptName, setCurScriptName] = useState('');
    const [scriptTitles, setScriptTitles] = useState<string[]>([]);
    const [binanceSpots, setBinanceSpots] = useState([]);
    const [okexSpots, setOkexSpots] = useState([]);
    const [ftxSpots, setFtxSpots] = useState([]);
    const [currentPrice, setCurrentPrice] = useState('');
    
    const logoMap = {1: <ETHLogo />, 43113: <AvaxLogo />, 137: <PolygonLogo />, 56: <BSCLogo />}

    const [chainContractForm] = Form.useForm();
    const [eventMonitorForm] = Form.useForm();
    const [pendingTxMonitorForm] = Form.useForm();
    const [addNewChainForm] = Form.useForm();
    const [functionSelectedForm] = Form.useForm();
    const [dependencyConfigForm] = Form.useForm();
    const [leftConfigForm] = Form.useForm();

    const [readCEXForm] = Form.useForm();
    const [readWeb2Form] = Form.useForm();
    const [sendTGMsgForm] = Form.useForm();
    const [clearResultForm] = Form.useForm();
    const [stopScriptForm] = Form.useForm();

    var importedABI = '';
    const converter = new Converter(script);

    const contractAddr = Form.useWatch('contractAddr', chainContractForm);
    const currentChain = Form.useWatch('chain', chainContractForm);
    const fromValueType = Form.useWatch(['from', 'valueType'], chainContractForm);
    const fromStep = Form.useWatch(['from', 'subscriptName'], chainContractForm);

    const pendingTxFunction = Form.useWatch('function', pendingTxMonitorForm);
    const readDataFunction = Form.useWatch('function', functionSelectedForm);
    const repeaTimes = Form.useWatch('repeaTimes', leftConfigForm);
    const whichCex = Form.useWatch('whichCex', readCEXForm);
    const requestType = Form.useWatch('requestType', readWeb2Form);
    //const tradingPair = Form.useWatch('tradingPair', readCEXForm);

    useEffect(() => {
        chainContractForm.resetFields();
        eventMonitorForm.resetFields();
        pendingTxMonitorForm.resetFields();
        functionSelectedForm.resetFields();
        dependencyConfigForm.resetFields();
        readCEXForm.resetFields();
        sendTGMsgForm.resetFields();
        leftConfigForm.resetFields();
        clearResultForm.resetFields();
        stopScriptForm.resetFields();
        readWeb2Form.resetFields();        
    }, [initialValuesOfChainContract, 
        initialValuesOfEvent, 
        initialValuesOfTxMonitor, 
        initialValuesOfFunctionSelected,
        initialValuesOfDependency,
        initialValuesOfLeftConfig,
        initialValuesOfReadCEXConfig,
        initialValuesOfTgMsgConfig,
        initialValuesOfClearResult,
        initialValuesOfStopScript,
        initialValuesOfReadWeb2Config,
        initialValuesOfReadWeb2Config]);

    useEffect(() => {
        let { scriptName } = router.query;
        if (isEmptyObj(scriptName)) {
            const index = router.asPath.indexOf('scriptName') + 'scriptName'.length + 1;
            scriptName = router.asPath.substring(index);
            scriptName = scriptName.replace("%20", " ");
        }
        setCurScriptName(scriptName);

        var contractABI: string | null | any = global.localStorage.getItem('contractABIInfo');
        if (isEmptyObj(contractABI)) {
            contractABI = '{}';
        }
        contractABI = JSON.parse(contractABI as string);
        setContractABIInfo(contractABI);

        var localAccountList: string | null = global.localStorage.getItem('accountList');
        if (isEmptyObj(localAccountList)) {
            localAccountList = '[]';
        }
        setAccountList(JSON.parse(localAccountList as string));

        var scripts: string | null | any = global.localStorage.getItem('scriptList');
        if (isEmptyObj(scripts)) {
            scripts = '[]';
        }
        scripts = JSON.parse(scripts as string);
        var tmpScript = scripts.filter((scriptObj: any) => scriptObj.name == scriptName);

        setScript(isEmptyObj(tmpScript) || tmpScript.length == 0 ? {} : tmpScript[0]);
        setScriptList(scripts);

        setScriptTitles(isEmptyObj(tmpScript?.executionOrder) ? [] : tmpScript.executionOrder);
    }, []);

    const save2LS = () => {
        if (JSON.stringify(script) == '{}' || isEmptyObj(script)) {
            console.log('no content in this script');
            return;
        }
        script.updatedTime = new Date().getTime();
        const index = scriptList.findIndex((item: any) => item.name == script.name);
        localStorage.setItem('scriptList', JSON.stringify([...scriptList.slice(0, index), script, ...scriptList.slice(index + 1)]));
    }

    const getPrice = (tradingPair: string) => {
        if (!isEmptyObj(whichCex) && !isEmptyObj(tradingPair)) {
            const priceUrl = CEXInfo[whichCex].baseUrl + CEXInfo[whichCex].priceUrl + tradingPair;
            console.log(priceUrl);
            fetch(priceUrl).then(resp => {
                resp.json().then(priceInfo => {
                    const tradingPairInfo = CEXInfo[whichCex].tradingPairs.filter((pair: any) => pair.symbol == tradingPair);
                    console.log(tradingPairInfo[0], priceInfo);
                    setCurrentPrice('1 ' + tradingPairInfo[0].baseCurrency + ' = ' + priceInfo.price + ' ' + tradingPairInfo[0].quoteCurrency);
                });
            })
            
        }
    }

    const SortableItem = SortableElement((initObj: any) => {
            initObj = JSON.parse(initObj.value);
            return <Card title={initObj.index + ': ' + initObj.value} style={{ width: 400}}>
                    {scriptTitles.length - 1 == initObj.index ? null : <CaretDownOutlined style={{ fontSize: '26px', color: '#08c' }} />}
                    </Card>
        });

    const SortableList = SortableContainer(({items}: {items: string[]}) => {
        return (
            <div className="container">
            {items?.map((value, index) => (
                <SortableItem key={`item-${value}`} index={index} value={JSON.stringify({value, index})} />
            ))}
            </div>
        );
    });

    const onSortEnd = ({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) => {
        const items = arrayMoveImmutable(scriptTitles, oldIndex, newIndex);
        setScriptTitles(items);
        script.executionOrder = items;
    };

    const updateScript = (currentValues: any) => {
        if (modifyScript && chainContractConfig.title != curModifiedTitle) {
            delete script['subScripts'][curModifiedTitle];
        }
        if (script['subScripts'] == null) {
            script['subScripts'] = {};
        }
        if (currentScriptType == 'event') {
            script['subScripts'][chainContractConfig.title] = {type: currentScriptType, chainContractConfig, eventConfig: currentValues}
        } else if (currentScriptType == 'pendingTx' || currentScriptType == 'executedTx') {
            script['subScripts'][chainContractConfig.title] = {type: currentScriptType, chainContractConfig, txMonitorConfig: currentValues}
        } else if (currentScriptType == 'rFunc') {
            script['subScripts'][chainContractConfig.title] = {type: currentScriptType, chainContractConfig, functionSelectedConfig, dependencyConfig: currentValues}
        } else if (currentScriptType == 'wFunc') {
            script['subScripts'][chainContractConfig.title] = {type: currentScriptType, chainContractConfig, functionSelectedConfig, dependencyConfig, leftConfig: currentValues}
        } else if (currentScriptType == 'rCex') {
            script['subScripts'][rCexConfig.title] = {type: currentScriptType, rCexConfig, dependencyConfig: currentValues}
        } else if (currentScriptType == 'tgMsg') {
            script['subScripts'][tgMsgConfig.title] = {type: currentScriptType, tgMsgConfig, dependencyConfig: currentValues}
        } else if (currentScriptType == 'clearResult') {
            script['subScripts'][clearResultConfig.title] = {type: currentScriptType, clearResultConfig, dependencyConfig: currentValues}
        } else if (currentScriptType == 'rWeb2') {
            script['subScripts'][rWeb2Config.title] = {type: currentScriptType, rWeb2Config, dependencyConfig: currentValues}
        }
        console.log(script);

        updateSubScriptTitles();
        save2LS();
    }

    const clearInitialValues = () => {
        setInitialValuesOfChainContract({});
        setInitialValuesOfEvent({});
        setInitialValuesOfFunctionSelected({});
        setInitialValuesOfTxMonitor({});
        setInitialValuesOfDependency({});
        setInitialValuesOfLeftConfig({});
        setTgMsgConfig({title: ''});
        setClearResultConfig({title: ''});
        setRCexConfig({title: ''});
        setRWeb2Config({title: ''});
    }

    const getSubScripts = () => {
        return isEmptyObj(script['subScripts']) ? {} : script['subScripts'];
    }

    const updateSubScriptTitles = () => {
        let curSubTitles = Object.entries(getSubScripts()).map(entry => {
                const subScript: any = entry[1];   
                if (subScript.type != 'event' && subScript.type != 'pendingTx' && subScript.type != 'executedTx')
                    return entry[0];
            }  
        ).filter(item => item != null);
        console.log(curSubTitles, scriptTitles);
        const newSubTitles = curSubTitles.filter((title: string) => !scriptTitles.includes(title));
        curSubTitles = scriptTitles.filter((title: string) => curSubTitles.includes(title)).concat(newSubTitles);
        setScriptTitles(curSubTitles);
        script.executionOrder = curSubTitles;
        console.log(script.executionOrder);
    }

    const getSubScript = (subScriptTitle: string) => {
        if (script['subScripts'] == null || script['subScripts'][subScriptTitle] == null)
            return null;
        return converter.convertSubScript(script['subScripts'][subScriptTitle]);
    }
    
    const handleChainContractOk = () => {
        chainContractForm.validateFields()
            .then(values => {
                console.log(values);
                setChainContractConfig(values);
                setConfigChainContractVisible(false);
                if (currentScriptType == 'event') {
                    SetCurStep(curStep + 1);
                    setAddEventMonitorVisible(true);
                    if (modifyScript) {
                        const initValues = JSON.parse(JSON.stringify(initialValuesOfEvent));
                        setInitialValuesOfEvent(initValues);
                    }
                } else if (currentScriptType == 'pendingTx' || currentScriptType == 'executedTx') {
                    SetCurStep(curStep + 1);
                    setAddTxMonitorVisible(true);
                    if (modifyScript) {
                        const initValues = JSON.parse(JSON.stringify(initialValuesOfTxMonitor));
                        setInitialValuesOfEvent(initValues);
                    }
                } else if (currentScriptType == 'rFunc' || currentScriptType == 'wFunc') {
                    SetCurStep(curStep + 1);
                    setSelectFunctionInContractVisible(true);
                    if (modifyScript) {
                        const initValues = JSON.parse(JSON.stringify(initialValuesOfFunctionSelected));
                        setInitialValuesOfEvent(initValues);
                    }
                }
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    }

    const handleEventMonitorOk = () => {
        eventMonitorForm.validateFields()
            .then(values => {
                console.log(values);
                setEventConfig(values);
                updateScript(values);
                setAddEventMonitorVisible(false);
                eventMonitorForm.resetFields();
                chainContractForm.resetFields();
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    }

    const handleTxMonitorOk = () => {
        pendingTxMonitorForm.validateFields()
            .then(values => {
                console.log('tx monitored data', values);
                setTxMonitorConfig(values);
                updateScript(values);
                pendingTxMonitorForm.resetFields();
                chainContractForm.resetFields();
                setAddTxMonitorVisible(false);
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    }

    const handleSelectFunctionOk = () => {
        functionSelectedForm.validateFields()
            .then(values => {
                console.log('function data', values);
                
                setFunctionSelectedConfig(values);
                setSelectFunctionInContractVisible(false); 
                setDependencyConfigVisible(true);
                SetCurStep(curStep + 1);

                if (modifyScript) {
                    const initValues = JSON.parse(JSON.stringify(initialValuesOfDependency));
                    setInitialValuesOfEvent(initValues);
                }
            })
    }

    const handleDependencyConfigOK = () => {        
        dependencyConfigForm.validateFields().then(values => {
            console.log('dependency data', values);
            setDependencyConfig(values);
            if (currentScriptType == 'wFunc') {
                setDependencyConfigVisible(false); 
                SetCurStep(curStep + 1);
                setLeftConfigVisible(true);
                if (modifyScript) {
                    const initValues = JSON.parse(JSON.stringify(initialValuesOfLeftConfig));
                    setInitialValuesOfEvent(initValues);
                }
            } else {
                setDependencyConfigVisible(false); 
                updateScript(values);
            }
        });
    }

    const handleLeftConfigOk = () => {
        leftConfigForm.validateFields()
            .then(values => {
                console.log('left config data', values);
                setLeftConfig(values);
                updateScript(values);
                setLeftConfigVisible(false);                
            });
    }

    const handleReadCEXOk = () => {
        readCEXForm.validateFields()
            .then(values => {
                console.log('rCex message', values);
                setRCexConfig(values);
                SetCurStep(curStep + 1);
                setDependencyConfigVisible(true);
                setReadCEXVisible(false);                
            });
    }

    const handleReadWeb2Ok = () => {
        readWeb2Form.validateFields()
            .then(values => {
                console.log('rWeb2 message', values);
                setRWeb2Config(values);
                SetCurStep(curStep + 1);
                setDependencyConfigVisible(true);
                setReadWeb2Visible(false);                
            });
    }

    const handleTGMsgOk = () => {
        sendTGMsgForm.validateFields()
            .then(values => {
                console.log('tg message', values);
                setTgMsgConfig(values);
                SetCurStep(curStep + 1);
                setDependencyConfigVisible(true);
                setSendTGMsgVisible(false);                
            });
    }

    const handleClearResultOk = () => {
        clearResultForm.validateFields()
            .then(values => {
                console.log('clear result message', values);
                setClearResultConfig(values);
                SetCurStep(curStep + 1);
                setDependencyConfigVisible(true);
                setClearResultVisible(false);                
            });
    }

    const handleStopScriptOk = () => {
        clearResultForm.validateFields()
            .then(values => {
                console.log('stop script message', values);
                setStopScriptConfig(values);
                SetCurStep(curStep + 1);
                setDependencyConfigVisible(true);
                setStopScriptVisible(false);                
            });
    }

    const addNewChain = () => {
        setNewChainVisible(true);
    }

    const syncABI = () => {
        if (BroswerScan[currentChain] == null) {
            Modal.warning({title: 'Warning', content: `No web service to get the ABI on this chain(id: ${currentChain}), please manually input the ABI`});
            return;
        }
        const getValidABIUrl = getABIUrl.replace('{scanUrl}', BroswerScan[currentChain].webUrl)
                                        .replace('{apiKey}', BroswerScan[currentChain].apiKey)
                                        .replace('{contractAddr}', contractAddr);
        console.log(getValidABIUrl);
        fetch(getValidABIUrl, {}).then(resp => {
            resp.json().then(abiInfo => {
              if (abiInfo.status === '1') {
                const contractAbi = JSON.parse(abiInfo.result);
                updateABIInfo(currentChain, contractAddr, contractAbi);
              } else {
                Modal.warning({title: 'Warning', content: 'Can NOT get ABI info from web service'})
              }
            });
          })
    }

    const updateABIInfo = (chain: number, contract: string, abiInfo: any) => {
        if (contractABIInfo[chain] == null) {
            contractABIInfo[chain] = {};
        }
        contractABIInfo[chain][contract] = abiInfo;
        localStorage.setItem('contractABIInfo', JSON.stringify(contractABIInfo));
        setContractABIInfo(JSON.parse(JSON.stringify(contractABIInfo)));
    }

    const importABIManually = () => {
        setImportABIVisible(true);
    }

    const isABIOK = (chain: number, contract: string) => {
        return chain != null && contractABIInfo[chain] != null && contractABIInfo[chain][contract] != null;
    }

    const handleAddNewChainOk = () => {
        addNewChainForm.validateFields()
            .then(values => {
                const tmpEvmChainInfo = JSON.parse(JSON.stringify(evmChainInfo));
                tmpEvmChainInfo[values.chainId] = values.chainName;
                setEvmChainInfo(tmpEvmChainInfo); 
                setNewChainVisible(false);
                addNewChainForm.resetFields();
                global.localStorage.setItem('evmChainInfo', JSON.stringify(tmpEvmChainInfo)); 
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    }

    const handleImportABIOK = () => {
        updateABIInfo(currentChain, contractAddr, JSON.parse(importedABI));
        setImportABIVisible(false);
    }

    const checkChainId = (_, value: number) => {
        if (evmChainInfo[value] == null) {
          return Promise.resolve();
        }
    
        return Promise.reject(new Error('Chain has been exist!'));
    }

    const checkAddress = (_, value: string) => {
        if (isEmptyObj(value) || web3.utils.isAddress(value)) {
          return Promise.resolve();
        }
    
        return Promise.reject(new Error('Address is invalid!'));
    }

    const checkFilter = (_, value: string) => {
        try {
            const filter = isEmptyObj(value) ? '' : JSON.parse(value);
            return Promise.resolve();
        } catch (error: any) {
            return Promise.reject(new Error('Invalid filter content:' + error.message));
        }
    }

    const checkTitle = (_, value: string) => {
        if (isInternalDependency(value))
            return Promise.reject(new Error('Title can NOT use keywords: timer, blockNumber, gasPrice, cexPrice, customScript, compare2Data.'));
        else if (getSubScript(value) == null || (modifyScript && value == curModifiedTitle))
            return Promise.resolve();
        else 
            return Promise.reject(new Error('Title can NOT be duplicated.'));
    }

    const openStepEditor = (scriptType: string, modalTitle: string, stepNumber: number) => {
        setCurrentScriptType(scriptType);
        setModalTitle(modalTitle);
        if (scriptType == 'tgMsg') {
            setSendTGMsgVisible(true);
        } else if (scriptType == 'clearResult') {
            setClearResultVisible(true);
        } else if (scriptType == 'stopScript') {
            setStopScriptVisible(true);
        } else if (scriptType == 'rCex') {
            setReadCEXVisible(true);
        } else if (scriptType == 'rWeb2') {
            setReadWeb2Visible(true);
        } else {
            setConfigChainContractVisible(true);
        }
        SetCurStep(1);
        SetTotalStep(stepNumber);
    }

    const addScript = (scriptType: string, modalTitle: string, stepNumber: number) => {
        setModifyScript(false);
        clearInitialValues();
        openStepEditor(scriptType, modalTitle, stepNumber);
    }

    const getReadableType = (stepType: string) => {        
        if (stepType == 'event') {
            return 'monitor event';
        }
        if (stepType == 'pendingTx') {
            return 'monitor transaction in mempool';
        }
        if (stepType == 'executedTx') {
            return 'monitor transaction in latest block';
        }
        if (stepType == 'rFunc') {
            return 'read contract state';
        }
        if (stepType == 'wFunc') {
            return 'send transaction';
        }
        if (stepType == 'clearResult') {
            return 'clear result';
        }
        if (stepType == 'rCex') {
            return 'Read Token Price From CEX';
        }
        if (stepType == 'rWeb2') {
            return 'Read data from Web2';
        }
        if (stepType == 'tgMsg') {
            return 'Telegram Message';
        }
        if (stepType == 'stopScript') {
            return 'Stop Script';
        }
    }

    const deleteSubScript = (subScriptTitle: string) => {
        delete script['subScripts'][subScriptTitle];
        const tmpScript = JSON.parse(JSON.stringify(script));
        setScript(tmpScript);
        updateSubScriptTitles();
        save2LS();
    }

    const modifySubScript = (subScriptTitle: string) => {
        var subScripts = script.subScripts;
        if (subScripts != null) {
            setModifyScript(true);
            setCurModifiedTitle(subScriptTitle);
            const subScript = subScripts[subScriptTitle];
            const stepType = subScript.type;
            if (stepType == 'event') {
                setInitialValuesOfChainContract(subScript['chainContractConfig']);
                setInitialValuesOfEvent(subScript['eventConfig']);
                openStepEditor('event', 'Event Config', 2);
            }
            if (stepType == 'pendingTx') {
                setInitialValuesOfChainContract(subScript['chainContractConfig']);
                setInitialValuesOfTxMonitor(subScript['txMonitorConfig']);
                openStepEditor('pendingTx', 'Transaction Config(in mempool)', 2);
            }
            if (stepType == 'executedTx') {
                setInitialValuesOfChainContract(subScript['chainContractConfig']);
                setInitialValuesOfTxMonitor(subScript['txMonitorConfig']);
                openStepEditor('executedTx', 'Transaction Config(in latest block)', 2);
            }
            if (stepType == 'rFunc') {
                setInitialValuesOfChainContract(subScript['chainContractConfig']);
                setInitialValuesOfFunctionSelected(subScript['functionSelectedConfig']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                openStepEditor('rFunc', 'Read Contract Data Config', 3);
            }
            if (stepType == 'wFunc') {
                setInitialValuesOfChainContract(subScript['chainContractConfig']);
                setInitialValuesOfFunctionSelected(subScript['functionSelectedConfig']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                setInitialValuesOfLeftConfig(subScript['leftConfig']);
                openStepEditor('wFunc', 'Send Transaction Config', 4);
            }
            if (stepType == 'rCex') {
                setInitialValuesOfReadCEXConfig(subScript['rCexConfig']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                openStepEditor('rCex', 'Read Token Price from CEX', 2);
            }
            if (stepType == 'rWeb2') {
                setInitialValuesOfReadWeb2Config(subScript['rWeb2Config']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                openStepEditor('rWeb2', 'Read data from Web2', 2);
            }
            if (stepType == 'tgMsg') {
                setInitialValuesOfTgMsgConfig(subScript['tgMsgConfig']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                openStepEditor('tgMsg', 'Send Telegram Message', 2);
            }
            if (stepType == 'clearResult') {
                setInitialValuesOfClearResult(subScript['clearResultConfig']);
                setInitialValuesOfDependency(subScript['dependencyConfig']);
                openStepEditor('clearResult', 'Clear the result of other subscripts', 2);
            }
        }
        updateSubScriptTitles();
    }

    const isSameOrSimiliarType = (firstType: string, secondType: string) => {
        if (firstType == secondType) return true;

        // eg: uint int uint256
        if (firstType.indexOf('int') >= 0 && secondType.indexOf('int') >= 0) return true;

        // eg: string, string[]
        if (firstType.indexOf(secondType) >= 0 || secondType.indexOf(firstType) >= 0) return true;

        return false;
    }

    const formItemInFunctionSelectedModal = (input: any, index: number) => {
        var inputName = isEmptyObj(input.name) ? '#' + index : input.name;
        var valueType = functionSelectedForm.getFieldValue([inputName, 'valueType']);
        if (isEmptyObj(valueType)) valueType = 'constant';
        //console.log(inputName, valueType);
        const formItem = 
            <Form.Item 
            key={inputName}
            label={inputName}
            rules={[{ required: true }]}
            >   
                <Input.Group compact>
                    <Form.Item
                        name={[inputName, 'valueType']}
                        noStyle
                    >
                        <Select placeholder="Select value type" style={{width: 200, textAlign: 'center'}}>
                            <Option value="constant">constant value</Option>
                            <Option value="dynamic">dynamic value</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate//={(prevValues, currentValues) => prevValues[input.name]['valueType'] !== currentValues[input.name]['valueType']}
                    >
                    {({ getFieldValue }) =>
                        !isEmptyObj(getFieldValue([inputName, 'valueType'])) && getFieldValue([inputName, 'valueType']) !== 'constant' ? (
                            <Form.Item name={[inputName, 'subscriptName']}>
                                <Select placeholder="Select subScript" style={{width: 270, textAlign: 'center'}}>
                                {
                                    Object.entries(getSubScripts()).map(entry => 
                                        <Option title={entry[0]} value={entry[0]}>{entry[0]}</Option>
                                    )
                                }
                                </Select>
                            </Form.Item>
                        ) : null
                    }
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate//={(prevValues, currentValues) => prevValues[input.name]['valueType'] !== currentValues[input.name]['valueType']}
                    >
                    {({ getFieldValue }) =>
                        !isEmptyObj(getFieldValue([inputName, 'valueType'])) && getFieldValue([inputName, 'valueType']) !== 'constant' ? (
                            [
                                <Form.Item name={[inputName, 'referenceParaName']}>
                                    <Select placeholder="Select the value source" style={{width: 470, textAlign: 'center'}}>
                                    {
                                        getFieldValue([inputName, 'subscriptName']) == null ? 
                                        null :
                                        isInputStep(getSubScript(getFieldValue([inputName, 'subscriptName']))) ?                                        
                                            getSubScript(getFieldValue([inputName, 'subscriptName']))?.element.inputs.map((copyInput: any, index: number) => {
                                                const paraName = isEmptyObj(copyInput.name) ? '#' + index : copyInput.name;
                                                if (isSameOrSimiliarType(input.type, copyInput.type))
                                                    return <Option value={paraName}>value of input parameter '{paraName}' in {getSubScript(getFieldValue([inputName, 'subscriptName']))?.element.name}</Option>;
                                                }
                                            ) 
                                            :
                                            getSubScript(getFieldValue([inputName, 'subscriptName']))?.element.outputs.map((copyOutput: any, index: number) => {
                                                const paraName = isEmptyObj(copyOutput.name) ? '#' + index : copyOutput.name;
                                                if (isSameOrSimiliarType(input.type, copyOutput.type))
                                                    return <Option value={paraName}>value of output parameter '{paraName}' in {getSubScript(getFieldValue([inputName, 'subscriptName']))?.element.name}</Option>;
                                                }
                                            )
                                    }
                                    </Select>
                                </Form.Item>,
                                <div>The selected value could be adjusted by followed option.</div>,
                                <Form.Item
                                    name={[inputName, 'op']}
                                    noStyle
                                >
                                    <Select placeholder="Select operator" style={{width: 235, textAlign: 'center'}}>
                                        <Option value="+">{'+'}</Option>
                                        <Option value="-"> {'-'}</Option>
                                        <Option value="*">{'*'}</Option>
                                        <Option value="/">{'/'}</Option>
                                        <Option value="%">{'%'}</Option>
                                    </Select>
                                </Form.Item>,
                                <Form.Item
                                    name={[inputName, 'externalValue']}
                                    noStyle
                                >
                                    <InputNumber 
                                        style={{
                                            width: 235,
                                        }}
                                    />
                                </Form.Item>
                            ]
                        ) : (
                            <Form.Item name={[inputName, 'value']}>
                                <Input type='text' style={{ width: 470 }}/>
                            </Form.Item>
                        )
                    }
                    </Form.Item>
                </Input.Group>
            </Form.Item>;
        return formItem;
    }

    const isInputStep = (subscriptName: string) => {
        return subscriptName.type == 'event' || subscriptName.type == 'pendingTx' || subscriptName.type == 'executedTx';
    }

    const isInternalDependency = (dependencyName: string) => {
        return dependencyName == 'timer' || dependencyName == 'blockNumber' || dependencyName == 'gasPrice' 
            || dependencyName == 'cexPrice' || dependencyName == 'customScript' || dependencyName == 'compare2Data';
    }

    const checkScript = async (path: string) => {
        const scriptCode = dependencyConfigForm.getFieldValue(path);
        async function looseJsonParse(obj: string){
            return await Function('require', 'BigNumber', 'web3', '"use strict";return (' + obj + '())')(require, require('bignumber.js'), web3);
        }
        if (scriptCode.indexOf('localStorage') > 0) {
            Modal.warning({title: 'Warning', content: 'can NOT use localStorage to access the local info'});
            return;
        }
        try {            
            const result = await looseJsonParse(scriptCode);
            if (typeof result == 'boolean') {
                Modal.success({title: 'Success', content: 'Script code is valid'});
                return true;
            } else {
                Modal.warning({title: 'Warning', content: 'Script code is invalid'});
                return false;
            }
        } catch (error) {
            Modal.warning({title: 'Warning', content: 'Script code is invalid'});
            return false;
        }
    }

    const testScript = async (path: string) => {
        const scriptCode = readWeb2Form.getFieldValue(path);
        async function looseJsonParse(obj: string) {
            return await Function('require', 'BigNumber', 'web3', '"use strict";return (' + obj + '())')(require, require('bignumber.js'), web3);
        }
        if (scriptCode.indexOf('localStorage') > 0) {
            Modal.warning({title: 'Warning', content: 'can NOT use localStorage to access the local info'});
            return;
        }
        try {            
            const result = await looseJsonParse(scriptCode);
            Modal.info({title: 'Result', content: result});
        } catch (error: any) {
            Modal.warning({title: 'Warning', content: 'Script code is invalid: ' + error.message});
            return false;
        }
    }

    const convertString2Number = (gasPriceType: string) => {
        if (gasPriceType == 'fivePercent') return '5% in txpool';
        if (gasPriceType == 'tenPercent') return '10% in txpool';
        if (gasPriceType == 'twentyPercent') return '20% in txpool';
    }

    const sendTeleMsg2User = (chatId: number, message: string) => {        
        const telegramUrl = 'https://api.telegram.org/bot5529134860:AAFybUx2Ed2qoE85BaLwC5bhv2E0DcKWSC0/sendMessage?chat_id=' + chatId + '&text=' + message;
        fetch(telegramUrl, {}).then(resp => {
            resp.json().then(result => {
              console.log(result);
            });
          })
    }

    return (
        <div>
            <Accordion defaultIndex={[0]} allowMultiple>
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                                Monitor event or transaction
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <HStack spacing='24px'>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('event', 'Event Config', 2)}>Monitor Event</Button>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('pendingTx', 'Transaction Config(in mempool)', 2)}>Monitor Tx in mempool</Button>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('executedTx', 'Transaction Config(in latest block)', 2)}>Monitor Tx in latest block</Button>
                        </HStack>
                        <p/>
                        <Space wrap>
                            {
                                Object.entries(getSubScripts()).map(entry => {
                                    const subScript: any = converter.convertSubScript(entry[1]);
                                    if (subScript.type != 'event' && subScript.type != 'pendingTx' && subScript.type != 'executedTx') return;
                                    const externalInfo = [];
                                    var interfaceType = '';
                                    if (subScript.type == 'event') {
                                        interfaceType = 'event';
                                        if (!isEmptyObj(subScript.filter))
                                            externalInfo.push(<p><Text strong>filter:</Text> <Text code>{subScript.filter}</Text></p>);
                                    } else if (subScript.type == 'pendingTx' || subScript.type == 'executedTx') {
                                        interfaceType = 'function';
                                        if (subScript.valueCondition != null) {
                                            externalInfo.push(<p><Text strong>msg.value:</Text> <Text code>{subScript.valueCondition.op} {subScript.valueCondition.value} ETH</Text></p>);
                                        }
                                        var paraCondition = '';
                                        for (const [parameter, condition] of Object.entries(subScript.parameterCondition)) {
                                            paraCondition += parameter + ' ' + condition.op + ' ' + condition.value + ' && ';
                                        }
                                            
                                        if (paraCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>parameter condition:</Text><Text code>{paraCondition.substr(0, paraCondition.length - ' && '.length)}</Text></p>);
                                        }
                                    }
                                    return <Card title={subScript.title} style={{ width: 400 }}>
                                        <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                        <p><Text strong>Chain:</Text> <Text keyboard>{evmChainIds[subScript.chainId]}(chainId = {subScript.chainId})</Text></p>
                                        <p><Text strong>Contract:</Text> <Text code>{subScript.to}</Text></p>
                                        <p><Text strong>{interfaceType}:</Text> <Text code>{subScript.name}</Text></p>
                                        {
                                            externalInfo
                                        }
                                        <Divider plain>
                                            <Space>
                                                <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                            </Space>
                                        </Divider>
                                    </Card>
                                    }
                                )
                            }
                        </Space>
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                                Read data from contract/CEX/Web2
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <HStack spacing='24px'>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('rFunc', 'Read Contract Data Config', 3)}>Read contract</Button>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('rCex', 'Get price from CEX', 2)}>Get price from CEX</Button>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('rWeb2', 'Interact With Web2', 2)}>Read Web2 Data</Button>
                        </HStack>
                        <p/>
                            <Space wrap>
                            {
                                Object.entries(getSubScripts()).map(entry => {
                                    const subScript: any = converter.convertSubScript(entry[1]);
                                    console.log(subScript);
                                    if (subScript.type != 'rFunc' && subScript.type != 'rCex' && subScript.type != 'rWeb2') return;
                                    const externalInfo = [];
                                    var interfaceType = '';
                                    if (subScript.type == 'rFunc') {
                                        interfaceType = 'function';
                                        
                                        if (subScript.from instanceof String) {
                                            externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>{subScript.from}</Text></p>);
                                        } else {
                                            if (subScript.from.referenceType == 1) {
                                                externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>msg.sender@{subScript.from.subscriptName}</Text></p>);
                                            } else if (subScript.from.referenceType == 2) {
                                                externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>to@{subScript.from.subscriptName}</Text></p>);
                                            }  else if (subScript.from.referenceType == 5) {
                                                externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>{subScript.from.address}@{subScript.from.subscriptName}</Text></p>);
                                            } 
                                        }
                                        var paraCondition = '';
                                        subScript.parameters.map((parameter: any) => {
                                            if (isEmptyObj(parameter.subscriptName)) {
                                                paraCondition += parameter.paraName + ' = ' + parameter.value + ' && ';
                                            } else {
                                                paraCondition += parameter.paraName + ' = ' + parameter.referenceParaName + '@' + parameter.subscriptName + parameter.op + parameter.externalValue + ' && ';
                                            }
                                        })
                                            
                                        if (paraCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>parameter condition:</Text><Text code>{paraCondition.substr(0, paraCondition.length - ' && '.length)}</Text></p>);
                                        }

                                        var dependencyCondition = '';
                                        if (subScript.conditions.length > 0) {
                                            var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                            subScript.conditions.map((condition: any, index: number) => {
                                                if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                                if (isInternalDependency(condition.subscriptName)) {
                                                    if (condition.subscriptName == 'cexPrice') {
                                                        dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                        dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else
                                                        dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else {
                                                    dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                }
                                            })
                                        }

                                        if (dependencyCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                        }

                                        var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                        externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);

                                        return <Card title={subScript.title} style={{ width: 'auto' }}>
                                                    <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                                    <p><Text strong>Chain:</Text> <Text keyboard>{evmChainIds[subScript.chainId]}(chainId = {subScript.chainId})</Text></p>
                                                    <p><Text strong>Contract:</Text> <Text code>{subScript.to}</Text></p>
                                                    <p><Text strong>From Address:</Text> <Text code>{subScript.to}</Text></p>
                                                    <p><Text strong>{interfaceType}:</Text> <Text code>{subScript.name}</Text></p>
                                                    {
                                                        externalInfo
                                                    }
                                                    <Divider plain>
                                                        <HStack spacing='24px'>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                                        </HStack>
                                                    </Divider>
                                                </Card>
                                    } else if (subScript.type == 'rCex') {
                                        var dependencyCondition = '';
                                        if (subScript.conditions.length > 0) {
                                            var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                            subScript.conditions.map((condition: any, index: number) => {
                                                if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                                if (isInternalDependency(condition.subscriptName)) {
                                                    if (condition.subscriptName == 'cexPrice') {
                                                        dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                        dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else
                                                        dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else {
                                                    dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                }
                                            })
                                        }

                                        if (dependencyCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                        }

                                        var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                        externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);
                                        return <Card title={subScript.title} style={{ width: 'auto' }}>
                                                    <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                                    <p><Text strong>CEX:</Text> <Text keyboard>{subScript.whichCex}</Text></p>
                                                    <p><Text strong>Trading Pair:</Text> <Text keyboard>{subScript.tradingPair}</Text></p>
                                                    {
                                                        externalInfo
                                                    }
                                                    <Divider plain>
                                                        <HStack spacing='24px'>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                                        </HStack>
                                                    </Divider>
                                                </Card>
                                    } else if (subScript.type == 'rWeb2') {
                                        var dependencyCondition = '';
                                        if (subScript.conditions.length > 0) {
                                            var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                            subScript.conditions.map((condition: any, index: number) => {
                                                if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                                if (isInternalDependency(condition.subscriptName)) {
                                                    if (condition.subscriptName == 'cexPrice') {
                                                        dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                        dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else
                                                        dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else {
                                                    dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                }
                                            })
                                        }

                                        if (dependencyCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                        }

                                        var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                        externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);
                                        return <Card title={subScript.title} style={{ width: 'auto' }}>
                                                    <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                                    <p><Text strong>Request Type:</Text> <Text keyboard>{subScript.requestType}</Text></p>
                                                    <p><Text strong>Request Content:</Text> 
                                                    <Tooltip title={subScript.requestContent}>
                                                        <Text code>{subScript.requestContent.length > 30 ? subScript.requestContent.substr(0, 30) + '...' : subScript.requestContent}</Text>    
                                                    </Tooltip>
                                                    </p>
                                                    {
                                                        externalInfo
                                                    }
                                                    <Divider plain>
                                                        <HStack spacing='24px'>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                            <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                                        </HStack>
                                                    </Divider>
                                                </Card>
                                    }
                                    
                                    }
                                )
                            }
                        </Space>
                    </AccordionPanel>
                </AccordionItem>  
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                            Send transaction
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <HStack spacing='24px'>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('wFunc', 'Send Transaction Config', 4)}>Send transaction</Button>
                        </HStack>
                        <p/>
                        <Space wrap>
                            {
                                Object.entries(getSubScripts()).map(entry => {
                                    const subScript: any = converter.convertSubScript(entry[1]);
                                    //console.log(subScript);
                                    if (subScript.type != 'wFunc') return;
                                    const externalInfo = [];
                                    var interfaceType = 'function';
                                    if (subScript.from instanceof String) {
                                        externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>{subScript.from}</Text></p>);
                                    } else {
                                        if (subScript.from.referenceType == 1) {
                                            externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>msg.sender@{subScript.from.subscriptName}</Text></p>);
                                        } else if (subScript.from.referenceType == 2) {
                                            externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>to@{subScript.from.subscriptName}</Text></p>);
                                        }  else if (subScript.from.referenceType == 5) {
                                            externalInfo.push(<p><Text strong>msg.sender:</Text> <Text code>{subScript.from.address}@{subScript.from.subscriptName}</Text></p>);
                                        } 
                                    }
                                    var paraCondition = '';
                                    subScript.parameters.map((parameter: any) => {
                                        if (isEmptyObj(parameter.subscriptName)) {
                                            paraCondition += parameter.paraName + ' = ' + parameter.value + ' && ';
                                        } else {
                                            paraCondition += parameter.paraName + ' = ' + parameter.referenceParaName + '@' + parameter.subscriptName + parameter.op + parameter.externalValue + ' && ';
                                        }
                                    })
                                        
                                    if (paraCondition.length > 0) {
                                        externalInfo.push(<p><Text strong>parameter condition:</Text><Text code>{paraCondition.substr(0, paraCondition.length - ' && '.length)}</Text></p>);
                                    }

                                    var dependencyCondition = '';
                                    if (subScript.conditions.length > 0) {
                                        var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                        subScript.conditions.map((condition: any, index: number) => {
                                            if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                            if (isInternalDependency(condition.subscriptName)) {
                                                if (condition.subscriptName == 'cexPrice') {
                                                    dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                    dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else
                                                    dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;                                                
                                            } else {
                                                dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                            }
                                        })
                                    }

                                    if (dependencyCondition.length > 0) {
                                        externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                    }

                                    var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                    externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);

                                    if (subScript.repeaTimes > 0) {
                                        externalInfo.push(<p><Text strong>repeat times:</Text><Text code>{subScript.repeaTimes}</Text></p>);
                                        externalInfo.push(<p><Text strong>repeat condition:</Text><Text code>{subScript.repeatCondition == 'sentSuccess' ? 'sent successfully' : 'executed successfully'}</Text></p>);
                                    }

                                    return <Card title={subScript.title} style={{ width: 'auto' }}>
                                        <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                        <p><Text strong>Chain:</Text> <Text keyboard>{evmChainIds[subScript.chainId]}(chainId = {subScript.chainId})</Text></p>
                                        <p><Text strong>Contract:</Text> <Text code>{subScript.to}</Text></p>
                                        <p><Text strong>From Address:</Text> <Text code>{subScript.to}</Text></p>
                                        <p><Text strong>Value of ETH:</Text> <Text code>{subScript.value} ETH</Text></p>
                                        <p><Text strong>Gas Price:</Text> <Text code>{subScript.gasPriceValueType == 'dynamic' ? convertString2Number(subScript.gasPriceType) : subScript.maxFeePerGas + 'Gwei'}</Text></p>
                                        <p><Text strong>{interfaceType}:</Text> <Text code>{subScript.name}</Text></p>
                                        {
                                            externalInfo
                                        }
                                        <Divider plain>
                                            <HStack spacing='24px'>
                                                <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                            </HStack>
                                        </Divider>
                                    </Card>
                                    }
                                )
                            }
                        </Space>
                    </AccordionPanel>
                </AccordionItem>              
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                            Send Telegram Message / Record information to DB / Feeding data to an AI agent
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <HStack spacing='24px'>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('tgMsg', 'Send Telegram Message', 2)}>Send Telegram Message</Button>
                            <Button colorScheme='teal' variant='solid'>Record DB</Button>
                            <Button colorScheme='teal' variant='solid'>Feeding Agent</Button>
                        </HStack>
                        <p/>
                        <Space wrap>
                            {
                                Object.entries(getSubScripts()).map(entry => {
                                    const subScript: any = converter.convertSubScript(entry[1]);
                                    //console.log(subScript);
                                    if (subScript.type != 'tgMsg' && subScript.type != 'wWeb2') return;
                                    const externalInfo = [];
                                    var interfaceType = '';
                                    if (subScript.type == 'tgMsg') {
                                    
                                        var dependencyCondition = '';
                                        if (subScript.conditions.length > 0) {
                                            var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                            subScript.conditions.map((condition: any, index: number) => {
                                                if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                                if (isInternalDependency(condition.subscriptName)) {
                                                    if (condition.subscriptName == 'cexPrice') {
                                                        dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                        dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                    } else
                                                        dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else {
                                                    dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                }
                                            })
                                        }

                                        if (dependencyCondition.length > 0) {
                                            externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                        }

                                        var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                        externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);

                                    } else if (subScript.type == 'wWeb2') {
                                        interfaceType = 'coin';
                                    }
                                    return <Card title={subScript.title} style={{ width: 'auto' }}>
                                        <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                        <p><Text strong>User Id:</Text> <Text keyboard>{subScript.toUserId}</Text></p>
                                        <p><Text strong>Message:</Text> <Text code>{subScript.message}</Text></p>
                                        {
                                            externalInfo
                                        }
                                        <Divider plain>
                                            <HStack spacing='24px'>
                                                <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                            </HStack>
                                        </Divider>
                                    </Card>
                                    }
                                )
                            }
                        </Space>   
                    </AccordionPanel>
                </AccordionItem>           
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                            Clear result / Stop script
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <HStack spacing='24px'>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('clearResult', 'Clear the result of other subscripts', 2)}>Clear Result</Button>
                            <Button colorScheme='teal' variant='solid' onClick={() => addScript('stopScript', 'Stop the running of script', 2)}>Stop Script</Button>
                        </HStack>
                        <p/>
                        <Space wrap>
                            {
                                Object.entries(getSubScripts()).map(entry => {
                                    const subScript: any = converter.convertSubScript(entry[1]);
                                    //console.log(subScript);
                                    if (subScript.type != 'clearResult') return;
                                    const externalInfo = [];
                                    var interfaceType = '';
                                    var dependencyCondition = '';
                                    if (subScript.conditions.length > 0) {
                                        var logicSymbol = subScript.logic == "and" ? '&&' : '||';
                                        subScript.conditions.map((condition: any, index: number) => {
                                            if (index > 0) dependencyCondition += ' ' + logicSymbol + ' ';
                                            if (isInternalDependency(condition.subscriptName)) {
                                                if (condition.subscriptName == 'cexPrice') {
                                                    dependencyCondition += 'Price of ' + condition.tokenSymbol + ' on Binance ' + condition.compareType + ' ' + condition.compareValue;
                                                } else if (condition.subscriptName == 'blockNumber' || condition.subscriptName == 'gasPrice') {
                                                    dependencyCondition += condition.subscriptName + '@' + evmChainInfo[condition.dependencyChainId] + ' ' + condition.compareType + ' ' + condition.compareValue;
                                                } else
                                                    dependencyCondition += condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                            } else {
                                                dependencyCondition += condition.paraName + '@' + condition.subscriptName + ' ' + condition.compareType + ' ' + condition.compareValue;
                                            }
                                        })
                                    }

                                    if (dependencyCondition.length > 0) {
                                        externalInfo.push(<p><Text strong>dependent condition:</Text><Text code>{dependencyCondition}</Text></p>);
                                    }

                                    var delayedTime = isEmptyObj(subScript.delayedTime) ? 'instant' : subScript.delayedTime + ' s';
                                    externalInfo.push(<p><Text strong>delayed time:</Text><Text code>{delayedTime}</Text></p>);
                                    return <Card title={subScript.title} style={{ width: 'auto' }}>
                                        <p><Text strong>Action:</Text> <Text keyboard>{getReadableType(subScript.type)}</Text></p>
                                        <p><Text strong>subscript title:</Text> <Text keyboard>{subScript.subscriptTitles.toString()}</Text></p>
                                        {
                                            externalInfo
                                        }
                                        <Divider plain>
                                            <HStack spacing='24px'>
                                                <Button colorScheme='blue' variant='solid' onClick={() => deleteSubScript(subScript.title)}>Delete</Button>
                                                <Button colorScheme='blue' variant='solid' onClick={() => modifySubScript(subScript.title)}>Modify</Button>
                                            </HStack>
                                        </Divider>
                                    </Card>
                                    }
                                )
                            }
                        </Space>  
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
            <Box>
                <Title style={{color: 'white'}}>Execution order (Adjustable by drag and drop)</Title>
                <SortableList items={scriptTitles} onSortEnd={onSortEnd} />
            </Box>

            <Modal
                visible={configChainContractVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Next"
                cancelText="Cancel"
                onCancel={() => setConfigChainContractVisible(false)}
                onOk={handleChainContractOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setConfigChainContractVisible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleChainContractOk}>
                      Next
                    </Button>
                  ]}
                >
                <Form
                    form={chainContractForm}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={initialValuesOfChainContract}
                >      
                    <Form.Item 
                        name="title" 
                        label="title"
                        rules={[{ required: true, message: 'Please input the unique title of this subscriptName!' }, {validator: checkTitle}]}
                    >                            
                        <Input type='textarea' />
                    </Form.Item>
                    <Form.Item label="chain" required={true}>     
                        <Space>      
                            <Form.Item noStyle name="chain" rules={[{ required: true, message: 'Please select the chain!' }]}>                                
                                <Select showSearch style={{ width: 450}}>
                                    {
                                        Object.entries(evmChainInfo).map(entry => {
                                            return <Option key={entry[0]}>{entry[1]}(chainId={entry[0]})</Option>
                                        })
                                    }
                                </Select>
                            </Form.Item>     
                            <Tooltip title="Add new chain information">
                                <PlusCircleOutlined onClick={addNewChain}/>
                            </Tooltip>
                        </Space>
                    </Form.Item>
                    {
                        currentScriptType == 'rFunc' || currentScriptType == 'wFunc' ? 
                        <Form.Item 
                            label="from address"
                            rules={[{ required: true, message: 'Please input the from address of transaction!' }]}
                        >                            
                            <Input.Group compact>
                                    <Form.Item
                                        name={['from', 'valueType']}
                                        noStyle
                                    >
                                        <Select placeholder="Select value type" style={{width: 200, textAlign: 'center'}}>
                                            <Option value="constant">constant value</Option>
                                            <Option value="dynamic">dynamic value</Option>
                                        </Select>
                                    </Form.Item>
                                    {
                                        fromValueType == 'constant' ? 
                                            null
                                            : 
                                            <Form.Item
                                                name={['from', 'subscriptName']}
                                                noStyle
                                            >
                                                <Select placeholder="Select subScript" style={{width: 270, textAlign: 'center'}}>
                                                    {
                                                        Object.entries(getSubScripts()).map(entry => 
                                                            <Option title={entry[0]} value={entry[0]}>{entry[0]}</Option>
                                                        )
                                                    }
                                                </Select>
                                            </Form.Item>
                                    }
                                    {
                                        fromValueType == 'constant' ? 
                                            <Form.Item
                                                name={['from', 'address']}
                                                noStyle
                                                rules={[{ required: true, message: 'Please input the address!' }, {validator: checkAddress}]}
                                            >
                                                {
                                                    currentScriptType == 'rFunc' ? 
                                                        <Input type='text' style={{ width: 470 }} placeholder='0x...'/>
                                                        :
                                                        <Select placeholder="Select address" style={{width: 470, textAlign: 'center'}}>
                                                        {
                                                            [...accountList, ...mmAccounts].map((account: any) => 
                                                                <Option title={'0x' + account.address} value={'0x' + account.address}>0x{account.address}</Option>
                                                            )
                                                        }
                                                    </Select>
                                                }
                                                
                                            </Form.Item>
                                            :
                                            getSubScript(fromStep) != null ?
                                                <Form.Item
                                                    name={['from', 'address']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Please select the address source!' }]}
                                                >
                                                    <Select placeholder="Select address source" style={{width: 470, textAlign: 'center'}}>
                                                        {
                                                            (getSubScript(fromStep)?.element.type == 'event' || !getSubScript(fromStep)?.element.constant) ?  // 事件和write交易需要从inputs里读取数据，而view接口从outputs里读数据
                                                            getSubScript(fromStep)?.element.inputs.map((input: any) => {
                                                                if (input.type == 'address') {
                                                                    return <Option value={input.name}>value of input parameter '{input.name}' in {getSubScript(fromStep)?.element.name}</Option>;
                                                                }
                                                            })
                                                            :
                                                            getSubScript(fromStep)?.element.outputs.map((input: any) => {
                                                                if (output.type == 'address') {
                                                                    return <Option value={output.name}>value of output parameter '{output.name}' in {getSubScript(fromStep)?.element.name}</Option>;
                                                                }
                                                            })
                                                        }
                                                        {
                                                            getSubScript(fromStep)?.type == 'pendingTx' || getSubScript(fromStep)?.type == 'executedTx' ? 
                                                            [
                                                                <Option value={JSON.stringify({referenceType: 'from'})}>value of 'from' in transaction</Option>,
                                                                <Option value={JSON.stringify({referenceType: 'to'})}>value of 'to' in transaction</Option>
                                                            ]
                                                            :
                                                            null
                                                        }
                                                    </Select>
                                                </Form.Item>
                                                :
                                                null
                                            
                                    }
                                </Input.Group>
                        </Form.Item>
                        :
                        null
                    }
                    
                    <Form.Item label="Contract Address" required={true}>     
                        <Space>      
                            <Form.Item noStyle name="contractAddr" rules={[{ required: true, message: 'Please input the address of contract!' }]}>                                
                                <Input style={{ width: 400}} type="textarea" />
                            </Form.Item>  
                            {
                                isEmptyObj(contractAddr) ?  
                                null 
                                    :
                                isABIOK(currentChain, contractAddr) ?
                                <Tooltip title="The ABI of contract has been in local.">
                                    <CheckCircleOutlined />
                                </Tooltip>    
                                :
                                <Tooltip title="The ABI of contract has NOT been in local.">
                                    <ExclamationCircleOutlined />
                                </Tooltip>
                            }  
                            <Tooltip title="Sync ABI from blockchain browser, such as etherscan">
                                <SyncOutlined onClick={syncABI}/>
                            </Tooltip>    
                            <Tooltip title="Import ABI manually">
                                <EditOutlined onClick={importABIManually}/>
                            </Tooltip>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                visible={addEventMonitorVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Confirm"
                cancelText="Previous"
                onCancel={() => setAddEventMonitorVisible(false)}
                onOk={handleEventMonitorOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => {setAddEventMonitorVisible(false); setConfigChainContractVisible(true); SetCurStep(curStep - 1);}}>
                      Previous
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleEventMonitorOk}>
                      Confirm
                    </Button>
                  ]}
                >
                <Form
                    form={eventMonitorForm}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={initialValuesOfEvent}
                >   
                    <Form.Item
                        name="event"
                        label="event"
                        rules={[{ required: true, message: 'Please select the event to be monitored!' }]}
                    >
                        <Select showSearch style={{ width: 470}}>
                            {   
                                isABIOK(currentChain, contractAddr) ? 
                                    contractABIInfo[currentChain][contractAddr].map((element: any) => {
                                        if (element.type == 'event') {
                                            var parameters = '';
                                            element.inputs.map((input: any) => {
                                                parameters += input.internalType + ' ' + input.name + ', ';
                                            })
                                            if (parameters.length > 0) parameters = parameters.substr(0, parameters.length - 2);
                                            
                                            return <Option key={JSON.stringify(element)} value={JSON.stringify(element)}>{element.name}({parameters})</Option>
                                        }
                                    }) : null
                            }
                        </Select>
                    </Form.Item>   

                    <Form.Item 
                        label="filter"
                    >   
                        <Space>
                            <Form.Item noStyle name="filter" rules={[{ validator: checkFilter }]}>                   
                                <Input style={{ width: 440}} type='textarea' placeholder='eg: {"param1": [1,2], "param2": "0x123456789...\"}'/>  
                            </Form.Item>  
                            <Tooltip title="Click it to get detail information about how to set filter.">
                                <a target="_blank" href="https://web3js.readthedocs.io/en/v1.7.5/web3-eth-contract.html#contract-events"><QuestionCircleOutlined /></a>
                            </Tooltip> 
                        </Space>
                    </Form.Item>
                    
                </Form>
            </Modal>

            <Modal
                visible={addTxMonitorVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Confirm"
                cancelText="Previous"
                onCancel={() => setAddTxMonitorVisible(false)}
                onOk={handleTxMonitorOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => {setAddTxMonitorVisible(false); setConfigChainContractVisible(true); SetCurStep(curStep - 1);}}>
                      Previous
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleTxMonitorOk}>
                      Confirm
                    </Button>
                  ]}
                >
                <Form
                    form={pendingTxMonitorForm}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={initialValuesOfTxMonitor}
                >   
                    <Form.Item
                        name="function"
                        label="function"
                        rules={[{ required: true, message: 'Please select the function to be monitored!' }]}
                    >
                        <Select showSearch style={{ width: 470}}>
                            {   
                                isABIOK(currentChain, contractAddr) ? 
                                    contractABIInfo[currentChain][contractAddr].map((element: any) => {
                                        if (element.type == 'function' && !element.constant) {
                                            var parameters = '';
                                            element.inputs.map((input: any) => {
                                                parameters += input.internalType + ' ' + input.name + ', ';
                                            })
                                            if (parameters.length > 0) parameters = parameters.substr(0, parameters.length - 2);
                                            
                                            return <Option title={element.name + '(' + parameters + ')'} key={JSON.stringify(element)} value={JSON.stringify(element)}>{element.name}({parameters})</Option>
                                        }
                                    }) : null
                            }
                        </Select>
                    </Form.Item>   
                    {
                        pendingTxFunction != null && JSON.parse(pendingTxFunction).payable ? 
                        <Form.Item 
                            label="msg.value"
                        >   
                            <Input.Group compact>
                                <Form.Item
                                    name={['msgValue', 'op']}
                                    noStyle
                                >
                                    <Select placeholder="Select operator" style={{width: 120, textAlign: 'center'}}>
                                        <Option value=">">{'>'}</Option>
                                        <Option value="<"> {'<'}</Option>
                                        <Option value=">=">{'>='}</Option>
                                        <Option value="<=">{'<='}</Option>
                                        <Option value="==">{'=='}</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name={['msgValue', 'value']}
                                    noStyle
                                >
                                    <InputNumber addonAfter='ETH'
                                    style={{
                                        width: 350,
                                    }}
                                    />
                                </Form.Item>
                            </Input.Group>
                        </Form.Item> 
                        : 
                        null
                    }
                    {
                        pendingTxFunction != null ?
                        JSON.parse(pendingTxFunction).inputs.map((input: any) => 
                            <Form.Item 
                            label={'parameter:' + input.name}
                            >   
                            <Input.Group compact>
                                <Form.Item
                                    name={[input.name, 'op']}
                                    noStyle
                                >
                                    <Select placeholder="Select operator" style={{width: 120, textAlign: 'center'}}>
                                        <Option value=">">{'>'}</Option>
                                        <Option value="<"> {'<'}</Option>
                                        <Option value=">=">{'>='}</Option>
                                        <Option value="<=">{'<='}</Option>
                                        <Option value="==">{'=='}</Option>
                                        <Option value="include">{'include'}</Option>
                                        <Option value="includedBy">{'includedBy'}</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name={[input.name, 'value']}
                                    noStyle
                                >
                                    <Input
                                    style={{
                                        width: 350,
                                    }}
                                    />
                                </Form.Item>
                            </Input.Group>
                        </Form.Item> )
                        :
                        null
                    }
                    
                </Form>
            </Modal>

            <Modal
                visible={selectFunctionInContractVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Confirm"
                cancelText="Previous"
                onCancel={() => setSelectFunctionInContractVisible(false)}
                onOk={handleSelectFunctionOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => {setSelectFunctionInContractVisible(false); setConfigChainContractVisible(true); SetCurStep(curStep - 1);}}>
                      Previous
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleSelectFunctionOk}>
                      Next
                    </Button>
                  ]}
                >
                <Form
                    form={functionSelectedForm}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={initialValuesOfFunctionSelected}
                >   
                    <Form.Item
                        name="function"
                        label="function"
                        rules={[{ required: true, message: 'Please select the function to invoke!' }]}
                    >
                        <Select showSearch style={{ width: 470}}>
                            {   
                                isABIOK(currentChain, contractAddr) ? 
                                    contractABIInfo[currentChain][contractAddr].map((element: any) => {
                                        if (element.type == 'function' && element.constant) {
                                            var parameters = '';
                                            element.inputs.map((input: any) => {
                                                parameters += input.internalType + ' ' + input.name + ', ';
                                            })
                                            if (parameters.length > 0) parameters = parameters.substr(0, parameters.length - 2);
                                            
                                            return <Option title={element.name + '(' + parameters + ')'} key={JSON.stringify(element)}>{element.name}({parameters})</Option>
                                        }
                                    }) : null
                            }
                        </Select>
                    </Form.Item>   
                    {
                            readDataFunction != null && JSON.parse(readDataFunction).inputs.map((input: any, i: number) => formItemInFunctionSelectedModal(input, i))
                    }
                </Form>
            </Modal>
            <Modal
                visible={dependencyConfigVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Confirm"
                cancelText="Previous"
                onCancel={() => setDependencyConfigVisible(false)}
                onOk={handleDependencyConfigOK}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => {
                        setDependencyConfigVisible(false);      
                        if (currentScriptType == 'tgMsg') {
                            setSendTGMsgVisible(true);
                        } else if (currentScriptType == 'clearResult') {
                            setClearResultVisible(true);
                        } else if (currentScriptType == 'stopScript') {
                            setStopScriptVisible(true);
                        } else if (currentScriptType == 'rCex') {
                            setReadCEXVisible(true);
                        } else if (currentScriptType == 'rWeb2') {
                            setReadWeb2Visible(true);
                        } else            
                            setSelectFunctionInContractVisible(true); 
                        SetCurStep(curStep - 1);
                    }}>
                      Previous
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleDependencyConfigOK}>
                      {currentScriptType == 'wFunc' ? 'Next' : 'Confirm'}
                    </Button>
                  ]}
                >
                <Form
                    form={dependencyConfigForm}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={initialValuesOfDependency}
                >   
                    <Form.List name="dependency">
                        {(fields, { add, remove }) => (
                            <>
                            <Form.Item>
                                <Button
                                colorScheme='blue' variant='solid'
                                onClick={() => add()}
                                leftIcon={<PlusOutlined />}
                                >
                                Add Dependency
                                </Button>
                            </Form.Item>
                            
                            {fields.map(({ key, name, ...restField }) => {
                                return <Input.Group
                                    key={key}
                                >
                                    <div style={{width: 150, marginTop: 20, textAlign: 'center'}}>Dependency {name} <Tooltip title="delete this dependency"><MinusCircleOutlined onClick={() => remove(name)} /></Tooltip></div>
                                    <p/>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "subscriptName"]}
                                        rules={[{ required: true, message: "Select dependency object please" }]}
                                    >
                                        <Select placeholder="Select the dependency object" style={{width: 470, textAlign: 'center'}}>
                                            {
                                                Object.entries(getSubScripts()).map(entry => 
                                                    <Option title={entry[0]} value={entry[0]}>{entry[0]}</Option>
                                                )
                                            }
                                            {
                                                [
                                                    <Option value={'timer'}>set condition of the timer</Option>,
                                                    <Option value={'blockNumber'}>set the condition of block height</Option>,
                                                    <Option value={'gasPrice'}>set the condition of gas price</Option>,
                                                    <Option value={'cexPrice'}>get price from Binance</Option>,
                                                    <Option value={'compare2Data'}>compare 2 data</Option>,
                                                    <Option value={'customScript'}>set the custom JS script</Option>
                                                ]
                                            }
                                        </Select>
                                    </Form.Item>
                                    {
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, curValues) => prevValues['dependency'][name]?.subscriptName !== curValues['dependency'][name]?.subscriptName}
                                    >
                                        { () => {
                                            const subscriptName = dependencyConfigForm.getFieldValue(['dependency', name, 'subscriptName']);
                                            //console.log(name, subscriptName);
                                            return <Form.Item
                                                name={[name, "parameter"]}
                                            >
                                            {
                                                subscriptName == null || isInternalDependency(subscriptName)
                                                || (getSubScript(subscriptName) != null && getSubScript(subscriptName)?.element.type == 'wFunc') ? 
                                                <div style={{display: 'none'}} /> 
                                                :
                                                <Select placeholder="Select input source" style={{width: 470, textAlign: 'center', marginBottom: 60}}>
                                                    {
                                                        (getSubScript(subscriptName)?.element.type == 'event' 
                                                        || !getSubScript(subscriptName)?.element.constant) ?  // 事件和write交易需要从inputs里读取数据，而view接口从outputs里读数据
                                                        getSubScript(subscriptName)?.element.inputs.map((input: any, index: number) => {
                                                            if (input.type == 'address') {
                                                                const paraName = isEmptyObj(input.name) ? '#' + index : input.name;
                                                                return <Option value={paraName}>value of input parameter '{paraName}' in {getSubScript(subscriptName)?.element.name}</Option>;
                                                            }
                                                        })
                                                        :
                                                        getSubScript(subscriptName)?.element.outputs.map((output: any, index: number) => {
                                                            if (output.type == 'address') {
                                                                const paraName = isEmptyObj(output.name) ? '#' + index : output.name;
                                                                return <Option value={paraName}>value of output parameter '{paraName}' in {getSubScript(subscriptName)?.element.name}</Option>;
                                                            }
                                                        })
                                                    }
                                                </Select>
                                            }
                                            </Form.Item> 
                                            }
                                        }
                                    </Form.Item>
                                    }
                                    {
                                    <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, curValues) => prevValues['dependency'][name]?.subscriptName !== curValues['dependency'][name]?.subscriptName}
                                    >
                                    {
                                        () => {
                                            const subscriptName = dependencyConfigForm.getFieldValue(['dependency', name, 'subscriptName']);
                                            if (subscriptName == 'timer') {
                                                const time = dependencyConfigForm.getFieldValue(['dependency', name, 'compareValue']);
                                                dependencyConfigForm.setFieldValue(['dependency', name, 'compareValue'], moment(time));
                                            }
                                            return subscriptName == null 
                                            || (getSubScript(subscriptName) != null && getSubScript(subscriptName)?.element.type == 'wFunc') ? 
                                                <div style={{display: 'none'}}/> :
                                                (
                                                    <div style={{marginTop: -60}}>
                                                        {isInternalDependency(subscriptName) ? '' : 'The input value could be adjusted by followed option.'}
                                                        {
                                                            subscriptName == 'cexPrice' ? 
                                                            <Form.Item
                                                                name={[name, 'tokenSymbol']}
                                                                noStyle
                                                            >
                                                                <Select showSearch placeholder="Select token symbol" style={{width: 470, textAlign: 'center'}}
                                                                    filterOption={(input: any, option: any) =>
                                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                                    }>
                                                                {
                                                                    BinancePairs.map(pair => 
                                                                        <Option value={pair.symbol}>{pair.tradingName}</Option>
                                                                    )
                                                                }
                                                                </Select>
                                                            </Form.Item>
                                                            :
                                                            subscriptName == 'blockNumber' || subscriptName == 'gasPrice' ? 
                                                            <Form.Item
                                                                name={[name, 'dependencyChainId']}
                                                                noStyle
                                                            >
                                                                <Select showSearch style={{ width: 470, textAlign: 'center'}} placeholder='Select the chain'>
                                                                    {
                                                                        Object.entries(evmChainInfo).map(entry => {
                                                                            return <Option key={entry[0]}>{entry[1]}(chainId={entry[0]})</Option>
                                                                        })
                                                                    }
                                                                </Select>
                                                            </Form.Item>
                                                            :
                                                            null
                                                        }
                                                        {
                                                            subscriptName == 'customScript' ? 
                                                            null
                                                            :
                                                            <Form.Item
                                                                name={[name, 'compareType']}
                                                                noStyle
                                                            >
                                                                <Select placeholder="Select operator" style={{width: 235, textAlign: 'center'}}>
                                                                    <Option value=">">{'>'}</Option>
                                                                    <Option value="<"> {'<'}</Option>
                                                                    <Option value=">=">{'>='}</Option>
                                                                    <Option value="<=">{'<='}</Option>
                                                                    <Option value="==">{'=='}</Option>
                                                                    <Option value="include">{'include'}</Option>
                                                                    <Option value="includedBy">{'includedBy'}</Option>
                                                                </Select>
                                                            </Form.Item>
                                                        }
                                                        
                                                        <Form.Item
                                                            name={[name, 'compareValue']}
                                                            noStyle
                                                            shouldUpdate
                                                        >
                                                            {
                                                                subscriptName == 'timer' ?
                                                                <DatePicker style={{width: 235}} showTime/>
                                                                :
                                                                subscriptName == 'blockNumber' ?
                                                                <InputNumber min={1} style={{width: 235}} placeholder='input block height'/>
                                                                :
                                                                subscriptName == 'gasPrice' ?
                                                                <InputNumber min={1} style={{width: 235}} placeholder='input gas price' addonAfter='Gwei'/>
                                                                :
                                                                subscriptName == 'cexPrice' ?
                                                                <InputNumber style={{width: 235}} placeholder='input token price' addonAfter={BinanceSymbols[dependencyConfigForm.getFieldValue(['dependency', name, 'tokenSymbol'])]}/>
                                                                :
                                                                subscriptName == 'customScript' ?
                                                                <Box>
                                                                    <Input.TextArea rows={6}  style={{width: 390}} placeholder='input js function which type of return value should be bool.eg: async function() {return true;}'/>
                                                                    <Button colorScheme='blue' variant='solid' onClick={() => checkScript(['dependency', name, 'compareValue'])}>Check</Button>
                                                                </Box>
                                                                :
                                                                <InputNumber 
                                                                    style={{
                                                                        width: 235,
                                                                    }}
                                                                />
                                                            }
                                                            
                                                        </Form.Item>
                                                    </div>
                                                )
                                            }
                                        }
                                    </Form.Item>
                                    }
                                    
                                </Input.Group>
                            })}
                            </>
                        )}
                    </Form.List>
                    
                   <Form.Item
                        label='logical relationship of dependencies'
                        name={["logic"]}
                        style={{marginTop: 40}}
                        shouldUpdate={(prevValues, currentValues) => {
                            if (currentValues.dependency != null) {
                                setDependencyLength(currentValues.dependency.length);
                            }
                            return prevValues.dependency != null && currentValues.dependency != null && prevValues.dependency.length != currentValues.dependency.length;
                            }
                        }
                    >
                        <Select style={{width: 470, textAlign: 'center'}} disabled={dependencyLength < 2}>
                            <Option value={'and'}>and</Option>
                            <Option value={'or'}>or</Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                         label='Delayed execution time after dependencies are met'
                         name={["delayedTime"]}
                         style={{marginTop: 40}}
                     >
                         <InputNumber min={0} addonAfter='second' style={{width: 470, textAlign: 'center'}}/>
                     </Form.Item>
                </Form>
            </Modal>
            <Modal
                visible={leftConfigVisible}
                title={modalTitle + ' ' + curStep + '/' + totalStep}
                okText="Confirm"
                cancelText="Previous"
                onCancel={() => setLeftConfigVisible(false)}
                onOk={handleLeftConfigOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => {setLeftConfigVisible(false); setDependencyConfigVisible(true); SetCurStep(curStep - 1);}}>
                      Previous
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleLeftConfigOk}>
                      Confirm
                    </Button>
                  ]}
                >
                    <Form
                        form={leftConfigForm}
                        layout="vertical"
                        name="form_in_modal"
                        initialValues={initialValuesOfLeftConfig}
                    >
                        <Form.Item 
                            label="gas price"
                            rules={[{ required: true, message: 'Please input the gas price of this tx!' }]}
                        >                            
                            <Input.Group>
                                <Form.Item
                                    name={['gasPrice', 'valueType']}
                                    noStyle
                                >
                                    <Select placeholder="Select value type" style={{width: 235, textAlign: 'center'}}>
                                        <Option value="constant">constant value</Option>
                                        <Option value="dynamic">dynamic value</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    noStyle
                                    shouldUpdate//={(prevValues, currentValues) => prevValues[input.name]['valueType'] !== currentValues[input.name]['valueType']}
                                >
                                {({ getFieldValue }) =>
                                    !isEmptyObj(getFieldValue(['gasPrice', 'valueType'])) && getFieldValue(['gasPrice', 'valueType']) !== 'constant' ? 
                                        <Form.Item name={['gasPrice', 'gasPriceType']}>
                                            <Select placeholder="Select transaction position in tx mempool" style={{width: 470, textAlign: 'center'}}>
                                                <Option value={'fivePercent'}>Roughly in the top 5% in the tx mempool</Option>
                                                <Option value={'tenPercent'}>Roughly in the top 10% in the tx mempool</Option>
                                                <Option value={'twentyPercent'}>Roughly in the top 20% in the tx mempool</Option>
                                            </Select>
                                        </Form.Item>
                                        : 
                                        <Form.Item 
                                            name={['gasPrice', 'maxFeePerGas']}
                                            rules={[{ required: true, message: 'Please input the max fee per gas of this tx!' }]}
                                        > 
                                            <InputNumber min={0} addonAfter='Gwei' style={{width: 470, textAlign: 'center'}}/>
                                        </Form.Item>
                                }
                                </Form.Item>
                            </Input.Group>
                        </Form.Item>

                        <Form.Item 
                            name="value" 
                            label="value"
                            rules={[{ required: true, message: 'Please input the value of this tx!' }]}
                        >                            
                            <InputNumber min={0} addonAfter='ETH' style={{width: 470, textAlign: 'center'}}/>
                        </Form.Item>

                        <Form.Item 
                            name="repeaTimes" 
                            label="repeat times after the first execution"
                            rules={[{ required: true, message: 'Please input the repeat times of this tx!' }]}
                        >                            
                            <InputNumber min={0} style={{width: 470, textAlign: 'center'}}/>
                        </Form.Item>

                        {
                            repeaTimes > 0 ? 
                                <Form.Item 
                                    name="repeatCondition" 
                                    label="repeat condition"
                                    rules={[{ required: true, message: 'Please input the repeat condition of this tx!' }]}
                                >                            
                                    <Select style={{width: 470, textAlign: 'center'}}>
                                        <Option value={'sentSuccess'}>sent successful</Option>
                                        <Option value={'blockedSuccess'}>executed/blocked successful</Option>
                                    </Select>
                                </Form.Item>
                            :
                            null
                        }
                        
                    </Form>
                </Modal>
            <Modal
                visible={newChainVisible}
                title={"Add new chain"}
                okText="Confirm"
                cancelText="Cancel"
                onCancel={() => setNewChainVisible(false)}
                onOk={handleAddNewChainOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setNewChainVisible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleAddNewChainOk}>
                      Confirm
                    </Button>
                  ]}
                >
                    <Form
                        form={addNewChainForm}
                        layout="vertical"
                        name="form_in_modal"
                    >
                        <Form.Item 
                            name="chainName" 
                            label="chainName"
                            rules={[{ required: true, message: 'Please input the name of new chain!' }]}
                        >                            
                            <Input />
                        </Form.Item>

                        <Form.Item 
                            name="chainId" 
                            label="chainId"
                            rules={[{ required: true, message: 'Please input the chainId of new chain!' }, {validator: checkChainId}]}
                        >                            
                            <InputNumber min={1}/>
                        </Form.Item>
                    </Form>
                </Modal>

            <Modal
                visible={importABIVisible}
                title={"Import ABI"}
                okText="Confirm"
                cancelText="Cancel"
                onCancel={() => setImportABIVisible(false)}
                onOk={handleImportABIOK}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setImportABIVisible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleImportABIOK}>
                      Confirm
                    </Button>
                  ]}
                >
                <Input.TextArea defaultValue='' allowClear placeholder='[....]' rows={6} onChange={e => importedABI = e.target.value}/>    
            </Modal>
            <Modal
                visible={readCEXVisible}
                title={modalTitle + " " + curStep + '/' + totalStep}
                okText="Next"
                cancelText="Cancel"
                onCancel={() => setReadCEXVisible(false)}
                onOk={handleReadCEXOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setReadCEXVisible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleReadCEXOk}>
                      Next
                    </Button>
                  ]}
                >
                    <Form
                        form={readCEXForm}
                        layout="vertical"
                        name="form_in_modal"
                        initialValues={initialValuesOfReadCEXConfig}
                    >
                        <Form.Item 
                            name="title" 
                            label="title"
                            rules={[{ required: true, message: 'Please input the title!' }, {validator: checkTitle}]}
                        >                            
                            <Input type='text' style={{ width: 470 }}/>
                        </Form.Item>
                        <Form.Item 
                            name="whichCex" 
                            label="CEX"
                            rules={[{ required: true, message: 'Please select CEX!' }]}
                        >                            
                            <Select placeholder="Select CEX" style={{width: 470, textAlign: 'center'}}>
                                {
                                    Object.entries(CEXInfo).map(entry => 
                                        <Option title={entry[0]} value={entry[0]}>{entry[0]}</Option>
                                    )
                                }
                            </Select>
                        </Form.Item>

                        <Form.Item 
                            name="tradingPair" 
                            label="Trading Pair"
                            rules={[{ required: true, message: 'Please select the trading pair!' }]}
                        >                            
                            <Select showSearch placeholder="Select Trading Pair" style={{width: 470, textAlign: 'center'}} onSelect={getPrice}>
                                {
                                    isEmptyObj(whichCex) ? null :
                                        CEXInfo[whichCex].tradingPairs.map((tradingPair: any) => 
                                            <Option value={tradingPair.symbol}>{tradingPair.tradingName}</Option>
                                        )
                                }
                            </Select>
                        </Form.Item>
                        {
                            'current price: ' + currentPrice
                        }
                    </Form>
            </Modal>
            <Modal
                visible={readWeb2Visible}
                title={modalTitle + " " + curStep + '/' + totalStep}
                okText="Next"
                cancelText="Cancel"
                onCancel={() => setReadWeb2Visible(false)}
                onOk={handleReadWeb2Ok}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setReadWeb2Visible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleReadWeb2Ok}>
                      Next
                    </Button>
                  ]}
                >
                    <Form
                        form={readWeb2Form}
                        layout="vertical"
                        name="form_in_modal"
                        initialValues={initialValuesOfReadWeb2Config}
                    >
                        <Form.Item 
                            name="title" 
                            label="title"
                            rules={[{ required: true, message: 'Please input the title!' }, {validator: checkTitle}]}
                        >                            
                            <Input type='text' style={{ width: 470 }}/>
                        </Form.Item>
                        <Form.Item 
                            name="requestType" 
                            label="Request Type"
                            rules={[{ required: true, message: 'Please select type of request to web2!' }]}
                        >                            
                            <Select placeholder="Select Type of Request" style={{width: 470, textAlign: 'center'}}>
                                {
                                    [
                                        <Option value='URL'>URL</Option>,
                                        <Option value='Script'>Script</Option>
                                    ]
                                }
                            </Select>
                        </Form.Item>

                        <Form.Item 
                            name="requestContent" 
                            label="URL/Script"
                            rules={[{ required: true, message: 'Please input URL or Script!' }]}
                        >               
                        {
                            requestType == 'URL' ? 
                                <Input type='text' style={{ width: 470 }}/>
                                    :
                                <Space>
                                    <Input.TextArea rows={6}  style={{width: 390}} placeholder='input js function. eg: async function() {var obj; ...; return JSON.stringify(obj);}'/>
                                    <Button colorScheme='blue' variant='solid' onClick={() => testScript('requestContent')}>Test</Button>
                                </Space>
                        }         
                        </Form.Item>
                    </Form>
            </Modal>
            <Modal
                visible={sendTGMsgVisible}
                title={modalTitle + " " + curStep + '/' + totalStep}
                okText="Next"
                cancelText="Cancel"
                onCancel={() => setSendTGMsgVisible(false)}
                onOk={handleTGMsgOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setSendTGMsgVisible(false)}>
                      Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleTGMsgOk}>
                      Next
                    </Button>
                  ]}
                >
                    <Form
                        form={sendTGMsgForm}
                        layout="vertical"
                        name="form_in_modal"
                        initialValues={initialValuesOfTgMsgConfig}
                    >
                        <Form.Item 
                            name="title" 
                            label="title"
                            rules={[{ required: true, message: 'Please input the title!' }, {validator: checkTitle}]}
                        >                            
                            <Input type='text' style={{ width: 470 }}/>
                        </Form.Item>
                        <Form.Item 
                            name="toUserId" 
                            label="User ID"
                            rules={[{ required: true, message: 'Please input the user id!' }]}
                        >                            
                            <InputNumber min={1} style={{width: 235}}/>
                        </Form.Item>

                        <Form.Item 
                            name="message" 
                            label="Message"
                            rules={[{ required: true, message: 'Please input the message!' }]}
                        >                            
                            <Input type='text' style={{ width: 470 }}/>
                        </Form.Item>
                    </Form>
            </Modal>
            <Modal
                visible={clearResultVisible}
                title={modalTitle + " " + curStep + '/' + totalStep}
                okText="Next"
                cancelText="Cancel"
                onCancel={() => setClearResultVisible(false)}
                onOk={handleClearResultOk}
                footer={[
                    <Button colorScheme='blue' variant='solid' onClick={() => setClearResultVisible(false)}>
                    Cancel
                    </Button>,
                    <Button ml='2' colorScheme='blue' variant='solid' onClick={handleClearResultOk}>
                    Next
                    </Button>
                ]}
                >
                    <Form
                        form={clearResultForm}
                        layout="vertical"
                        name="form_in_modal"
                        initialValues={initialValuesOfClearResult}
                    >
                        <Form.Item 
                            name="title" 
                            label="title"
                            rules={[{ required: true, message: 'Please input the title!' }, {validator: checkTitle}]}
                        >                            
                            <Input type='text' style={{ width: 470 }}/>
                        </Form.Item>
                        <Form.Item 
                            name="subscripts" 
                            label="subscripts"
                            rules={[{ required: true, message: 'Please select the subscript which result will be cleared' }]}
                        >                            
                            <Select mode="multiple" placeholder="Select subScript" style={{width: 470, textAlign: 'center'}}>
                                {
                                    Object.entries(getSubScripts()).map(entry => 
                                        <Option title={entry[0]} value={entry[0]}>{entry[0]}</Option>
                                    )
                                }
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    visible={stopScriptVisible}
                    title={modalTitle + " " + curStep + '/' + totalStep}
                    okText="Next"
                    cancelText="Cancel"
                    onCancel={() => setStopScriptVisible(false)}
                    onOk={handleStopScriptOk}
                    footer={[
                        <Button colorScheme='blue' variant='solid' onClick={() => setStopScriptVisible(false)}>
                        Cancel
                        </Button>,
                        <Button ml='2' colorScheme='blue' variant='solid' onClick={handleStopScriptOk}>
                        Next
                        </Button>
                    ]}
                    >
                        <Form
                            form={clearResultForm}
                            layout="vertical"
                            name="form_in_modal"
                            initialValues={initialValuesOfStopScript}
                        >
                            <Form.Item 
                                name="title" 
                                label="title"
                                rules={[{ required: true, message: 'Please input the title!' }, {validator: checkTitle}]}
                            >                            
                                <Input type='text' style={{ width: 470 }}/>
                            </Form.Item>
                        </Form>
                    </Modal>
        </div>
        ); 
}


export default ScriptEditor;