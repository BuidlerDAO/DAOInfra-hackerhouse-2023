import {
    Button,
    Heading,
    Box,
    Tooltip,
    HStack,
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
    SimpleGrid,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
  } from '@chakra-ui/react';
  import React, { FC, useEffect, useState } from 'react';
  import FansNFTAbi from 'abi/fansNFT.json';
  import Erc721Abi from 'abi/erc721.json';
  import { useWeb3React } from "@web3-react/core";
  import { useRouter } from 'next/router';
  import { utils } from 'ethers';
  import { isEmptyObj } from 'utils/utils';
  import { KOLNFTCard } from 'components/modules';
  import { getImageInfo } from 'utils/resolveIPFS';
  import { useAccount, useConnect, useNetwork, useContractRead, useContractReads } from 'wagmi'
  import { prepareWriteContract, writeContract, waitForTransaction, readContract, readContracts } from '@wagmi/core'

  // https://fansnft.com/fansnftcontractlist/0xaa..bbb/kol721nftlist
  const KOLNFTList: FC = () => {
    const { address: account } = useAccount();
    const { chain } = useNetwork();
    
    const router = useRouter();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [fansNFTAddress, setFansNFTAddress] = useState<string>('');
    const [nft721, setNft721] = useState<any>(null);
    const [kolNFTList, setKOLNFTList] = useState<any[]>([]);
    const [tokenId, setTokenId] =useState<number>(0);
    const [twitterId, setTwitterId] =useState<string>('');
    const [days, setDays] =useState<number>(30);
    const [maxFansNumber, setMaxFansNumber] =useState<number>(1000);
    const [symbolOfFansNFT, setSymbolOfFansNFT] = useState<string>('');
    const [nftAddress, setNFTAddress] = useState<string>('');
    const [slotId, setSlotId] = useState<number>(0);
    const [slotInfoReadList, setSlotInfoReadList] = useState<any[]>([]);
    const [tokenUriReadList, setTokenUriReadList] = useState<any[]>([]);
    const [nftInfoReadList, setNftInfoReadList] = useState<any[]>([]);
    const [nftSymbol, setNftSymbol] = useState<string>("");

    const [isIssuing, setIsIssuing] = useState<boolean>(false);
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isTokenIdInvalid, setIsTokenIdInvalid] = useState<boolean>(false);

    const initialRef = React.useRef(null)

    useEffect(() => {
      if (chain != null) {        
        let { fansnftaddress, symbol, nft, slotId } = router.query;
        if (symbol == null || symbol == null || slotId == null) {
          const currentUrl = window.location.href;
          const beforeStr = 'fansnft/';
          const endStr = '/kol721NFTList';
          const startIndex = currentUrl.indexOf(beforeStr) + beforeStr.length;
          const endIndex = currentUrl.indexOf(endStr);
          fansnftaddress = currentUrl.substring(startIndex, endIndex);

          const searchParams = new URLSearchParams(location.search)          
          symbol = searchParams.get("symbol")
          nft = searchParams.get("nft")
          slotId = searchParams.get("slotId")
        }
        setSymbolOfFansNFT(symbol as string);
        setNFTAddress(nft as string);
        setSlotId(slotId as number);
        const slotInfoList = []
        for (let i = 1; i < slotId as number; i++) {
          slotInfoList.push({
            address: fansnftaddress,
            abi: FansNFTAbi,
            functionName: 'slotInfoMap',
            args: [i]
          })
        }
        setSlotInfoReadList(slotInfoList);
        if (utils.isAddress(fansnftaddress as string)) {
          setFansNFTAddress(fansnftaddress);
      }
      }
    }, [chain])

    useContractRead({
      address: nftAddress,
      abi: Erc721Abi,
      functionName: 'symbol',
      enabled: nftAddress != "",
      onSuccess(symbol: string) {
        console.log('nftAddress symbol', symbol);
        setNftSymbol(symbol)
      },
      onError(error) {
        console.log('Error', error)
      },
    })

    useContractReads({
      contracts: slotInfoReadList,
      enabled: slotInfoReadList.length > 0 && nftSymbol != "",
      onSuccess(results: any[]) {
        console.log('slotInfoReadList results', results)
        const tokenUriList = []
        const kolNfts = []
        results.map((result: any, index: number) => {
          const slotInfo = result.result;
          slotInfo.nftOwner = slotInfo[0];
          slotInfo.nft721Id = Number(slotInfo[1]);
          slotInfo.endTime = Number(slotInfo[2]);
          slotInfo.maxFansNumber = Number(slotInfo[3]);
          slotInfo.twitterId = slotInfo[4];
          slotInfo.slotId = index + 1;
          slotInfo.symbol = nftSymbol;
          tokenUriList.push({
            address: nftAddress,
            abi: Erc721Abi,
            functionName: 'tokenURI',
            args: [slotInfo.nft721Id]
          })  
          kolNfts.push(slotInfo);        
        })
        setTokenUriReadList(tokenUriList)
        setKOLNFTList(kolNfts)
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
          const tokenUri = result.result;
          getImageInfo(tokenUri).then((imageInfo: string) => {
            kolNFTList[index].image = imageInfo;
            if (results.length - 1 == index) {
              setKOLNFTList(kolNFTList.map(item => item))
            }
          })
        })
      },
      onError(error) {
        console.log('Error', error)
      },
    })

    // useEffect(() => {
    //     if (fansNFT != null) {
    //         getKOLNFTList();
    //     }
    // }, [fansNFT]);

    // const getKOLNFTList = () => {     
    //     const nftList: any[] = []; 
    //     fansNFT.methods['nft']().call({from: account}).then((nftAddress: string) => {
    //         const nftContract = new web3.eth.Contract(Erc721, nftAddress);
    //         setNft721(nftContract);
    //         fansNFT.methods['slotId']().call({from: account}).then((slotId: number) => {
    //             for (let i = 1; i < slotId; i++) {
    //                 fansNFT.methods['slotInfoMap'](i).call({from: account}).then((slotInfo: any) => {
    //                     nftContract.methods["tokenURI"](slotInfo.nft721Id).call({from: account}).then((tokenURI: string) => {
    //                         getImageInfo(tokenURI).then((imageInfo: string) => {
    //                           slotInfo.slotId = i;
    //                           slotInfo.image = imageInfo;
    //                           nftContract.methods["symbol"]().call({from: account}).then((symbol: string) => {
    //                               slotInfo.symbol = symbol;
                                  
    //                               nftList.push(slotInfo);
    //                               if (nftList.length - (slotId - 1) === 0) {
    //                                   console.log(nftList);
    //                                   setKOLNFTList(nftList);
    //                               }
    //                           })
    //                         })
    //                     })
    //                 });
    //             }
    //         });
    //     });
    //   }

    const issue = async () => {
      if (!isApproved) {
        toast({
          title: 'Warning',
          description: "Please approve the NFT firstly",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }
      try {
        const endTime = days * 3600 * 24 + Date.parse(new Date().toString()) / 1000;
        const { hash } = await writeContract({
          address: fansNFTAddress,
          abi: FansNFTAbi,
          functionName: 'deposit721NFT',
          args: [tokenId, endTime, maxFansNumber, twitterId],
        })
        setIsIssuing(true);
        const data = await waitForTransaction({ hash })
        setIsIssuing(false);
        onClose();
      } catch (error) {
        setIsApproving(false);
        toast({
          title: 'Failed',
          description: "Issue NFT failed",
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
      }
    }

    const approve = async () => {
      try {
        const { hash } = await writeContract({
          address: nftAddress,
          abi: Erc721Abi,
          functionName: 'approve',
          args: [fansNFTAddress, tokenId],
        })
        setIsApproving(true);
        const data = await waitForTransaction({ hash })
        setIsApproving(false);
        setIsApproved(true);
      } catch (error) {
        setIsApproving(false);
        toast({
          title: 'Failed',
          description: "Approve NFT failed",
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
      }
    }

    const checkYourNFT = () => {
      if (tokenId > 0) {
        setIsTokenIdInvalid(false);

        readContract({
          address: nftAddress,
          abi: Erc721Abi,
          functionName: 'ownerOf',
          args: [tokenId]
        }).then((ownerAddress: string) => {
          setIsOwner(ownerAddress.localeCompare(account as string, 'en', { sensitivity: 'base' }) === 0);
        }).catch((e: any) => {
          setIsOwner(false);
          setIsTokenIdInvalid(true);
        }) 

        readContract({
          address: nftAddress,
          abi: Erc721Abi,
          functionName: 'getApproved',
          args: [tokenId]
        }).then((address: string) => {
          setIsApproved(address.localeCompare(fansNFTAddress, 'en', { sensitivity: 'base' }) === 0);
        }).catch((e: any) => {
          setIsApproved(false);
          setIsTokenIdInvalid(true);
        })      
      }
    }

    useEffect(() => {
      if (nftAddress != null) {
        checkYourNFT();
      }
    }, [tokenId]);

    return (
        <>
          <Heading size="lg" marginBottom={6}>
            <HStack justifyContent='space-between'>
                <div />
                <Tooltip label={'Issue your Fans NFT, it will transfer your NFT-721 to FansNFT contract, then an NFT-3525 belonged to you will be generated.'}>
                    <Button colorScheme='teal' variant='outline' onClick={onOpen}>Issue</Button>
                </Tooltip>
            </HStack>
          </Heading>
          {kolNFTList?.length ? (
            <SimpleGrid  columns={3} spacing={10}>
            {kolNFTList.map((kolNFTObj, key) => (
                <KOLNFTCard {...kolNFTObj} fansNFTAddress={fansNFTAddress} symbolOfFansNFT={symbolOfFansNFT}/>
            ))}
            </SimpleGrid>
        ) : (
            <Box>Oooooops...there is no KOL to issue their FansNFTs, if you issue, you will be the first KOL, LFG!</Box>
        )}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Issue your NFT-721</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>Token Id</FormLabel>
                <Input ref={initialRef} 
                  isInvalid = {isTokenIdInvalid}
                  errorBorderColor='red.300'
                  onChange={(e) => isEmptyObj(e.target.value) ? setTokenId(0) : setTokenId(parseInt(e.target.value))} value={tokenId}
                />
                {
                  tokenId > 0 ? 
                    (!isOwner ? <FormLabel color="red.300">Not your NFT</FormLabel> : 
                               (isTokenIdInvalid ? <FormLabel color="red.300">TokenId is invalid</FormLabel> : null))
                    : 
                    null
                }
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>Your Twitter Id (Can NOT be changed in future)</FormLabel>
                <Input onChange={(e) => setTwitterId(e.target.value)} value={twitterId} placeholder="@xxxx"/>
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>How many fans could use your NFT-721?</FormLabel>
                <NumberInput step={100} defaultValue={1000} min={1}>
                  <NumberInputField onChange={(e) => setMaxFansNumber(parseInt(e.target.value))} value={maxFansNumber}/>
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>How many days that fans could use your NFT-721?</FormLabel>
                <NumberInput step={1} defaultValue={30} min={1}>
                  <NumberInputField onChange={(e) => setDays(parseInt(e.target.value))} value={days}/>
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              {
                isApproved ? null :
                  <Button colorScheme='blue' mr={3} onClick={approve} isLoading={isApproving} loadingText='Approving'>
                    Approve
                  </Button>
              }
              <Button colorScheme='blue' mr={3} onClick={issue} isLoading={isIssuing} loadingText='Issuing'>
                Issue
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        </>
      );
  }

  export default KOLNFTList;

