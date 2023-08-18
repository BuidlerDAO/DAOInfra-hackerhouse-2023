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
  import FansNFT from 'abi/fansNFT.json';
  import MarketFactory from 'abi/marketFactory.json';
  import ERC3525Market from 'abi/erc3525Market.json';
  import { useWeb3React } from "@web3-react/core";
  import { useRouter } from 'next/router';
  import { utils } from 'ethers';
  import { isEmptyObj } from 'utils/utils';
  import { FansNFTCard } from 'components/modules';
  import { getImageInfo } from 'utils/resolveIPFS'; 
  import { marketFactoryAddr, FullZeroAddr } from 'utils/config';

  // https://fansnft.com/fansnftcontractlist/0xaa..bbb/kol721nftlist
  const FansNFTList: FC = () => {
    const { account, library: web3, chainId } = useWeb3React();
    console.log('web3', web3)
    const router = useRouter();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [fansNFT, setFansNFT] = useState<any>(null);
    const [market, setMarket] = useState<any>(null);
    const [marketFactory, setMarketFactory] = useState<any>(null);
    const [nft721, setNft721] = useState<any>(null);
    const [fansNFTList, setFansNFTList] =useState<any[]>([]);
    const [tokenId, setTokenId] =useState<number>(0);
    const [twitterId, setTwitterId] =useState<string>('');
    const [days, setDays] =useState<number>(30);
    const [maxFansNumber, setMaxFansNumber] =useState<number>(1000);

    const [isIssuing, setIsIssuing] = useState<boolean>(false);
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isTokenIdInvalid, setIsTokenIdInvalid] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    const initialRef = React.useRef(null)

    useEffect(() => {
        const { fansnftaddress, slotId } = router.query;
        if (web3 != null && utils.isAddress(fansnftaddress as string)) {
            setFansNFT(new web3.eth.Contract(FansNFT, fansnftaddress));
            const marketFactory = new web3.eth.Contract(MarketFactory, marketFactoryAddr[chainId as number]);
            setMarketFactory(marketFactory);
            marketFactory.methods["erc3525MarketBuiltMap"](fansnftaddress, slotId).call({from: account}).then((marketAddr: string) => {              
              if (marketAddr.localeCompare(FullZeroAddr, 'en', { sensitivity: 'base' }) !== 0) {
                setMarket(new web3.eth.Contract(ERC3525Market, marketAddr));
              }
            })
        }
    }, [web3]);

    useEffect(() => {
        if (fansNFT != null) {
            getFansNFTList();
        }
    }, [fansNFT, refresh]);

    const getFansNFTList = () => {   
      const { slotId, symbol } = router.query;  
      const nftList: any[] = []; 
      fansNFT.methods['allTokensInSlot'](slotId).call({from: account}).then((tokenArr: number[]) => {
         console.log(tokenArr);
          fansNFT.methods['tokenURI'](tokenArr[0]).call({from: account}).then((tokenURI: string) => {
            getImageInfo(tokenURI).then((imageInfo: string) => {
              tokenArr.forEach((tokenId: number) => {
                const nftInfo = {tokenId, slotId, image: imageInfo, value: 0, owner: "", symbol}
                nftInfo.tokenId = tokenId;
                fansNFT.methods["balanceOf"](tokenId).call({from: account}).then((tokenValue: number) => {
                  nftInfo.value = tokenValue;
                  fansNFT.methods["ownerOf"](tokenId).call({from: account}).then((ownerAddr: string) => {
                    nftInfo.owner = ownerAddr;
                    nftList.push(nftInfo);
                    console.log(nftInfo.tokenId, nftInfo);
                    if (nftList.length - tokenArr.length === 0) {   
                      nftList.sort((a: any, b: any) => b.tokenId - a.tokenId)                   
                      setFansNFTList(nftList);
                    }
                  })
                })
              })
            })
          });
      });
    }

    const issue = () => {
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
      const contractFunc = fansNFT.methods['deposit721NFT']; 
      const data = contractFunc(tokenId, endTime, maxFansNumber, twitterId).encodeABI();
      console.log(data);
      const tx = {
          from: account,
          to: fansNFT._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(tokenId, endTime, maxFansNumber, twitterId).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsIssuing(true);
            })
            .on('receipt', () => {
              setIsIssuing(false);
              getFansNFTList();
              onClose();
            })
            .on('error', () => {
              setIsIssuing(false);
              toast({
                title: 'Failed',
                description: "Issue NFT failed",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      }).catch((err: any) => {
        toast({
          title: 'Failed',
          description: "Issue NFT failed: " + fansNFT._address + err,
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
      });
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

    const checkYourNFT = () => {
      if (tokenId > 0) {
        let contractFunc = nft721.methods['ownerOf'];
        contractFunc(tokenId).call({from: account}).then((ownerAddress: string) => {
          console.log(ownerAddress);
          setIsOwner(ownerAddress.localeCompare(account as string, 'en', { sensitivity: 'base' }) === 0);
          setIsTokenIdInvalid(false);
          contractFunc = nft721.methods['getApproved'];
          contractFunc(tokenId).call({from: account}).then((address: string) => {
            console.log(address);
            setIsApproved(address.localeCompare(fansNFT._address, 'en', { sensitivity: 'base' }) === 0);
          }).catch((e: any) => {
            setIsApproved(false);
            setIsTokenIdInvalid(true);
          })
        }).catch((e: any) => {
          setIsOwner(false);
          setIsTokenIdInvalid(true);
        })        
      }
    }

    useEffect(() => {
      if (nft721 != null) {
        checkYourNFT();
      }
    }, [tokenId]);

    return (
        <>
          {fansNFTList?.length ? (
            <SimpleGrid  columns={3} spacing={10}>
            {fansNFTList.map((fansNFTObj, key) => (
                <FansNFTCard {...fansNFTObj} fansNFT={fansNFT} market={market} marketFactory={marketFactory} refresh={() => setRefresh(!refresh)}/>
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

  export default FansNFTList;

