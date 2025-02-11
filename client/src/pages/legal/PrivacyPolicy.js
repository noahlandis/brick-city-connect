import { Box, Typography } from '@mui/material';

function PrivacyPolicy() {
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
            <Typography variant="h4" component="h1">Privacy Policy</Typography>
            
            <Typography variant="body1">
                At Brick City Connect, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our service.
            </Typography>

            <Typography variant="h6" component="h2">1. Information We Collect</Typography>
            <Typography variant="body1">
                We collect the following types of information:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Your RIT email address and username</li>
                    <li>Authentication data from Google Sign-In (if used)</li>
                    <li>Technical information such as IP address and browser type</li>
                    <li>Usage data including chat session times and connection data</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">2. Video Chat Privacy</Typography>
            <Typography variant="body1">
                Regarding our video chat service:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Video chats are not recorded or stored by Brick City Connect</li>
                    <li>Video streams are peer-to-peer encrypted using SRTP (Secure Real-time Transport Protocol)</li>
                    <li>We do not have access to the content of your video conversations</li>
                    <li>Chat sessions are randomly matched and anonymous</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">3. How We Use Your Information</Typography>
            <Typography variant="body1">
                We use your information to:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Verify your RIT student status</li>
                    <li>Provide and maintain our service</li>
                    <li>Match you with other users for video chats</li>
                    <li>Enforce our Terms and Conditions</li>
                    <li>Prevent abuse and investigate violations</li>
                    <li>Improve our service and user experience</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">4. Information Sharing</Typography>
            <Typography variant="body1">
                We do not sell or share your personal information with third parties except:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>When required by law or legal process</li>
                    <li>To protect our rights or property</li>
                    <li>To prevent abuse or harmful activities</li>
                    <li>In the event of a business transfer or acquisition</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">5. Data Security</Typography>
            <Typography variant="body1">
                We implement reasonable security measures to protect your information. However, no internet transmission is completely secure. We cannot guarantee the security of information transmitted through our service.
            </Typography>

            <Typography variant="h6" component="h2">6. Your Rights</Typography>
            <Typography variant="body1">
                You have the right to:
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                    <li>Access your personal information</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Request deletion of your account and data</li>
                    <li>Opt-out of certain data collection</li>
                </ul>
            </Typography>

            <Typography variant="h6" component="h2">7. Cookies and Tracking</Typography>
            <Typography variant="body1">
                We use cookies and similar technologies for authentication and service functionality. These are necessary for the operation of our service and cannot be disabled while using Brick City Connect.
            </Typography>

            <Typography variant="h6" component="h2">8. Changes to Privacy Policy</Typography>
            <Typography variant="body1">
                We may update this Privacy Policy periodically. We will notify users of any material changes through our service or via email. Continued use of Brick City Connect after changes constitutes acceptance of the updated Privacy Policy.
            </Typography>

            <Typography variant="h6" component="h2">9. Contact Us</Typography>
            <Typography variant="body1">
                If you have questions about this Privacy Policy or your personal information, please contact us at <a style={{ color: '#F76902' }} href="mailto:brickcityconnect@gmail.com">brickcityconnect@gmail.com</a>.
            </Typography>

            <Typography variant="body1" sx={{ marginTop: '2rem', fontStyle: 'italic' }}>
                Last updated: 1/21/2025
            </Typography>
        </Box>
    );
}

export default PrivacyPolicy;