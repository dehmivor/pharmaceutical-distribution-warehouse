'use client';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// import hook lấy bản dịch
import useTrans from '@/hooks/useTrans';

function HeaderSection() {
  const theme = useTheme();
  const trans = useTrans();

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
                {trans.header.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: { xs: '100%', md: '600px' } }}>
                {trans.header.description}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Paper>
    </div>
  );
}

export default HeaderSection;
