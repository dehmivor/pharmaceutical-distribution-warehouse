import PropTypes from 'prop-types';
// @mui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @project
import MainCard from '@/components/MainCard';

/***************************  PRESENTATION CARD  ***************************/

export default function PresentationCard({ title, children }) {
  return (
    <MainCard>
      <Stack sx={{ gap: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 400 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </MainCard>
  );
}

PresentationCard.propTypes = { title: PropTypes.string, children: PropTypes.any };
