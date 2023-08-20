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
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Image
  } from '@chakra-ui/react';
  import React, { FC, useEffect, useState } from 'react';
  import { getEllipsisTxt } from 'utils/format';
  import MarketHelperAbi from 'abi/marketHelper.json';
  import NFT3525MarketAbi from 'abi/erc3525Market.json';
  import { useWeb3React } from "@web3-react/core";
  import { marketHelperAddr } from 'utils/config';
  import { isEmptyObj } from 'utils/utils';
  import { useRouter } from 'next/router';
  import { getImageInfo } from 'utils/resolveIPFS';
  import BigNumber from 'bignumber.js';
  import { useAccount, useConnect, useNetwork, useContractRead } from 'wagmi'
  
  const OrderList: FC = () => {
    const { address: account } = useAccount();
    const { chain } = useNetwork();
  
    const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [orderList, setOrderList] = useState<any[]>([]);
    const [isBuying, setIsBuying] = useState<boolean>(false);
    const [isComfirming, setIsComfirming] = useState<boolean>(false);
    const [market, setMarket] = useState<any>(null);
    const [nftImage, setNFTImage] =useState<string>('');
    const [amount, setAmount] = useState<number>(1);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [marketHelper, setMarketHelper] =useState<any>(null);
    const [marketAddress, setMarketAddress] = useState<string>("")
    const [marketHelperAddress, setMarketHelperAddress] = useState<string>("")
    const [orderNumber, setOrderNumber] = useState<number>(0);
  
    const toast = useToast();
    const router = useRouter();
  
    const initialRef = React.useRef(null)
    const finalRef = React.useRef(null)
  
    useEffect(() => {
      if (chain != null) {        
        const { marketAddress } = router.query;
        setMarketHelperAddress(marketHelperAddr[chain.id as number])
        setMarketAddress(marketAddress)

        const { tokenURI } = router.query;
        getImageInfo(tokenURI as string).then((image: string) => {
            setNFTImage(image);
        })
      }
    }, [chain])

    useContractRead({
      address: marketAddress,
      abi: NFT3525MarketAbi,
      functionName: 'getOrderCount',
      watch: true,
      onSuccess(length: number) {
        console.log('getOrderCount', length);
        setOrderNumber(length)
      },
      onError(error) {
        console.log('Error', error)
      },
    })

    useContractRead({
      address: marketHelperAddress,
      abi: MarketHelperAbi,
      functionName: 'getOrders',
      enabled: orderNumber > 0,
      watch: true,
      args: [marketAddress, 0, orderNumber, false],
      onSuccess(orderList: any[]) {
        console.log('getOrders', orderList);
        setOrderList(orderList);
      },
      onError(error) {
        console.log('Error', error)
      },
    })
  
    // useEffect(() => {
    //   if (!isEmptyObj(market)) {
    //     getOrders();
    //     const { tokenURI } = router.query;
    //     getImageInfo(tokenURI as string).then((image: string) => {
    //         setNFTImage(image);
    //     })
    //   }
    // }, [market])
  
    // const getOrders = () => {
    //   let totalLength = 0;     
    //   market.methods['getOrderCount']().call({from: account}).then((length: number) => {
    //     totalLength = length;
    //     marketHelper.methods['getOrders'](market._address, 0, length, false).call({from: account}).then((orderList: any[]) => {
    //         console.log(orderList);
    //         setOrderList(orderList);
    //     })
    //   })
    // }

    const buy = (orderId: number, amount: number, value: string, bComfirm: boolean) => {
      const contractFunc = market.methods['buy'];     
      const data = contractFunc(orderId, amount).encodeABI();
     
      const tx = {
          from: account,
          to: market._address,
          data,
          value,
          gasLimit: 0
      }
      console.log(tx);
      contractFunc(orderId, amount).estimateGas({from: account, value}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              bComfirm ? setIsComfirming(true) : setIsBuying(true);
            })
            .on('receipt', () => {
              bComfirm ? setIsComfirming(false) : setIsBuying(false);
            })
            .on('error', () => {
              bComfirm ? setIsComfirming(false) : setIsBuying(false);
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

    const makeOrder = (orderId: number, price: number, amount: number, bPacked: boolean) => {
      if (bPacked) {
        buy(parseInt(orderId.toString()), parseInt(amount.toString()), `0x${new BigNumber(price).multipliedBy(parseInt(amount.toString())).toString(16)}`, false);
      } else {
        setOrderInfo({orderId, price, amount});
        onOpen();
      }
    }
  
    return (
      <>
        <Heading size="lg" marginBottom={6}>
          <HStack justifyContent='space-around'>
             <Image
                w={200}
                h={200}
                src={nftImage}
                alt={'NFT'}   
                objectFit="fill"
            />
          </HStack>
        </Heading>
        {orderList?.length ? (
          <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
            <TableContainer w={'full'}>
              <Table className="table-tiny">
                <Thead>
                  <Tr>
                    <Th>Token Id</Th>
                    <Th>Seller's Address</Th>
                    <Th>Price</Th>
                    <Th>Amount</Th>
                    <Th>Packed</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orderList?.map((order, key) => (
                    <Tr key={`${order.id}-${key}-tr`} _hover={{ bgColor: hoverTrColor }}>      
                      <Td>                      
                        {Number(order.id)}
                      </Td>                
                      <Td>
                        {getEllipsisTxt(order.seller)}
                      </Td>    
                      <Td>{new BigNumber(order.price).shiftedBy(-18).toFixed(3)} ETH</Td>              
                      <Td>{order.amount}</Td>   
                      <Td>{order.bPacked ? 'yes' : 'no'}</Td>   
                      <Td>
                        <Button 
                          colorScheme={order.bPacked ? 'teal' : 'blue' }
                          mr={3} 
                          isLoading={isBuying}
                          loadingText={"Buying"}
                          onClick={() => makeOrder(order.id, order.price, order.amount, order.bPacked)}>
                            {order.bPacked ? 'Buy (Packed)' : 'Buy' }
                        </Button>
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
          <Box>Looks like there is no order.</Box>
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
            <ModalHeader>Buy FansNFT</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>Amount</FormLabel>
                <NumberInput step={1} defaultValue={1} min={1}>
                  <NumberInputField onChange={(e) => setAmount(parseInt(e.target.value))} value={amount}/>
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
  
            <ModalFooter>
              <Button 
                colorScheme='blue' 
                mr={3} 
                onClick={() => buy(orderInfo.orderId, amount, `0x${new BigNumber(orderInfo.price).multipliedBy(amount).toString(16)}`, true)} 
                isLoading={isComfirming} 
                loadingText='Buying'>
                Comfirm
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  };
  
  export default OrderList;
  