import {
    Button,
    Box,
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
  import MarketFactoryAbi from 'abi/marketFactory.json';
  import ERC3525MarketAbi from 'abi/erc3525Market.json';
  import { useWeb3React } from "@web3-react/core";
  import { useRouter } from 'next/router';
  import { utils } from 'ethers';
  import { isEmptyObj } from 'utils/utils';
  import { FansNFTCard } from 'components/modules';
  import { getImageInfo } from 'utils/resolveIPFS'; 
  import { marketFactoryAddr, FullZeroAddr } from 'utils/config';
  import { useAccount, useConnect, useNetwork, useContractRead, useContractReads } from 'wagmi'
  import { readContract } from '@wagmi/core'
  import { prepareWriteContract, writeContract, waitForTransaction } from '@wagmi/core'

  // https://fansnft.com/fansnftcontractlist/0xaa..bbb/kol721nftlist
  const FansNFTList: FC = () => {
    const { address: account } = useAccount();
    const { chain } = useNetwork();

    
    const router = useRouter();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { fansnftaddress: fansNftAddr, slotId, symbol } = router.query;

    const [fansNFT, setFansNFT] = useState<any>(null);
    const [marketAddress, setMarketAddress] = useState<string>('');
    const [marketFactoryAddress, setMarketFactoryAddress] = useState<string>('');
    const [nft721, setNft721] = useState<any>(null);
    const [fansNFTList, setFansNFTList] =useState<any[]>([]);
    const [tokenId, setTokenId] =useState<number>(0);
    const [twitterId, setTwitterId] = useState<string>('');
    const [days, setDays] = useState<number>(30);
    const [maxFansNumber, setMaxFansNumber] = useState<number>(1000);
    const [firstTokenId, setFirstTokenId] = useState<number>(0);
    const [imageInfo, setImageInfo] = useState<string>('');
    const [nftInfoReadList, setNftInfoReadList] = useState<any[]>([]);

    const [isIssuing, setIsIssuing] = useState<boolean>(false);
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isTokenIdInvalid, setIsTokenIdInvalid] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    const initialRef = React.useRef(null)

    useEffect(() => {
      if (chain != null) {
        setMarketFactoryAddress(marketFactoryAddr[chain.id as number]);
      }
    }, [chain])

    useContractRead({
      address: marketFactoryAddress,
      abi: MarketFactoryAbi,
      functionName: 'erc3525MarketBuiltMap',
      enabled: marketFactoryAddress != "",
      args: [fansNftAddr, slotId],
      onSuccess(marketAddr: string) {
        console.log('erc3525MarketBuiltMap result', marketAddr);
        if (marketAddr.localeCompare(FullZeroAddr, 'en', { sensitivity: 'base' }) !== 0) {
          setMarketAddress(marketAddr)
        }
      },
      onError(error) {
        console.log('Error', error)
      },
    })

    useContractRead({
      address: fansNftAddr,
      abi: FansNFTAbi,
      functionName: 'allTokensInSlot',
      enabled: fansNftAddr != "",
      args: [slotId],
      onSuccess(tokenArr: number[]) {
        console.log('allTokensInSlot result', tokenArr[0]);
        const nftReadInfoList = []
        const nftInfoList = []
        readContract({
          address: fansNftAddr,
          abi: FansNFTAbi,
          functionName: 'tokenURI',
          args: [Number(tokenArr[0])]
        }).then((tokenURI: string) => {
          console.log('getImageInfo 1', tokenURI)
          getImageInfo(tokenURI).then((imageInfo: string) => {
            console.log('getImageInfo 2', imageInfo)
            const nftInfo = {slotId, image: imageInfo, value: 0, owner: "", symbol}
            tokenArr.map((tokenId: BigInt) => {
              const nftReadInfo = {address: fansNftAddr, abi: FansNFTAbi};
              nftReadInfoList.push(...[
                {
                  ...nftReadInfo,
                  functionName: 'balanceOf',
                  args: [Number(tokenId)]
                },
                {
                  ...nftReadInfo,
                  functionName: 'ownerOf',
                  args: [Number(tokenId)]
                }
              ])
              nftInfo.tokenId = tokenId;
              nftInfoList.push(nftInfo)
            })
            setNftInfoReadList(nftReadInfoList)
            setFansNFTList(nftInfoList)
          })
        })
      },
      onError(error) {
        console.log('Error', error)
      },
    }) 
    
    useContractReads({
      contracts: nftInfoReadList,
      enabled: nftInfoReadList.length > 0,
      onSuccess(results: any[]) {
        console.log('nftInfoReadList results', results)
        for (let i = 0; i < results.length; i += 2) {
          const oneNFTInfo = results.slice(i, i + 2);      
          fansNFTList[i / 2].value = Number(oneNFTInfo[0].result);
          fansNFTList[i / 2].owner = oneNFTInfo[1].result;
        }
      },
      onError(error) {
        console.log('Error', error)
      },
    })

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
      const endTime = days * 3600 * 24 + Date.parse(new Date().toString()) / 1000;
      try {
        const { hash } = await writeContract({
          address: fansNFTAddress,
          abi: FansNFTAbi,
          functionName: 'deposit721NFT',
          args: [tokenId, endTime, maxFansNumber, twitterId],
        })
        setIsIssuing(true);
        const data = await waitForTransaction({ hash })
        setIsIssuing(false);
        getFansNFTList();
        onClose();
        setLeftDays(parseInt(((newEndTime - Date.parse(new Date().toString()) / 1000) / (3600 * 24)).toString()));
      } catch (error) {
        setIsIssuing(false);
        toast({
          title: 'Failed',
          description: "Issue NFT failed: " + error.toString(),
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
      }
    }

    const approve = () => {
      const contractFunc = nft721.methods['approve'];
      const data = contractFunc(fansNFT._address, tokenId).encodeABI();
      const tx = {
          from: account,
          to: nft721._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(fansNFT._address, tokenId).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsApproving(true);
            })
            .on('receipt', () => {
              setIsApproving(false);
              setIsApproved(true);
            })
            .on('error', () => {
              setIsApproving(false);
              toast({
                title: 'Failed',
                description: "Approve NFT failed",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    }

    // const checkYourNFT = () => {
    //   if (tokenId > 0) {
    //     setIsTokenIdInvalid(false);

    //     readContract({
    //       address: nftAddress,
    //       abi: Erc721Abi,
    //       functionName: 'ownerOf',
    //       args: [tokenId]
    //     }).then((ownerAddress: string) => {
    //       setIsOwner(ownerAddress.localeCompare(account as string, 'en', { sensitivity: 'base' }) === 0);
    //     }).catch((e: any) => {
    //       setIsOwner(false);
    //       setIsTokenIdInvalid(true);
    //     }) 

    //     readContract({
    //       address: nftAddress,
    //       abi: Erc721Abi,
    //       functionName: 'getApproved',
    //       args: [tokenId]
    //     }).then((address: string) => {
    //       setIsApproved(address.localeCompare(fansNftAddr, 'en', { sensitivity: 'base' }) === 0);
    //     }).catch((e: any) => {
    //       setIsApproved(false);
    //       setIsTokenIdInvalid(true);
    //     })      
    //   }
    // }

    // useEffect(() => {
    //   if (nftAddress != null) {
    //     checkYourNFT();
    //   }
    // }, [tokenId]);

    return (
        <>
          {fansNFTList?.length ? (
            <SimpleGrid  columns={3} spacing={10}>
            {fansNFTList.map((fansNFTObj, key) => {
                console.log('fansNFTObj', fansNFTObj)
                return <FansNFTCard {...fansNFTObj} fansNFTAddr={fansNftAddr} marketAddr={marketAddress} 
                             marketFactoryAddr={marketFactoryAddress} refresh={() => setRefresh(!refresh)}/>
            })}
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

  export default FansNFTList;

