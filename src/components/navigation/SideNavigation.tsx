'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Collapse,
  Box
} from '@mui/material';
import {
  DashboardOutlined as DashboardIcon,
  ShowChartOutlined as ShowChartIcon,
  DiamondOutlined as DiamondIcon,
  TokenOutlined as TokenIcon,
  ImageOutlined as ImageIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  StackedLineChartOutlined as AnalyticsIcon,
  SettingsOutlined as SettingsIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

export interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  href: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { text: 'Markets', icon: <ShowChartIcon />, href: '/markets' },
  {
    text: 'Assets',
    icon: <DiamondIcon />,
    href: '/assets',
    children: [
      { text: 'Tokens', icon: <TokenIcon />, href: '/assets/tokens' },
      { text: 'NFTs', icon: <ImageIcon />, href: '/nft' },
    ],
  },
  { text: 'Wallet', icon: <WalletIcon />, href: '/wallet' },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

export function SideNavigation() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMenuClick = (item: NavigationItem) => {
    if (item.children) {
      setOpenMenu(openMenu === item.text ? null : item.text);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 280, bgcolor: 'background.paper' }}>
      <List component="nav">
        {navigationItems.map((item) => {
          // Check if current path matches this item or its children
          const isItemActive = pathname === item.href;
          const isChildActive = item.children?.some(child => pathname === child.href);
          const isOpen = openMenu === item.text || isChildActive;
          
          return (
            <Box key={item.text}>
              {item.children ? (
                <ListItem disablePadding>
                  <ListItemButton
                    selected={isItemActive || isChildActive}
                    onClick={() => handleMenuClick(item)}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={isItemActive}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )}
              
              {item.children && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      const isChildItemActive = pathname === child.href;
                      return (
                        <ListItemButton
                          key={child.text}
                          component={Link}
                          href={child.href}
                          selected={isChildItemActive}
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.text} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
} 