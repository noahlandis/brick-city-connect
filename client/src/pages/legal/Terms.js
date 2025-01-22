import { Box, Typography } from '@mui/material';

function Terms() {
    return (
        <Box sx={{
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '2rem',
            '& h1': {
                color: 'black',
                fontWeight: 'bold',
                marginBottom: '2rem',
                fontFamily: '"Helvetica Neue"',
            },
            '& h2': {
                color: 'black',
                fontWeight: 'bold',
                marginTop: '2rem',
                marginBottom: '1rem',
                fontFamily: '"Helvetica Neue"',
            },
            '& p': {
                marginBottom: '1rem',
                lineHeight: '1.6',
            }
        }}>
            <Typography variant="h4" component="h1">Terms and Conditions</Typography>
            
            <Typography variant="body1">
                Welcome to Brick City Connect. By accessing or using our service, you agree to be bound by these Terms and Conditions. Please read them carefully.
            </Typography>

            <Typography variant="h6" component="h2">1. Service Description</Typography>
            <Typography variant="body1">
                Brick City Connect is a video chat platform exclusively for RIT students. While created by RIT students, Brick City Connect is not officially affiliated with, endorsed by, or connected to Rochester Institute of Technology (RIT).
            </Typography>

            <Typography variant="h6" component="h2">2. Eligibility</Typography>
            <Typography variant="body1">
                Access to Brick City Connect is restricted to individuals with valid RIT email addresses (@rit.edu). You must be at least 18 years old to use this service.
            </Typography>

            <Typography variant="h6" component="h2">3. Code of Conduct</Typography>
            <Typography variant="body1">
                Users must comply with all applicable federal, state, local laws, and RIT policies while using Brick City Connect. The following behaviors are strictly prohibited:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Nudity, sexual content, or sexually explicit behavior</li>
                    <li>Harassment, hate speech, or discriminatory behavior</li>
                    <li>Violence or threats of violence</li>
                    <li>Sharing personal information of others without consent</li>
                    <li>Recording or capturing video chats without explicit consent</li>
                    <li>Any illegal activities or promotion of illegal content</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">4. Disclaimer of Liability</Typography>
            <Typography variant="body1">
                Brick City Connect is provided "as is" without any warranties. We are not responsible for:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>The behavior, content, or actions of users</li>
                    <li>Any technical issues or interruptions in service</li>
                    <li>Any damages or losses resulting from using our service</li>
                    <li>The accuracy or reliability of any content shared through our platform</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">5. User Safety</Typography>
            <Typography variant="body1">
                While we strive to maintain a safe environment, users interact at their own risk. We recommend:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Not sharing personal or sensitive information</li>
                    <li>Being cautious about meeting people in person</li>
                    <li>Reporting inappropriate behavior immediately</li>
                    <li>Using discretion in all interactions</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">6. Content Moderation</Typography>
            <Typography variant="body1">
                We reserve the right to terminate access for users who violate these terms. Violations may also be reported to appropriate authorities or RIT administration when necessary.
            </Typography>

            <Typography variant="h6" component="h2">7. Privacy</Typography>
            <Typography variant="body1">
                Your use of Brick City Connect is also governed by our Privacy Policy. While we implement reasonable security measures, we cannot guarantee the security of information transmitted through our service.
            </Typography>

            <Typography variant="h6" component="h2">8. Modifications</Typography>
            <Typography variant="body1">
                We reserve the right to modify these terms at any time. Continued use of Brick City Connect after changes constitutes acceptance of the modified terms.
            </Typography>

            <Typography variant="body1" sx={{ marginTop: '2rem', fontStyle: 'italic' }}>
                Last updated: [Current Date]
            </Typography>
        </Box>
    );
}

export default Terms;