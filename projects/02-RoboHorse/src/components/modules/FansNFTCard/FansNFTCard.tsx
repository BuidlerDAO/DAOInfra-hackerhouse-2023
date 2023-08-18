import { 
  Box, HStack, Image, SimpleGrid, useColorModeValue, Tooltip, Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
  InputGroup,
  InputRightAddon,
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
  Input,
  Badge,
  Checkbox
} from '@chakra-ui/react';
import { Eth } from '@web3uikit/icons';
import React, { FC, useEffect, useState} from 'react';
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { MergeType } from 'utils/config';
import { isEmptyObj } from 'utils/utils';
import { getEllipsisTxt } from 'utils/format';
import { useWeb3React } from "@web3-react/core";
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import ERC3525Market from 'abi/erc3525Market.json';


type FansNFTInfo = {
  marketFactory: any;
  market: any;
  fansNFT: any;
  tokenId: number;
  slotId: number;
  owner: string;
  image: string;
  value: string;
  symbol: string;
  setMergeInfo: (type: MergeType, tokenId: number, burnedXEN: number) => void;
  refresh: () => void;
}

const FansNFTCard: FC<FansNFTInfo> = ({ marketFactory, market, fansNFT, symbol, tokenId, slotId, owner, image, value, setMergeInfo, refresh }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');

  const router = useRouter()
  const { account, library: web3 } = useWeb3React();
  const modal1 = useDisclosure();
  const modal2 = useDisclosure();
  const modal3 = useDisclosure();
  const modal4 = useDisclosure();

  const [erc3525Market, setERC3525Market] = useState<any>(market);
  const [approved, setApproved] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isComfirming, setIsComfirming] = useState<boolean>(false);
  const [isSpliting, setIsSpliting] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [splitValue, setSplitValue] = useState<number>(1);
  const [orderValue, setOrderValue] = useState<number>(1);
  const [orderPrice, setOrderPrice] = useState<number>(1);
  const [receiver, setReceiver] = useState<string>('');
  const [packed, setPacked] = useState<boolean>(false);
  const [toTokenId, setToTokenId] = useState<number>(0);
  const [mergeValue, setMergeValue] = useState<number>(1);

  const toast = useToast();
  const initialRef = React.useRef(null);
  let toAddr = '';

  useEffect(() => {
    if (erc3525Market!= null) {
      checkApprove();
    }
  }, [orderValue]);
  
  const buildMarket = () => {
    const contractFunc = marketFactory.methods["buildMarket"];
    const data = contractFunc(fansNFT._address, slotId).encodeABI();
    const tx = {
        from: account,
        to: marketFactory._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(fansNFT._address, slotId).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsBuilding(true);
          })
          .on('receipt', () => {
            setIsBuilding(false);
            marketFactory.methods["erc3525MarketBuiltMap"](fansNFT._address, slotId).call({from: account}).then((marketAddr: string) => {
              setERC3525Market(new web3.eth.Contract(ERC3525Market, marketAddr));
            })
          })
          .on('error', () => {
            setIsBuilding(false);
            toast({
              title: 'Failed',
              description: "Build market failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }
  const approveValue = () => {
    const contractFunc = fansNFT.methods['approve(uint256,address,uint256)'];
    const data = contractFunc(tokenId, erc3525Market._address, value).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, erc3525Market._address, value).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsApproving(true);
          })
          .on('receipt', () => {
            setIsApproving(false);
            setApproved(true);
          })
          .on('error', () => {
            setIsApproving(false);
            toast({
              title: 'Failed',
              description: "Approve DNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const checkApprove = () => {
    const contractFunc = fansNFT.methods['allowance(uint256,address)'];
    contractFunc(tokenId, erc3525Market._address).call({from: account}).then((allowancedAmount: number) => {
      setApproved(allowancedAmount >= orderValue);
    })
  }

  const checkApproveAndAddOrder = () => {
    const contractFunc = fansNFT.methods['allowance(uint256,address)'];
    contractFunc(tokenId, erc3525Market._address).call({from: account}).then((allowancedAmount: number) => {
      if (allowancedAmount >= orderValue) {
        addOrder();
      } else {
        toast({
          title: 'Info',
          description: "Please approve value firstly",
          status: 'info',
          position: 'bottom-right',
          isClosable: true,
        });
      }
    })
  }

  const addOrder = () => {
    const price = '0x' + new BigNumber(orderPrice).shiftedBy(18).toString(16);
    const contractFunc = erc3525Market.methods['addOrder'];     
    const data = contractFunc(tokenId, orderValue, price, packed).encodeABI();
    const tx = {
        from: account,
        to: erc3525Market._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, orderValue, price, packed).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsComfirming(true);
          })
          .on('receipt', () => {
            modal4.onClose();
            setIsComfirming(false);
            refresh();
          })
          .on('error', () => {
            setIsComfirming(false);
            toast({
              title: 'Failed',
              description: "Deposit DNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const splitFansNFT = () => {
    const contractFunc = fansNFT.methods['transferFrom(uint256,address,uint256)']; 
    const data = contractFunc(tokenId, packed ? account : receiver, splitValue).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, packed ? account : receiver, splitValue).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsSpliting(true);
          })
          .on('receipt', () => {
            modal1.onClose();
            setIsSpliting(false);
            router.reload();
          })
          .on('error', () => {
            setIsSpliting(false);
            toast({
              title: 'Failed',
              description: "Split DNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const transferFansNFT = () => {
    console.log(account, toAddr, tokenId);
    const contractFunc = fansNFT.methods['transferFrom(address,address,uint256)']; 
    const data = contractFunc(account, toAddr, tokenId).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(account, toAddr, tokenId).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsTransferring(true);
          })
          .on('receipt', () => {
            modal2.onClose();
            setIsTransferring(false);
            router.reload();
          })
          .on('error', () => {
            setIsTransferring(false);
            toast({
              title: 'Failed',
              description: "Transfer DNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const mergeFansNFT = () => {
    const contractFunc = fansNFT.methods['transferFrom(uint256,uint256,uint256)']; 
    const data = contractFunc(tokenId, toTokenId, mergeValue).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, toTokenId, mergeValue).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsMerging(true);
          })
          .on('receipt', () => {
            modal3.onClose();
            setIsMerging(false);
            router.reload();
          })
          .on('error', () => {
            setIsTransferring(false);
            toast({
              title: 'Failed',
              description: "Merge failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }


  const handleToAddrChange = (e: any) => {
    toAddr = e.target.value;    
  }

  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <Box>
        <Image
          src={image}
          alt={'FansNFT'}   
          objectFit="fill"
        /> 
      </Box>
      <HStack mt="2" alignItems={'center'} justify={"space-between"}>
        <Box fontWeight="semibold" as="h4" noOfLines={1}>
          {symbol} #{tokenId}
          <Badge borderRadius='full' px='2' colorScheme='teal' ml="1">
            Slot #{slotId}    
          </Badge> 
        </Box>
        <HStack alignItems={'center'}>
          <Eth fontSize="20px" />
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="smaller">
            ERC3525
          </Box>
        </HStack>
      </HStack>
      <HStack mt="2" alignItems={'center'} justify={"space-between"}>
        <HStack alignItems={'center'}>
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
          <strong>owner:</strong>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">
            {getEllipsisTxt(owner)}
          </Box>
        </HStack>
        <HStack alignItems={'center'}>
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
          <strong>value:</strong>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">
            {value}
          </Box>
        </HStack>
      </HStack>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
        <Box>
          <HStack alignItems={'center'} justify='space-between'>
            <Tooltip label={`FansNFT could be split into smaller ones with smaller value.`}>
              <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal1.onOpen}>Split</Button>
            </Tooltip>
            <Tooltip label={`FansNFT's value could be merged into another one.`}>
              <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal3.onOpen}>Merge</Button>
            </Tooltip>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal2.onOpen}>Transfer</Button>
            {
              isEmptyObj(erc3525Market) ? 
                <Tooltip label={`Build market for this NFT`}>
                  <Button colorScheme='teal' variant='outline' disabled={account !== owner} 
                          onClick={() => buildMarket()} isLoading={isBuilding} loadingText={'Building'}>Build Market</Button>
                </Tooltip>
                :
                <Tooltip label={`List this NFT in market`}>
                  <Button colorScheme='teal' variant='outline' disabled={account !== owner} 
                          onClick={modal4.onOpen}>Add Order</Button>
                </Tooltip>
            }
            
          </HStack>
        </Box>
      </SimpleGrid>
    </Box>
    <Modal
        initialFocusRef={initialRef}
        isOpen={modal1.isOpen}
        onClose={modal1.onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Split value of this FansNFT</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>
              Receiver
              <Checkbox ml={2} onChange={(e) => setPacked(e.target.checked)}>To Me</Checkbox>
            </FormLabel>
            <Input ref={initialRef} disabled={packed} onChange={(e) => setReceiver(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Value</FormLabel>
            <NumberInput step={1} defaultValue={1} min={1}>
              <NumberInputField onChange={(e) => setSplitValue(parseInt(e.target.value))} value={splitValue}/>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={() => splitFansNFT()} isLoading={isSpliting} loadingText='Spliting'>
            Split
          </Button>
          <Button onClick={modal1.onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <Modal
        isOpen={modal2.isOpen}
        onClose={modal2.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer FansNFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>To Address</FormLabel>
              <Input onChange={handleToAddrChange}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => transferFansNFT()} isLoading={isTransferring} loadingText='Transferring'>
              Transfer
            </Button>
            <Button onClick={modal2.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        initialFocusRef={initialRef}
        isOpen={modal3.isOpen}
        onClose={modal3.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Split value of this FansNFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>
                To TokenId
              </FormLabel>
              <NumberInput step={1} defaultValue={0} min={1}>
                <NumberInputField onChange={(e) => setToTokenId(parseInt(e.target.value))} value={toTokenId}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl mt={2}>
              <FormLabel>Value</FormLabel>
              <NumberInput step={1} defaultValue={1} min={1}>
                <NumberInputField onChange={(e) => setMergeValue(parseInt(e.target.value))} value={mergeValue}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => mergeFansNFT()} isLoading={isMerging} loadingText='Merging'>
              Merge
            </Button>
            <Button onClick={modal3.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        initialFocusRef={initialRef}
        isOpen={modal4.isOpen}
        onClose={modal4.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>List on Market</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <Checkbox onChange={(e) => setPacked(e.target.checked)}>Packed Sold</Checkbox>
              <Tooltip label={`If selected, the value in this NFT will be packed and sold, otherwise can be sold piecemeal.`}>
                <QuestionOutlineIcon w={3} h={3} ml={1}/>
              </Tooltip>
            </FormControl>
            <FormControl mt={4}>
                  <FormLabel>
                    Amount
                  </FormLabel>
                  <NumberInput step={1} defaultValue={1} min={1} max={parseInt(value)}>
                    <NumberInputField onChange={(e) => setOrderValue(parseInt(e.target.value))} value={orderValue}/>
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
            <FormControl mt={4}>
              <FormLabel>Unit Price</FormLabel>
              <NumberInput min={0.0000001}>
                <InputGroup>
                  <NumberInputField onChange={(e) => setOrderPrice(Number(e.target.value))} value={orderPrice}/>
                  <InputRightAddon children='ETH' />
                </InputGroup>               
              </NumberInput>
              <FormLabel>{packed ? `Packed Price: ${orderValue * orderPrice} ETH` : ''}</FormLabel>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            {
              approved ? 
                null
                :
                <Button colorScheme='teal' mr={3} onClick={() => approveValue()} isLoading={isApproving} loadingText='Approving'>
                  Approve
                </Button>
            }
            <Button colorScheme='blue' mr={3} onClick={() => checkApproveAndAddOrder()} isLoading={isComfirming} loadingText='Comfirming'>
              Comfirm
            </Button>
            <Button onClick={modal4.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FansNFTCard;
