import { 
  Box, HStack, VStack, Input, SimpleGrid, useColorModeValue, Tooltip, Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Avatar,
  Checkbox
} from '@chakra-ui/react';
import { TbDeviceHeartMonitor } from 'react-icons/tb';
import { MdOutlineDescription, MdOutlineDeleteForever } from 'react-icons/md';
import { SiBlockchaindotcom } from 'react-icons/si';
import { BiPencil } from 'react-icons/bi';
import { VscDebugStart, VscDebugStop, VscDebugPause, VscDebugRestart } from 'react-icons/vsc';
import React, { FC, useEffect, useState } from 'react';
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useRouter } from 'next/router';
import { isEmptyObj, getSpanTime } from 'utils/utils';
import { evmChainIds, accessManagerAddr } from 'utils/config';
import { ETHLogo, BSCLogo, AvaxLogo, PolygonLogo, ArbitrumLogo, OptimismLogo } from 'utils/chainLogos';
import AccessManager from 'abi/accessManager.json';
import { getEllipsisTxt } from "utils/format";

type ScriptInfo = {
  name: string;
  desc: string;
  createdTime: number;
  scriptObj: any;
}

enum ScriptStatus {
  Idle = 1,
  Running,
  Pause
}

const ScriptCard: FC<ScriptInfo> = ({ name, desc, createdTime, scriptObj }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');
  const linkActiveColor = useColorModeValue('gray.200', 'gray.600');

  const { chainId, account, library: web3 } = useWeb3React();
  const [accessManager, setAccessManager] = useState<any>(null);

  useEffect(() => {
    if (web3 != null) {
      setAccessManager(new web3.eth.Contract(AccessManager, accessManagerAddr[chainId as number]));
    }
  }, [web3])

  let num = 0;
  let chainIdList: number[] = [];
  if (!isEmptyObj(scriptObj) && !isEmptyObj(scriptObj.subScripts)) {    
    const entries = Object.entries(scriptObj.subScripts);
    num = entries.length;
    const chainIds: any = {};
    entries.map((entry: any) => {
      const subScript = entry[1];
      const chainId = subScript.chainContractConfig.chain;      
      if (isEmptyObj(chainIds[chainId])) {
        chainIds[chainId] = true;
      }
    })
    chainIdList = Object.keys(chainIds).map((chainId: string) => parseInt(chainId));
  }

  const [subScriptNum, setSubScriptNum] = useState<number>(num);
  const [chainList, setChainList] = useState<number[]>(chainIdList);
  const [curStatus, setCurStatus] = useState<ScriptStatus>(ScriptStatus.Idle);
  const [logDisplay, setLogDisplay] = useState<boolean>(false);
  const [log, setLog] = useState<string>('no log');
  const [bFansNFT, setBFansNFT] = useState<boolean>(true);
  const [fansNFTAddr, setFansNFTAddr] = useState<string>('');
  const [slotId, setSlotId] = useState<number>(0);
  const [minValue, setMinValue] = useState<number>(0);
  const [isSavingScript, setIsSavingScript] = useState<boolean>(false);

  const modal1 = useDisclosure();
  const chainLogo: Record<number, any> = {1: <ETHLogo />, 5: <ETHLogo />, 10: <OptimismLogo />, 
                     56: <BSCLogo />,  97: <BSCLogo />, 
                     42161: <ArbitrumLogo />, 42170: <ArbitrumLogo />, 43114: <AvaxLogo />, 
                     80001: <PolygonLogo />}

  const router = useRouter();
  

  const changeScriptStatus = (e: any, state: ScriptStatus) => {
    e.stopPropagation();
    setCurStatus(state);
    switch(curStatus) {
      case ScriptStatus.Idle:
        break;
      case ScriptStatus.Running:
        break;
      case ScriptStatus.Pause:
        break;
    }
  }

  const getScriptStatusButton = () => {
    switch(curStatus) {
      case ScriptStatus.Idle:
        return <Tooltip label={"run this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStart />}
                  onClick={(e: any) => changeScriptStatus(e, ScriptStatus.Running)}/>
              </Tooltip>
        break;
      case ScriptStatus.Running:
        return <>
              <Tooltip label={"pause this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugPause />}
                  onClick={(e: any) => changeScriptStatus(e, ScriptStatus.Pause)}/>
              </Tooltip>
              <Tooltip label={"stop this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStop />}
                  onClick={(e: any) => changeScriptStatus(e, ScriptStatus.Idle)}/>
              </Tooltip>
          </>
        break;
      case ScriptStatus.Pause:
        return <>
              <Tooltip label={"restart this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugRestart />}
                  onClick={(e: any) => changeScriptStatus(e, ScriptStatus.Running)}/>
              </Tooltip>
              <Tooltip label={"stop this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStop />}
                  onClick={(e: any) => changeScriptStatus(e, ScriptStatus.Idle)}/>
              </Tooltip>
          </>
        break;
    }
  }

  const getChainLogoList = () => {
    return chainList.map((chainId: number) => {
      const logo = chainLogo[chainId];
      const chainName = evmChainIds[parseInt(chainId.toString())];
      if (isEmptyObj(logo)) {
        return <Tooltip label={chainName}><ETHLogo /></Tooltip>;
      }
      return <Tooltip label={chainName}>{logo}</Tooltip>;
    });
  }

  const editScriptInfo = (e: any) => {
    e.stopPropagation();
  }

  const deleteScript = (e: any) => {
    e.stopPropagation();
    const lsName = 'scriptList';
    var scriptList = global.localStorage.getItem(lsName);
    scriptList = JSON.parse(scriptList);
    const index = scriptList.findIndex(script => script.name == name);
    scriptList = [...scriptList?.slice(0, index), ...scriptList?.slice(index + 1)];
    global.localStorage.setItem(lsName, JSON.stringify(scriptList));
  }

  const saveOnBlockchain = (e: any) => {
    e.stopPropagation();
    modal1.onOpen();
  }

  const saveScript = () => {
    const hexName = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(name));
    const hexScript = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(scriptObj)));

    if (bFansNFT) {
      const contractFunc = accessManager.methods['saveScriptWithCondition']; 
      const data = contractFunc(hexName, hexScript, fansNFTAddr, slotId, minValue).encodeABI();
      const tx = {
          from: account,
          to: accessManager._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(hexName, hexScript, fansNFTAddr, slotId, minValue).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsSavingScript(true);
            })
            .on('receipt', () => {
              modal1.onClose();
              setIsSavingScript(false);
            })
            .on('error', () => {
              setIsSavingScript(false);
              toast({
                title: 'Failed',
                description: "Save script failed.",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    } else {
      const contractFunc = accessManager.methods['saveScript']; 
      const data = contractFunc(hexName, hexScript).encodeABI();
      const tx = {
          from: account,
          to: accessManager._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(hexName, hexScript).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsSavingScript(true);
            })
            .on('receipt', () => {
              modal1.onClose();
              setIsSavingScript(false);
            })
            .on('error', () => {
              setIsSavingScript(false);
              toast({
                title: 'Failed',
                description: "Save script failed.",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    }
  }

  

  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isComfirming, setIsComfirming] = useState<boolean>(false);
  const [totalSupplyInSlot, setTotalSupplyInSlot] = useState<number>(0);
  const [leftDays, setLeftDays] = useState<number>(0);
  const [days, setDays] = useState<number>(0);

  const toast = useToast();
  const initialRef = React.useRef(null);

  /*
  子脚本数量，体现复杂度
  涉及的链
  执行/暂停/继续/停止
  查看运行日志
  ES上传/修改/删除脚本：是否分享，分享条件，是否加密
  创建/更新时间
  */
  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" 
         borderColor={borderColor} onClick={() => {router.push(`/script/scriptEditor?scriptName=${name}`)}} cursor="pointer"
         _hover={{
          textDecoration: 'none',
          borderColor: linkActiveColor,
        }}>
      <HStack alignItems={'center'} justify={"flex-start"}>
        <Avatar 
          name={name}
          opacity="0.8" 
          size='lg'>
        </Avatar>
        <VStack align='stretch'>
          <Box fontWeight="semibold" as="h4" noOfLines={1}>
            {name.split('-')[0]}
            <Tooltip label={"modify script name/description"}>
              <Button 
                ml={1}
                cursor="point"
                size={'2'}
                colorScheme='teal' 
                variant='outline' 
                leftIcon={<BiPencil />}
                onClick={(e: any) => editScriptInfo(e)}
              />
            </Tooltip>
            <Tooltip label={"delete this script"}>
              <Button 
                ml={1}
                cursor="point"
                size={'2'}
                colorScheme='blue' 
                variant='outline' 
                leftIcon={<MdOutlineDeleteForever />}
                onClick={(e: any) => deleteScript(e)}
              />
            </Tooltip>
          </Box>
          <Box fontWeight="semibold" as="h4" noOfLines={1}>
            {name.split('-').length > 1 ? 'Author:' + getEllipsisTxt(name.split('-')[1]) : null}
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">   
            <HStack>
              <Tooltip label={"number of subscripts"}>
                <Button 
                  size='xs'
                  colorScheme='teal' 
                  variant='outline'
                  leftIcon={<MdOutlineDescription />}>
                  {subScriptNum}   
                </Button>
              </Tooltip>

              <Tooltip label={"save it on blockchain"}>
                <Button 
                  size='xs'
                  colorScheme='pink' 
                  variant='outline' 
                  leftIcon={<SiBlockchaindotcom />}
                  onClick={(e: any) => saveOnBlockchain(e)}
                >
                </Button>
              </Tooltip>
              {
                getScriptStatusButton()
              }
              <Tooltip label={"show the running log"}>
                <Button 
                  cursor="point"
                  size='xs'
                  colorScheme='blue' 
                  variant='outline' 
                  leftIcon={<TbDeviceHeartMonitor />}
                  onClick={(e: any) => { e.stopPropagation(); setLogDisplay(!logDisplay)}}/>
              </Tooltip>
            </HStack>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">
            <HStack>
              { getChainLogoList() }
            </HStack>
          </Box>
        </VStack>
      </HStack>
      <HStack alignItems={'center'} justify={"center"} mt={5}>
        <Box fontWeight="semibold" as="h4" fontSize="sm" noOfLines={1}>
          {desc}
        </Box>
      </HStack>  
      <HStack alignItems={'center'} justify={"center"} mt={5}>
        <Textarea
          display={logDisplay ? 'block' : 'none'}
          onChange={() => setLog(log)}
          value={log}
          size='sm'
        />
      </HStack> 
      <HStack alignItems={'center'} justify={"flex-end"} mt={5}>
        <Box fontWeight="semibold" as="h4" fontSize="sm" noOfLines={1}>
          {getSpanTime(createdTime / 1000)}
        </Box>
      </HStack> 
    </Box>
    <Modal
      initialFocusRef={initialRef}
      isOpen={modal1.isOpen}
      onClose={modal1.onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save Script to Blockchain</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
            <FormControl>
              <Checkbox defaultChecked onChange={(e) => setBFansNFT(e.target.checked)}>Only fans could access</Checkbox>
            </FormControl>
            <FormControl>
              <FormLabel>FansNFT address</FormLabel>
              <Input disabled={!bFansNFT} onChange={(e) => setFansNFTAddr(e.target.value)} value={fansNFTAddr}/>
            </FormControl>
            <FormControl>
              <FormLabel>Slot Id</FormLabel>
              <NumberInput disabled={!bFansNFT}  step={1} defaultValue={0} min={1}>
                <NumberInputField onChange={(e) => setSlotId(parseInt(e.target.value))} value={slotId}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Min Value</FormLabel>
              <NumberInput disabled={!bFansNFT}  step={1} defaultValue={0} min={1}>
                <NumberInputField onChange={(e) => setMinValue(parseInt(e.target.value))} value={minValue}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={() => saveScript()} isLoading={isSavingScript} loadingText='Uploading'>
            Upload
          </Button>
          <Button onClick={modal1.onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
};

export default ScriptCard;
