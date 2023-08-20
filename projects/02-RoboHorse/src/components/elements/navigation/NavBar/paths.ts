import { ISubNav } from '../SubNav/SubNav';

const NAV_LINKS: ISubNav[] = [
  { label: 'Home', href: '/' },
  { label: 'Script', 
    href: '/script',
    children: [
      {
        label: 'My Scripts',
        href: '/script/myList',
        logo: 'pack',
      },
      {
        label: 'Market',
        href: '/script/market',
        logo: 'documentation',
      }
    ]
  },
  { label: 'Fans NFT', 
    href: '/fansNft',
    children: [
      {
        label: 'Creators',
        href: '/fansNftCreators',
        logo: 'wizard',
      },
      {
        label: 'Market',
        href: '/fansNftMarket',
        logo: 'marketplace',
      }
    ]
  },
  { label: 'Config', 
  href: '/config',
    children: [
      {
        label: 'RPC',
        href: '/config/rpcList',
        logo: 'servers',
      },
      {
        label: 'Local Wallet',
        href: '/config/localWallet',
        logo: 'token',
      }
    ]
  },
];

export default NAV_LINKS;
