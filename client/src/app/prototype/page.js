import { Button, Grid } from '@mui/material';
import Link from 'next/link';
import React from 'react';

function page() {
  return (
    <div>
      <h1>Prototype</h1>
      <p>This is the prototype page.</p>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Link href="/prototype/check">
            <Button variant="contained" fullWidth>
              màn quản lí tham số: ngày kiểm tra định kỳ
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Link href="/prototype/quantity">
            <Button variant="contained" fullWidth>
              màn quản lí số lượng sau khi kiểm kê
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Link href="/prototype/recycle">
            <Button variant="contained" fullWidth>
              phiếu tái chế
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Link href="/prototype/check">
            <Button variant="contained" fullWidth>
              phiếu gửi thuốc đi kiểm định và nhận kết quả kiểm định thuốc
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Link href="/prototype/destroy">
            <Button variant="contained" fullWidth>
              phiếu báo hủy
            </Button>
          </Link>
        </Grid>
      </Grid>
    </div>
  );
}

export default page;
