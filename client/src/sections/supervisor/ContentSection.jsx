'use client';
import React, { useState } from 'react';
import {
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardContent
} from '@mui/material';
import { Person as PersonIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function ContentSection({ activeTab }) {
  const theme = useTheme();

  // Dữ liệu mẫu cho Fund.Org users
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

  // Dữ liệu mẫu cho Consultants users
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

  const getLevelColor = (level) => {
    switch (level) {
      case 'Super Admin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Manager':
        return 'info';
      default:
        return 'default';
    }
  };

  const UserTable = ({ users, sectionName }) => (
    <Card sx={{ mb: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
              >
                Level
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
              >
                Account Created Date
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
              >
                Role Created Date
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.palette.primary.main}`,
                  textAlign: 'center'
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                hover
                sx={{
                  '&:hover': {},
                  '&:nth-of-type(even)': {}
                }}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: theme.palette.primary.main,
                        fontSize: '0.875rem'
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {user.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.level}
                    color={getLevelColor(user.level)}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      borderRadius: 2
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.accountCreated}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.roleCreated}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{
                        '&:hover': {},
                        borderRadius: 2
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      sx={{
                        '&:hover': {},
                        borderRadius: 2
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          p: 2
        }}
      >
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 500
            }}
          >
            Bulk Action
          </Button>
          <Button
            variant="text"
            size="small"
            color="secondary"
            sx={{
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            View Archived
          </Button>
        </Stack>
      </Box>
    </Card>
  );

  return (
    <div>
      {activeTab === 0 && (
        <Box>
          {/* Fund.Org Section */}
          <Accordion
            defaultExpanded
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.shadows[2]
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '&:hover': {}
              }}
            >
              <Typography variant="h6" fontWeight={600} color="primary">
                Fund.Org
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={fundOrgUsers} sectionName="Fund.Org" />
            </AccordionDetails>
          </Accordion>

          {/* Consultants Section */}
          <Accordion
            defaultExpanded
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.shadows[2]
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '&:hover': {}
              }}
            >
              <Typography variant="h6" fontWeight={600} color="secondary">
                Consultants
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={consultantsUsers} sectionName="Consultants" />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {activeTab === 1 && (
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: theme.shadows[2]
          }}
        >
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Permissions Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will contain permission management functionality
            </Typography>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ContentSection;
