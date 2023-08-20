import { FC, ReactNode } from 'react';
import { Container } from '@chakra-ui/react';
import { Footer } from 'components/modules';
import { Header } from 'components/modules';
import Head from 'next/head';

const Default: FC<{ children: ReactNode; pageName: string }> = ({ children, pageName }) => (
  <>
    <Head>
      <title>{`${pageName} | FansNFT`}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <Header />
    <Container maxW="container.xl" p={3} marginTop={25} as="main" minH="70vh">
      {children}
    </Container>
    <Footer />
  </>
);

export default Default;
