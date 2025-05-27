import Grid from '@mui/material/Grid';

import AnalyticsOverviewCard from '@/sections/dashboard/AnalyticsOverviewCard';
import AnalyticsOverviewChart from '@/sections/dashboard/AnalyticsOverviewChart';
import AnalyticsTopRef from '@/sections/dashboard/AnalyticsTopRef';

export default function AnalyticsOverview() {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <AnalyticsOverviewCard />
      </Grid>
      <Grid size={12}>
        <AnalyticsOverviewChart />
      </Grid>
      <Grid size={12}>
        <AnalyticsTopRef />
      </Grid>
    </Grid>
  );
}
