import { Flex, Container, Heading, Stack, Text, Button, Image, IconProps } from '@chakra-ui/react';
import Router from 'next/router';

export default function CallToActionWithIllustration() {
  return (
    <Container maxW={'5xl'}>
      <Stack textAlign={'center'} align={'center'} spacing={{ base: 8, md: 10 }} py={{ base: 20, md: 28 }}>
        <Heading fontWeight={600} fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }} lineHeight={'110%'}>
          <Text as={'span'} color={'#81e6d9'}>
            Create Script {'->'}
          </Text>{' '}
          Share{' -> '}
          <Text as={'span'} color={'#81e6d9'}>
            Build ECO
          </Text>
        </Heading>
        <Text color={'gray.500'} maxW={'3xl'}>
          1: Create the web2/web3 script to auto interact with web2 service or blockchain node
        </Text>
        <Text color={'gray.500'} maxW={'3xl'}>
          2: Share your scripts to users who own your FansNFT
        </Text>
        <Text color={'gray.500'} maxW={'3xl'}>
          3: Build your own ECO based on RoboHorse and FansNFT
        </Text>
        <Stack spacing={6} direction={'row'}>
          <Button
            rounded={'full'}
            px={6}
            colorScheme={'orange'}
            bg={'#81e6d9'}
            _hover={{ bg: 'orange.500' }}
            onClick={() => {
              Router.push('/script/myList');
            }}
          >
            Get started
          </Button>
          <Button
            rounded={'full'}
            px={6}
            onClick={() => {
              window.open('https://discord.gg/E6JBXSxJ');
            }}
          >
            Ask more
          </Button>
        </Stack>
        <Illustration
          //height={{ sm: '24rem', lg: '28rem' }}
          mt={{ base: 12, sm: 16 }}
        />
      </Stack>
    </Container>
  );
}

export const Illustration = (props: IconProps) => {
  return <Image src={'/logo.png'} height={500} width={500} alt="RoboHorse" />;
};
