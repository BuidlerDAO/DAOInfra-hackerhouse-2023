import { Box, Link, Text } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const Footer = () => {
  return (
    <Box textAlign={'center'} w="full" p={6}>      
      <Text>
        {/* <Link href={"https://twitter.com/0xmetazen"} isExternal alignItems={'center'}>
          Buidler <ExternalLinkIcon />
        </Link>
        {'  |  '} */}
        <Link href={"https://github.com/syslink/robohorse"} isExternal alignItems={'center'}>
          Github <ExternalLinkIcon />
        </Link>
        {'  |  '}
        <Link href={"https://discord.gg/E6JBXSxJ"} isExternal alignItems={'center'}>
        Discord <ExternalLinkIcon />
        </Link>
      </Text>
    </Box>
  );
};

export default Footer;
