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
  Tooltip,
  HStack,
  useColorModeValue,
  useToast,
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
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { isEmptyObj } from 'utils/utils';


const RPCList: FC = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [rpcConfigInfoList, setRpcConfigInfoList] = useState<any[]>([]);
  const [chainName, setChainName] = useState<string>('');
  const [rpcChainId, setRpcChainId] = useState<string>('');
  const [https, setHttps] = useState<string>('');
  const [wss, setWss] = useState<string>('');
  const [modifiedChainId, setModifiedChainId] = useState<number>(0);

  const toast = useToast();
  const lsName = 'rpcConfig';

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  useEffect(() => {
    var rpcConfigInfoInLocal = global.localStorage.getItem(lsName);
    setRpcConfigInfoList(isEmptyObj(rpcConfigInfoInLocal) ? [] : JSON.parse(rpcConfigInfoInLocal as string));
  }, [])

  const addRPC = () => {
    const index = rpcConfigInfoList.findIndex((item: any) => item.rpcChainId === rpcChainId);
    if (index > -1) {
      toast({
        title: 'Failed',
        description: "RPC info has been configed for this blockchain",
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    rpcConfigInfoList.push({chainName, rpcChainId, https, wss});
    rpcConfigInfoList.sort((a: any, b: any) => a.rpcChainId - b.rpcChainId);
    setRpcConfigInfoList(JSON.parse(JSON.stringify(rpcConfigInfoList)));
    global.localStorage.setItem('rpcConfig', JSON.stringify(rpcConfigInfoList));
    onClose();
  }

  const deleteRPC = (chainId: number) => {
    const configInfo = rpcConfigInfoList.filter(item => item.rpcChainId !== chainId);
    setRpcConfigInfoList(configInfo);
    global.localStorage.setItem(lsName, JSON.stringify(configInfo));
  }
  
  const modify = (rpcInfo: any) => {
    console.log(rpcInfo);
    setChainName(rpcInfo.chainName);
    setRpcChainId(rpcInfo.rpcChainId);
    setHttps(rpcInfo.https);
    setWss(rpcInfo.wss);
    setModifiedChainId(rpcInfo.rpcChainId);
    onOpen();
  }

  const modifyRPC = () => {
    const configInfoList = rpcConfigInfoList.filter(item => item.rpcChainId !== modifiedChainId);
    configInfoList.push({chainName, rpcChainId, https, wss});
    configInfoList.sort((a: any, b: any) => a.rpcChainId - b.rpcChainId);
    setRpcConfigInfoList(configInfoList);
    global.localStorage.setItem(lsName, JSON.stringify(configInfoList));
    onClose();
  }

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Current RPC List</div>
          </HStack>
          <HStack spacing='18px'>
            <Tooltip label={'Add new RPC information for a blockchain.'}>
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Add</Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {rpcConfigInfoList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th>Chain Name</Th>
                  <Th isNumeric>Chain Id</Th>
                  <Th>HTTPS</Th>
                  <Th>WSS</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {rpcConfigInfoList?.map((rpcInfo, key) => (
                  <Tr key={`${rpcInfo.address}-${key}-tr`} _hover={{ bgColor: hoverTrColor }}>                                        
                    <Td>
                      {rpcInfo.chainName}
                    </Td>              
                    <Td isNumeric>{rpcInfo.rpcChainId}</Td>   
                    <Td>{rpcInfo.https}</Td>   
                    <Td>{rpcInfo.wss}</Td>   
                    <Td>
                      <Button mr={2} colorScheme='teal' variant='solid' onClick={() => modify(rpcInfo)}>Modify</Button>
                      <Button colorScheme='teal' variant='solid' onClick={() => deleteRPC(rpcInfo.rpcChainId)}>Delete</Button>
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
        <Box>Looks like there is no RPC configure.</Box>
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
          <ModalHeader>RPC Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Chain Name</FormLabel>
              <Input ref={initialRef} onChange={(e) => setChainName(e.target.value)} value={chainName}/>
            </FormControl>
            <FormControl>
              <FormLabel>Chain Id</FormLabel>
              <Input onChange={(e) => setRpcChainId(e.target.value)} value={rpcChainId}/>
            </FormControl>
            <FormControl>
              <FormLabel>Https</FormLabel>
              <Input onChange={(e) => setHttps(e.target.value)} value={https}/>
            </FormControl>
            <FormControl>
              <FormLabel>Wss</FormLabel>
              <Input onChange={(e) => setWss(e.target.value)} value={wss}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={modifiedChainId > 0 ? modifyRPC : addRPC}>
              Confirm
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RPCList;
