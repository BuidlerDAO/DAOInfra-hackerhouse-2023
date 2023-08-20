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
    Image
  } from '@chakra-ui/react';
  import React, { FC, useEffect, useState } from 'react';
  import MarketFactoryAbi from 'abi/marketFactory.json';
  import MarketHelperAbi from 'abi/marketHelper.json';
  import { useWeb3React } from "@web3-react/core";
  import { marketFactoryAddr, marketHelperAddr } from 'utils/config';
  import { useRouter } from 'next/router';
  import { getImageInfo } from 'utils/resolveIPFS';
  import BigNumber from 'bignumber.js';
  import { useAccount, useConnect, useNetwork, useContractRead } from 'wagmi'
  
  const ERC3525MarketList: FC = () => {
    const { address: account } = useAccount();
    const { chain } = useNetwork();

    const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure()
  
    const [marketList, setMarketList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [marketFactory, setMarketFactory] =useState<any>(null);
    const [marketHelper, setMarketHelper] =useState<any>(null);
    const [nftAddr, setNFTAddr] = useState<string>('');
    const [client, setClient] = useState<any>(null);
    const [marketFactoryAddress, setMarketFactoryAddress] = useState<string>("")
    const [marketHelperAddress, setMarketHelperAddress] = useState<string>("")
    const [marketLength, setMarketLength] = useState<number>(0)
    const router = useRouter();
  
    const initialRef = React.useRef(null)
    const finalRef = React.useRef(null)
    const filteredAddr: Record<string, boolean> = {}


    useEffect(() => {
      if (chain != null) {        
        setMarketFactoryAddress(marketFactoryAddr[chain.id as number])
        setMarketHelperAddress(marketHelperAddr[chain.id as number])
      }
    }, [chain])

    useContractRead({
      address: marketFactoryAddress,
      abi: MarketFactoryAbi,
      functionName: 'getMarketLength',
      watch: true,
      enabled: marketFactoryAddress != "" && marketHelperAddress != "",
      onSuccess(length: number) {
        console.log('getMarketLength', length);
        setMarketLength(length)
      },
      onError(error) {
        console.log('Error', error)
      },
    })

    useContractRead({
      address: marketHelperAddress,
      abi: MarketHelperAbi,
      functionName: 'getMarketList',
      args: [marketFactoryAddress, 0, marketLength],
      enabled: marketLength > 0,
      onSuccess(marketInfos: any[]) {
        console.log('getMarketList', marketInfos);
        const markets: any[] = [];
        marketInfos.forEach((marketInfo: any) => {
            getImageInfo(marketInfo.nftTokenURI).then((image: string) => {
          
            markets.push({...marketInfo, image});
            if (markets.length - marketInfos.length === 0) {
              markets.sort((a: any, b: any) => Number(b.totalVolumn - a.totalVolumn)) 
              setMarketList(markets);
            }
          })
        })
      },
    })
  
    return (
      <>
        <Heading size="lg" marginBottom={6}>
          <HStack justifyContent='space-between'>
            <HStack spacing='18px'>
              <div>Current Market List</div>
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
                    <Th>KOL's Twitter</Th>
                    <Th>FansNFT</Th>
                    <Th>Floor Price</Th>
                    <Th>Volumn</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {marketList?.map((market, key) => (
                    <Tr key={`${market.marketAddr}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer" 
                        onClick={() => router.push(`/orderList?marketAddress=${market.marketAddr}&tokenURI=${market.nftTokenURI}`)}>      
                      <Td>                      
                        <Avatar 
                          opacity="0.8" 
                          size='lg' 
                          name={market.twitterId} 
                          src={`https://unavatar.io/twitter/${market.twitterId.substr(1)}`}
                          onClick={() => window.open (`https://twitter.com/${market.twitterId}`, '_blank')}
                          cursor="pointer">
                        </Avatar>
                      </Td>                
                      <Td>
                        <Image
                          src={market.image}
                          alt={'NFT'}   
                          objectFit="fill"
                        />
                      </Td>    
                      <Td>{new BigNumber(market.floorPrice).shiftedBy(-18).toFixed(3)} ETH</Td>              
                      <Td>{new BigNumber(market.totalVolumn).shiftedBy(-18).toFixed(3)} ETH</Td>   
                    </Tr>
                  ))}
                </Tbody>
                <Tfoot>
                </Tfoot>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box>Looks like there is no FansNFT.</Box>
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
  
  export default ERC3525MarketList;
  