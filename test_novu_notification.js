// test_novu_notification.js
// Test sending a notification using Novu
// Set your credentials in a .env file:
// NOVU_SECRET_KEY=your_secret_key
// NOVU_SUBSCRIBER_ID=your_subscriber_id
// NOVU_EMAIL=your@email.com
// NOVU_WORKFLOW_KEY=test-event

require('dotenv').config();
const { Novu } = require('@novu/node');

const secretKey = process.env.NOVU_SECRET_KEY;
const subscriberId = process.env.NOVU_SUBSCRIBER_ID;
const email = process.env.NOVU_EMAIL;
const workflowKey = process.env.NOVU_WORKFLOW_KEY || 'test-event';

if (!secretKey || !subscriberId) {
    console.error('Please set NOVU_SECRET_KEY and NOVU_SUBSCRIBER_ID in your .env file.');
    process.exit(1);
}

const novu = new Novu(secretKey);

async function sendTestNotification() {
    try {
        const response = await novu.trigger(workflowKey, {
            to: {
                subscriberId,
                email,
            },
            payload: {
                message: 'This is a test notification from BitFlow!',
            },
        });
        console.log('Notification sent! Response:', response);
    } catch (error) {
        console.error('Failed to send notification:', error.response?.data || error.message || error);
    }
}

sendTestNotification(); 