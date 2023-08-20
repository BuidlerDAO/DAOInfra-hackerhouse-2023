import { Box, Container, Flex, HStack, Tooltip, Button } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ColorModeButton, XNFTLogo, NavBar } from 'components/elements';

const Header = () => {

  return (
    <Box borderBottom="1px" borderBottomColor="chakra-border-color">
      <Container maxW="container.xl" p={'10px'}>
        <Flex align="center" justify="space-between">
          <XNFTLogo />
          <NavBar />
          <HStack gap={'10px'}>
            <ConnectButton />
            {/* <ColorModeButton /> */}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
