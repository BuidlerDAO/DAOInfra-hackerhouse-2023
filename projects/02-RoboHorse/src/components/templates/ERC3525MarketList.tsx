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
  import MarketFactory from 'abi/marketFactory.json';
  import MarketHelper from 'abi/marketHelper.json';
  import { useWeb3React } from "@web3-react/core";
  import { marketFactoryAddr, marketHelperAddr } from 'utils/config';
  import { useRouter } from 'next/router';
  import { getImageInfo } from 'utils/resolveIPFS';
  import BigNumber from 'bignumber.js';
  
  
  const ERC3525MarketList: FC = () => {
    const { account, library: web3, chainId } = useWeb3React();
  
    const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure()
  

    const [marketList, setMarketList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [marketFactory, setMarketFactory] =useState<any>(null);
    const [marketHelper, setMarketHelper] =useState<any>(null);
    const [nftAddr, setNFTAddr] = useState<string>('');
  
    const router = useRouter();
  
    const initialRef = React.useRef(null)
    const finalRef = React.useRef(null)
    const filteredAddr: Record<string, boolean> = {}
  
    useEffect(() => {
      if (web3 != null) {
        setMarketFactory(new web3.eth.Contract(MarketFactory, marketFactoryAddr[chainId as number]));
        setMarketHelper(new web3.eth.Contract(MarketHelper, marketHelperAddr[chainId as number]));
      }
    }, [web3])
  
    useEffect(() => {
      if (marketFactory != null) {
        getMarketList();
      }
    }, [marketFactory])
  
    const getMarketList = () => {
      let totalLength = 0;
      let contractFunc = marketFactory.methods['getMarketLength'];        
      contractFunc().call({from: account}).then((length: number) => {
        console.log(length);
        totalLength = length;
        marketHelper.methods['getMarketList'](marketFactory._address, 0, totalLength).call({from: account}).then((marketInfos: any[]) => {
          console.log(marketInfos);
          const markets: any[] = [];
          marketInfos.forEach((marketInfo: any) => {
            getImageInfo(marketInfo.nftTokenURI).then((image: string) => {
             
              markets.push({...marketInfo, image});
              if (markets.length - marketInfos.length === 0) {
                markets.sort((a: any, b: any) => b.totalVolumn - a.totalVolumn) 
                setMarketList(markets);
              }
            })
          })
          
        })
      });
    }
  
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
  