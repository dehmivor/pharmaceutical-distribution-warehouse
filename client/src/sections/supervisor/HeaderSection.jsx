'use client';
import React from 'react';
import { Paper, Container, Stack, Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function HeaderSection() {
  const theme = useTheme();

  return (
    <div>
      <Paper
        elevation={1}
        sx={{
          backgroundColor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(8px)'
        }}
      >
        <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-start' }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="h4"
                gutterBottom
                fontWeight={700}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Manage User
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: { xs: '100%', md: '600px' } }}>
                Administer and oversee user accounts and privileges within the platform
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[4],
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Add User
            </Button>
          </Stack>
        </Container>
      </Paper>
    </div>
  );
}

export default HeaderSection;
