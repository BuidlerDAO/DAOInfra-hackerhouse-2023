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
  Avatar
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { getEllipsisTxt } from 'utils/format';
import FansNFTFactoryAbi from 'abi/fansNFTFactory.json';
import FansNFTAbi from 'abi/fansNFT.json';
import Erc721Abi from 'abi/erc721.json';
import { useWeb3React } from "@web3-react/core";
import { fansNFTFactoryAddr } from 'utils/config';
import copy from 'copy-to-clipboard';
import { useRouter } from 'next/router';
import { getImageInfo } from 'utils/resolveIPFS';
import { useAccount, useConnect, useNetwork, useContractRead, useContractReads } from 'wagmi'

const FansNFTContractList: FC = () => {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [fansNFTFactoryAddress, setFansNFTFactoryAddress] = useState<string>('');
  const [fansNFTLength, setFansNFTLength] = useState<number>(0);
  const [fansNFTQueryList, setFansNFTQueryList] = useState<any[]>([]);
  const [fansNFTReadList, setFansNFTReadList] = useState<any[]>([]);
  const [fansNFTList, setFansNFTList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fansNFTFactory, setFansNFTFactory] = useState<any>(null);
  const [nftAddr, setNFTAddr] = useState<string>('');
  const [tokenUriReadList, setTokenUriReadList] = useState<any[]>([]);

  const toast = useToast();
  const router = useRouter();

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)
  const filteredAddr: Record<string, boolean> = {}

  useEffect(() => {
    if (chain != null) {        
      setFansNFTFactoryAddress(fansNFTFactoryAddr[chain.id as number])
    }
  }, [chain])

  useContractRead({
    address: fansNFTFactoryAddress,
    abi: FansNFTFactoryAbi,
    functionName: 'getFansNFTLength',
    //watch: true,
    enabled: fansNFTFactoryAddress != "",
    onSuccess(length: number) {
      console.log('getFansNFTLength', length);
      setFansNFTLength(length)
      const nftQueryList = []
      for (let i = 0; i < length; i++) {
        nftQueryList.push({
          address: fansNFTFactoryAddress,
          abi: FansNFTFactoryAbi,
          functionName: 'fansNFTList',
          args: [i]
        })
      }
      setFansNFTQueryList(nftQueryList)
    },
    onError(error) {
      console.log('Error', error)
    },
  })

  useContractReads({
    contracts: fansNFTQueryList,
    enabled: fansNFTQueryList.length > 0,
    onSuccess(results: string[]) {
      console.log('results', results)
      const nftReadList = []
      results.map((result: any) => {
        const nftInfo = {address: result.result, abi: FansNFTAbi};

        nftReadList.push(...[
          {
            ...nftInfo,
            functionName: 'symbol'
          },
          {
            ...nftInfo,
            functionName: 'nft'
          },
          {
            ...nftInfo,
            functionName: 'slotId'
          },
          {
            ...nftInfo,
            functionName: 'totalSupply'
          }])
      })
      setFansNFTReadList(nftReadList)
    },
    onError(error) {
      console.log('Error', error)
    },
  })

  useContractReads({
    contracts: fansNFTReadList,
    enabled: fansNFTReadList.length > 0,
    onSuccess(results: any[]) {
      console.log('fansNFTReadList results', results)
      const nftList: any[] = [];
      const tokenUriList = []
      for (let i = 0; i < results.length; i += 4) {
        const oneFansNFTInfo = results.slice(i, i + 4);        
        const nftInfo = {symbol: oneFansNFTInfo[0].result, 
                         nftAddress: oneFansNFTInfo[1].result, 
                         listedNFTNumber: Number(oneFansNFTInfo[2].result) - 1, 
                         fansNumber: Number(oneFansNFTInfo[3].result)}
        
        nftList.push({...nftInfo, address: fansNFTReadList[i].address, nftTokenURI: '', floorPrice: 0, volumn: 0});
        tokenUriList.push({
          address: nftInfo.nftAddress,
          abi: Erc721Abi,
          functionName: 'tokenURI',
          args: [1]
        });
      }
      setFansNFTList(nftList);
      setTokenUriReadList(tokenUriList);
    },
    onError(error) {
      console.log('Error', error)
    },
  })

  useContractReads({
    contracts: tokenUriReadList,
    enabled: tokenUriReadList.length > 0,
    onSuccess(results: any[]) {
      console.log('tokenUriReadList results', results)
      results.map((result: any, index: number) => {
        const nftTokenURI = result.result;
        getImageInfo(nftTokenURI).then((imageInfo: string) => {
          fansNFTList[index].nftTokenURI = imageInfo;
        });
      })
    },
    onError(error) {
      console.log('Error', error)
    },
  })

  // const getFansNFTList = () => {
  //   let totalLength = 0;
  //   let contractFunc = fansNFTFactory.methods['getFansNFTLength'];        
  //   contractFunc().call({from: account}).then((length: number) => {
  //     console.log(length);
  //     totalLength = length;
  //     const nftList: any[] = [];
  //     contractFunc = fansNFTFactory.methods['fansNFTList'];
  //     for (let i = 0; i < length; i++) {
  //       contractFunc(i).call({from: account}).then((fansNFTAddr: string) => {
  //         console.log(fansNFTAddr);
  //         const fansNFTInfo = {symbol: "", address: fansNFTAddr, nftTokenURI: '', nftAddress: '', listedNFTNumber: 0, fansNumber: 0, floorPrice: 0, volumn: 0}
  //         const fansNFT = new web3.eth.Contract(FansNFTAbi, fansNFTAddr);
  //         fansNFT.methods['symbol']().call({from: account}).then((symbol: string) => {
  //         fansNFTInfo.symbol = symbol;
  //         fansNFT.methods['nft']().call({from: account}).then((nftAddress: string) => {
  //           // console.log('nftAddress', nftAddress, "filtered? ", filteredAddr[nftAddress]);
  //           // if (filteredAddr[nftAddress]) {
  //           //   totalLength--;
  //           //   return;
  //           // }
  //           fansNFTInfo.nftAddress = nftAddress;
  //           const nftContract = new web3.eth.Contract(Erc721, nftAddress);
  //           nftContract.methods["tokenURI"](1).call({from: account}).then((tokenURI: string) => {
  //             console.log('tokenURI', tokenURI);
  //             getImageInfo(tokenURI).then((imageInfo: string) => {
  //               fansNFTInfo.nftTokenURI = imageInfo;
  //               fansNFT.methods['slotId']().call({from: account}).then((slotId: number) => {
  //                 console.log('slotId', slotId);
  //                 fansNFTInfo.listedNFTNumber = slotId - 1;
  //                 fansNFT.methods['totalSupply']().call({from: account}).then((totalSupply: number) => {
  //                   console.log('totalSupply', totalSupply);
  //                   fansNFTInfo.fansNumber = totalSupply;
  //                   nftList.push(fansNFTInfo);
  //                   if (nftList.length - totalLength === 0) {
  //                     setFansNFTList(nftList);
  //                   }
  //                 })
  //               })
  //             });
  //           }).catch((err: any) => {
  //             console.log("Failed with error: " + err);
  //             fansNFT.methods['slotId']().call({from: account}).then((slotId: number) => {
  //               console.log('slotId', slotId);
  //               fansNFTInfo.listedNFTNumber = slotId - 1;
  //               fansNFT.methods['totalSupply']().call({from: account}).then((totalSupply: number) => {
  //                 console.log('totalSupply', totalSupply);
  //                 fansNFTInfo.fansNumber = totalSupply;
  //                 nftList.push(fansNFTInfo);
  //                 if (nftList.length - totalLength === 0) {
  //                   setFansNFTList(nftList);
  //                 }
  //               })
  //             })
  //           });;
  //         })
  //         });
  //       });
  //     }
  //   });
  // }

  const createFansNFT = () => {
    const contractFunc = fansNFTFactory.methods['buildFansNFT']; 
    const data = contractFunc(nftAddr).encodeABI();
    const tx = {
        from: account,
        to: fansNFTFactoryAddr[chainId as number],
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(nftAddr).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsLoading(true);
          })
          .on('receipt', () => {
            onClose();
            setIsLoading(false);
            getFansNFTList();
          })
          .on('error', () => {
            setIsLoading(false);
            toast({
              title: 'Create FansNFT Failed',
              description: "Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }
  

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Current FansNFT List</div>
          </HStack>
          <HStack spacing='18px'>
            <Tooltip label={'Create new FansNFT for one type of NFT.'}>
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Build</Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {fansNFTList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>FansNFT-3525</Th>
                  <Th isNumeric>NFT-721</Th>
                  <Th>Number of NFT-721 Listed</Th>
                  <Th>Number of Fans</Th>
                  <Th>Floor Price</Th>
                  <Th>Volumn</Th>
                </Tr>
              </Thead>
              <Tbody>
                {fansNFTList?.map((fansNFT, key) => (
                  <Tr key={`${fansNFT.address}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer" 
                      onClick={() => router.push(`/fansnft/${fansNFT.address}/kol721NFTList?symbol=${fansNFT.symbol}&nft=${fansNFT.nftAddress}&slotId=${fansNFT.listedNFTNumber}`)}>      
                    <Td>                      
                      <Avatar
                        size='xl'
                        src={fansNFT.nftTokenURI}
                      />  
                    </Td>                
                    <Td>
                      {fansNFT.symbol}
                    </Td>    
                    <Td isNumeric>
                      <Tooltip label={`${fansNFT.nftAddress}, click to copy`}>
                        <div onClick={(event: any) => {
                          event.stopPropagation();
                          copy(fansNFT.nftAddress);
                          toast({
                            title: 'Success',
                            description: "Address has been copied",
                            status: 'success',
                            position: 'bottom-right',
                            isClosable: true,
                          })
                        }}>
                          {getEllipsisTxt(fansNFT.nftAddress || '')}
                        </div>
                      </Tooltip>
                    </Td>              
                    <Td isNumeric>{fansNFT.listedNFTNumber}</Td>   
                    <Td isNumeric>{fansNFT.fansNumber}</Td>   
                    <Td isNumeric>{fansNFT.floorPrice}</Td>   
                    <Td isNumeric>{fansNFT.volumn}</Td> 
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
            <Button colorScheme='blue' mr={3} onClick={createFansNFT} isLoading={isLoading} loadingText='Building'>
              Build
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FansNFTContractList;
