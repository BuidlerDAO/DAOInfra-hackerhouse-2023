import { useColorMode } from '@chakra-ui/react';
import Image from 'next/image';

const XNFTLogo = () => {
  const { colorMode } = useColorMode();

  return (
    <Image
      src={colorMode === 'dark' ? '/logo.png' : '/logo.png'}
      height={45}
      width={45}
      alt="RoboHorse"
    />
  );
};

export default XNFTLogo;
