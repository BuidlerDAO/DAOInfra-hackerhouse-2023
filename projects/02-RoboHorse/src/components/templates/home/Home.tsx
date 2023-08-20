import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Heading, VStack, Container, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Tooltip } from '@chakra-ui/react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React } from "@web3-react/core";
import { XProxy } from 'components/templates/xenExtension/xProxy';
import { XNFTs } from 'components/templates/xenExtension/xNFT';
import { XEN } from 'components/templates/xenExtension/xen';
import { DPool } from 'components/templates/xenExtension/dPool';
import { chainId2NetworkName } from 'utils/config';
import { isEmptyObj } from 'utils/utils';
import { getEllipsisTxt } from 'utils/format';

const Home = () => {
  const { active, account, library, chainId, activate, deactivate } = useWeb3React()
  

  return (
    <VStack w='100%' justify='center'>
      <Container maxW="100%" width="100%" p={3} as="main" minH="70vh">
        <XProxy account={account || ''} web3={library} chainId={chainId || 0}/>
      </Container>
    </VStack>
  );
};

export default Home;