import { Card, CardContent, Box, Typography, Avatar, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';

function GuestLayout() {
  const isMobile = useMediaQuery('(max-width:600px)');

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Box
          sx={{
            pt: 4,
            px: 2,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh"
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              justifyContent: "center",
              mb: 2
            }}
          >
            <Avatar
              src="/tiger.png"
              alt="RIT Tiger Logo"
              sx={{
                width: 60,
                height: 60,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "#F76902",
                fontFamily: '"Helvetica Neue"',
                fontWeight: 'bold',
                fontSize: '1.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              Brick City Connect
            </Typography>
          </Box>
          <Outlet />
        </Box>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("/rit.jpg")' }}>
       <Card
      sx={{
        backgroundColor: "white",
        pt: 2,
        px: 2,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            src="/tiger.png"
            alt="RIT Tiger Logo"
            sx={{
              width: 80,
              height: 80,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: "#F76902",
              fontFamily: '"Helvetica Neue"',
              fontWeight: 'bold',
              fontSize: {
                xs: '1.4rem',
                sm: '1.8rem'
              },
              whiteSpace: 'nowrap',
            }}
          >
            Brick City Connect
          </Typography>
        </Box>
        <Outlet />
      </CardContent>
    </Card>
    </div>
  );
}

export default GuestLayout;