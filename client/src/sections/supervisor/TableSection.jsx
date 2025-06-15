'use client';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Paper, Tab, Tabs } from '@mui/material';

function TableSection({ activeTab, handleTabChange }) {
  const theme = useTheme();

  const fundOrgUsers = [
    {
      id: 1,
      name: 'Matthew Wilson',
      level: 'Super Admin',
      accountCreated: '06-03-2021',
      roleCreated: '06-03-2021'
    },
    {
      id: 2,
      name: 'Sarah Martinez',
      level: 'Super Admin',
      accountCreated: '06-03-2021',
      roleCreated: '06-03-2021'
    },
    {
      id: 3,
      name: 'Christopher Brown',
      level: 'Admin',
      accountCreated: '18-03-2021',
      roleCreated: '20-03-2021'
    },
    {
      id: 4,
      name: 'Emily Thompson',
      level: 'Manager',
      accountCreated: '11-06-2021',
      roleCreated: '11-06-2021'
    },
    {
      id: 5,
      name: 'David Smith',
      level: 'Manager',
      accountCreated: '25-06-2021',
      roleCreated: '28-06-2021'
    }
  ];

  const consultantsUsers = [
    {
      id: 6,
      name: 'Michael Johnson',
      level: 'Admin',
      accountCreated: '02-11-2021',
      roleCreated: '02-11-2021'
    },
    {
      id: 7,
      name: 'Daniel Davis',
      level: 'Admin',
      accountCreated: '18-11-2021',
      roleCreated: '18-11-2021'
    },
    {
      id: 8,
      name: 'Jennifer Taylor',
      level: 'Admin',
      accountCreated: '30-12-2021',
      roleCreated: '30-12-2021'
    }
  ];

  return (
    <div>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          backgroundColor: 'transparent'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 120,
              borderRadius: '8px 8px 0 0',
              margin: '0 4px',
              transition: 'all 0.2s ease-in-out'
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Users" />
          <Tab label="Permissions" />
        </Tabs>
      </Paper>
    </div>
  );
}

export default TableSection;
