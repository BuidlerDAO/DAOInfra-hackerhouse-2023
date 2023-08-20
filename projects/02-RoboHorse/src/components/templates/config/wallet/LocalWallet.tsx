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
  InputRightElement,
  InputGroup,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { isEmptyObj } from 'utils/utils';
import { ethers } from 'ethers';

const LocalWallet: FC = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [accountList, setAccountList] = useState<any[]>([]);
  const [alias, setAlias] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [passwordShow, setPasswordShow] = React.useState(false);
  const [pkShow, setPKShow] = React.useState(false);

  const toast = useToast();
  const lsName = 'accountList';

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  useEffect(() => {
    var lsAccountList = global.localStorage.getItem(lsName);
    setAccountList(isEmptyObj(lsAccountList) ? [] : JSON.parse(lsAccountList as string));
  }, [])

  const importByPK = () => {
    const index = accountList.findIndex((item: any) => item.alias === alias);
    if (index > -1) {
      toast({
        title: 'Warning Message',
        description: `Dupulicated alias`,
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }

    setIsImporting(true);
    if (accountList.length > 0) {
        // firstly check password
        const keystore = accountList[0];
        ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password)
             .then(wallet => {
                const newWallet = new ethers.Wallet(privateKey);
                //this.encryptWallet(wallet, password, T('导入成功'));
                newWallet.encrypt(password, null).then((ksInfoStr) => {
                    const ksInfoObj = JSON.parse(ksInfoStr);
                    console.log(ksInfoObj);
                    ksInfoObj.alias = alias;
                    for (var i = 0; i < accountList.length; i++) {
                        if (accountList[i].address == ksInfoObj.address) {
                            toast({
                              title: 'Error Message',
                              description: `Dupulicated address: 0x${ksInfoObj.address}`,
                              status: 'error',
                              position: 'bottom-right',
                              isClosable: true,
                            });
                            return;
                        }
                    }
                    setAccountList([...accountList, ksInfoObj]);

                    global.localStorage.setItem(lsName, JSON.stringify([...accountList, ksInfoObj]));  
                    setIsImporting(false);                 
                    onClose();
                  }).catch(error => {
                    toast({
                      title: 'Error Message',
                      description: error.message,
                      status: 'error',
                      position: 'bottom-right',
                      isClosable: true,
                    });
                    setIsImporting(false);                 
                  });
             })
             .catch (resp => { 
                toast({
                  title: 'Error Message',
                  description: 'Password is wrong, please enter the same password as before',
                  status: 'error',
                  position: 'bottom-right',
                  isClosable: true,
                });
                setIsImporting(false);                 
              });
    } else {
        const newWallet = new ethers.Wallet(privateKey);
        newWallet.encrypt(password, null).then((ksInfoStr) => {
            const ksInfoObj = JSON.parse(ksInfoStr);
            console.log(ksInfoObj);
            ksInfoObj.alias = alias;
            
            setAccountList([...accountList, ksInfoObj]);

            global.localStorage.setItem(lsName, JSON.stringify([...accountList, ksInfoObj]));  
            setIsImporting(false);                 
            onClose();
        }).catch(error => {    
            toast({
              title: 'Error Message',
              description: error.message,
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });        
            console.log(error.message);
            setIsImporting(false);                 
        });
    }
}

  const deleteAccount = (address: string) => {
    const accountListInfo = accountList.filter(item => item.address !== address);
    setAccountList(accountListInfo);
    global.localStorage.setItem(lsName, JSON.stringify(accountListInfo));
  }
  

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Local Wallet List</div>
          </HStack>
          <HStack spacing='18px'>
            <Tooltip label={'Add new RPC information for a blockchain.'}>
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Import By Private Key</Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {accountList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th>Alias</Th>
                  <Th>Address</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {accountList?.map((accountInfo, key) => (
                  <Tr key={`${accountInfo.address}-${key}-tr`} _hover={{ bgColor: hoverTrColor }}>                                        
                    <Td>{accountInfo.alias}</Td>              
                    <Td>0x{accountInfo.address}</Td>   
                    <Td>
                      <Button colorScheme='teal' variant='solid' onClick={() => deleteAccount(accountInfo.address)}>Delete</Button>
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
          <ModalHeader>Account Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Alias</FormLabel>
              <Input ref={initialRef} onChange={(e) => setAlias(e.target.value)} value={alias}/>
            </FormControl>
            <FormControl>
              <FormLabel>Private Key</FormLabel>
              <InputGroup>
                <Input type={pkShow ? 'text' : 'password'} onChange={(e) => setPrivateKey(e.target.value)} value={privateKey}/>
                <InputRightElement width='4.5rem'>
                  <Button h='1.75rem' size='sm' onClick={() => setPKShow(!pkShow)}>
                    {pkShow ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input type={passwordShow ? 'text' : 'password'} onChange={(e) => setPassword(e.target.value)} value={password}/>
                <InputRightElement width='4.5rem'>
                  <Button h='1.75rem' size='sm' onClick={() => setPasswordShow(!passwordShow)}>
                    {passwordShow ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={importByPK} isLoading={isImporting} loadingText="Importing">
              Confirm
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LocalWallet;
