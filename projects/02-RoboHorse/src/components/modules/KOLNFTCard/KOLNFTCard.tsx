import { 
  Box, HStack, VStack, Image, SimpleGrid, useColorModeValue, Tooltip, Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
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
  Avatar,
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { Eth } from '@web3uikit/icons';
import { FaTwitter, FaUsers, FaEthereum } from 'react-icons/fa';
import { FcOvertime } from 'react-icons/fc';
import React, { FC, useEffect, useState} from 'react';
import { useWeb3React } from "@web3-react/core";
import { useRouter } from 'next/router';


type KOLNFTInfo = {
  nftOwner: string;
  nft721Id: number;
  endTime: number;
  maxFansNumber: number;
  slotId: number;
  image: string;
  symbol: string;
  symbolOfFansNFT: string;
  fansNFT: any;
  twitterId: string;
}

const KOLNFTCard: FC<KOLNFTInfo> = ({ nftOwner, nft721Id, endTime, maxFansNumber, slotId, image, symbol, symbolOfFansNFT, twitterId, fansNFT }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');

  const { account, library: web3 } = useWeb3React();

  const router = useRouter();
  const modal1 = useDisclosure();

  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isComfirming, setIsComfirming] = useState<boolean>(false);
  const [totalSupplyInSlot, setTotalSupplyInSlot] = useState<number>(0);
  const [leftDays, setLeftDays] = useState<number>(0);
  const [days, setDays] =useState<number>(0);

  const toast = useToast();
  const initialRef = React.useRef(null);
  twitterId = twitterId.startsWith('@') ? twitterId.substr(1) : twitterId; 

  useEffect(() => {
    console.log(endTime)
    setLeftDays(parseInt(((endTime - Date.parse(new Date().toString()) / 1000) / (3600 * 24)).toString()));
    if (fansNFT != null) {
      const contractFunc = fansNFT.methods['tokenSupplyInSlot']; 
      contractFunc(slotId).call().then((totalSupply: number) => {
        setTotalSupplyInSlot(totalSupply);
      });
    }
  }, [fansNFT]);

  const redeem = () => {
    const contractFunc = fansNFT.methods['redeemNFT']; 
    const data = contractFunc(nft721Id).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(nft721Id).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsRedeeming(true);
          })
          .on('receipt', () => {
            modal1.onClose();
            setIsRedeeming(false);
          })
          .on('error', () => {
            setIsRedeeming(false);
            toast({
              title: 'Failed',
              description: "Redeem NFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const extendEndTime = () => {
    const newEndTime = days * 3600 * 24 + parseInt(endTime.toString());
    const contractFunc = fansNFT.methods['extendEndTime']; 
    const data = contractFunc(slotId, newEndTime).encodeABI();
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(slotId, newEndTime).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsComfirming(true);
          })
          .on('receipt', () => {
            modal1.onClose();
            setIsComfirming(false);
            endTime = newEndTime;
            setLeftDays(parseInt(((newEndTime - Date.parse(new Date().toString()) / 1000) / (3600 * 24)).toString()));
          })
          .on('error', () => {
            setIsComfirming(false);
            toast({
              title: 'Failed',
              description: "Fail to extend end time",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <HStack alignItems={'center'} justify={"flex-start"}>
        <Avatar 
          opacity="0.8" 
          size='lg' 
          name={twitterId} 
          src={`https://unavatar.io/twitter/${twitterId}`}
          onClick={() => window.open (`https://twitter.com/${twitterId}`, '_blank')}
          cursor="pointer">
        </Avatar>
        <VStack align='stretch'>
          <Box as="h4" noOfLines={1} fontSize="sm">
            @{twitterId}
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">   
            <HStack>
              <Button 
                size='xs'
                colorScheme='twitter' 
                variant='outline' 
                onClick={() => window.open (`https://twitter.com/${twitterId}`, '_blank')}>
                <FaTwitter/>    
              </Button>
              <Tooltip label={"number of users who have your fans NFT"}>
                <Button 
                  size='xs'
                  colorScheme='pink' 
                  variant='outline' 
                  leftIcon={<FaUsers />}
                  onClick={() => router.push(`/fansnft/${fansNFT._address}/kolnftlist/${slotId}/fansNFTList?symbol=${symbolOfFansNFT}`)}>
                    {totalSupplyInSlot} / {maxFansNumber}
                </Button>
              </Tooltip>
              <Tooltip label={"trade volumn"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<FaEthereum />}>
                    0
                </Button>
              </Tooltip>
              <Tooltip label={"left days"}>
                <Button 
                  cursor="initial"
                  size='xs'
                  colorScheme='blue' 
                  variant='outline' 
                  leftIcon={<FcOvertime />}>
                    {leftDays}
                </Button>
              </Tooltip>
            </HStack>
          </Box>
        </VStack>
      </HStack>
      <HStack alignItems={'center'} justify={"center"} mt={5}>
        <Box>
          <Image
            src={image}
            alt={'KOLNFT'}   
            objectFit="fill"
            cursor="pointer"
            onClick={() => router.push(`/fansnft/${fansNFT._address}/kolnftlist/${slotId}/fansNFTList?symbol=${symbolOfFansNFT}`)}
          />
        </Box>
      </HStack>
      <HStack alignItems={'center'} justify={"space-between"} mt="5">
        <Box fontWeight="semibold" as="h4" noOfLines={1}>
          {symbol} # {nft721Id}<Tooltip label={"NFT-721 deposited in FansNFT contract"}><QuestionOutlineIcon w={4} h={4} marginLeft='2px'/></Tooltip>
        </Box>
        <HStack alignItems={'center'}>
          <Eth fontSize="20px" />
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="smaller">
            ERC3525
          </Box>
        </HStack>
      </HStack>
      {
        account?.localeCompare(nftOwner, 'en', { sensitivity: 'base' }) === 0 ? 
          <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={4}>
            <Box>
              <HStack alignItems={'center'} justify='space-between'>
                <Tooltip label={`This NFT-721 could be redeemed after ${leftDays} days.`}>
                  <Button colorScheme='teal' variant='outline' disabled={account !== nftOwner} onClick={redeem} isLoading={isRedeeming} loadingText='Redeeming'>Redeem</Button>
                </Tooltip>
                <Tooltip label={`If you extend the end time of this NFT-721, your fans could use the NFT-721 for longer.`}>
                  <Button colorScheme='teal' variant='outline' disabled={account !== nftOwner} onClick={modal1.onOpen}>Extend End Time</Button>
                </Tooltip>
              </HStack>
            </Box>
          </SimpleGrid> 
          :
          null
      }
    </Box>
    <Modal
      initialFocusRef={initialRef}
      isOpen={modal1.isOpen}
      onClose={modal1.onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Extend End Time</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
            <FormControl>
              <FormLabel>How many days do you wanna extend?</FormLabel>
              <NumberInput step={1} defaultValue={0} min={1}>
                <NumberInputField onChange={(e) => setDays(parseInt(e.target.value))} value={days}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={extendEndTime} isLoading={isComfirming} loadingText='Comfirming'>
            Comfirm
          </Button>
          <Button onClick={modal1.onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
};

export default KOLNFTCard;
