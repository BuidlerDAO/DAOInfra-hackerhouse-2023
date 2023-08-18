import {
  Button,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  Heading,
  Box,
  HStack,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Avatar,
  useToast
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useWeb3React } from "@web3-react/core";
import { accessManagerAddr } from 'utils/config';
import { isEmptyObj } from 'utils/utils';
import { useRouter } from 'next/router';
import { getEllipsisTxt } from "utils/format";
import { ethers } from 'ethers';
import AccessManager from 'abi/accessManager.json';


const ScriptMarket: FC = () => {
  const { account, library: web3, chainId } = useWeb3React();

  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()


  const [marketList, setMarketList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nftAddr, setNFTAddr] = useState<string>('');
  const [accessManager, setAccessManager] = useState<any>(null);

  const router = useRouter();
  const toast = useToast();

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)
  const filteredAddr: Record<string, boolean> = {}

  useEffect(() => {
    if (web3 != null) {
      setAccessManager(new web3.eth.Contract(AccessManager, accessManagerAddr[chainId as number]));
    }
  }, [web3])

  useEffect(() => {
    if (accessManager != null) {
      getMarketList();
    }
  }, [accessManager])

  const getMarketList = () => {
    let totalLength = 0;
    let contractFunc = accessManager.methods['lengthOfUuidList'];        
    contractFunc().call({from: account}).then((length: number) => {
      console.log(length);
      totalLength = length;
      accessManager.methods['getUuids'](0, totalLength).call({from: account}).then((marketInfos: any[]) => {
        console.log('marketInfos', marketInfos);
        const scripts: any[] = [];
        for (var i = 0; i < totalLength; i++) {
          scripts.push({author: marketInfos.authors[i], 
                        scriptName: marketInfos.names[i],
                        fansNFT: marketInfos.fansNFTs[i],
                        slotId: marketInfos.slotIds[i],
                        minValue: marketInfos.minValues[i]});
        }
        setMarketList(scripts);      
      })
    });
  }

  const downLoadScript = (author: string, srciptName: string, minValue: number) => {
    let contractFunc = accessManager.methods['downloadScript'];
    if (minValue > 0) {
      contractFunc = accessManager.methods['downloadScriptWithCondition']; 
    }       
    contractFunc(author, srciptName).call({from: account}).then((scriptInfo: any) => {
      console.log(scriptInfo);
      if (scriptInfo[1] == false) {
        toast({
          title: 'Warning',
          description: "The script has been deleted by author.",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
      } else {
        const script = JSON.parse(ethers.utils.toUtf8String(scriptInfo[0]));
        script.name = script.name + '-' + author;
        
        const lsName = 'scriptList';
        var scriptList = global.localStorage.getItem(lsName);
        if (isEmptyObj(scriptList)) {
          scriptList = '[]';
        }
        scriptList = JSON.parse(scriptList);
        scriptList.push(script);
        global.localStorage.setItem(lsName, JSON.stringify(scriptList));

        toast({
          title: 'Success',
          description: "The script has been downloaded successfully.",
          status: 'success',
          position: 'bottom-right',
          isClosable: true,
        });
      }
    }).catch((e: any) => {
      console.log(e);
      toast({
        title: 'Fail',
        description: "You shoule have fansNFT of author firstly, then could download this script.",
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
    });    
  }

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Current Script Market</div>
          </HStack>
          <HStack spacing='18px'>
          </HStack>
        </HStack>
      </Heading>
      {marketList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th>Author</Th>
                  <Th>Name</Th>
                  <Th>Fans NFT</Th>
                  <Th>Slot Id</Th>
                  <Th>Min Value</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {marketList?.map((market, key) => (
                  <Tr key={`${market.marketAddr}-${key}-tr`} _hover={{ bgColor: hoverTrColor }}>      
                    <Td>                      
                      {getEllipsisTxt(market.author)}
                    </Td>                
                    <Td>
                      {ethers.utils.toUtf8String(market.scriptName)}
                    </Td>    
                    <Td>{getEllipsisTxt(market.fansNFT)}</Td>              
                    <Td>{market.slotId}</Td>      
                    <Td>{market.minValue}</Td>  
                    <Td>
                      <Button colorScheme='teal' variant='solid' onClick={() => downLoadScript(market.author, market.scriptName, market.minValue)}>Download Script</Button>
                    </Td>   
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks like there is no script on market.</Box>
      )}
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Build FansNFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>NFT-721 Address</FormLabel>
              <Input ref={initialRef} onChange={(e) => setNFTAddr(e.target.value)} value={nftAddr}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={()=>{}} isLoading={isLoading} loadingText='Building'>
              Build
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScriptMarket;
