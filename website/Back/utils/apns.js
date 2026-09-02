const path = require('path');
const apn = require('@parse/node-apn');

let provider = null;
let providerResolved = false;

function getProvider() {
    if (providerResolved) return provider;
    providerResolved = true;

    const { APNS_KEY_PATH, APNS_KEY_ID, APNS_TEAM_ID } = process.env;

    if (!APNS_KEY_PATH || !APNS_KEY_ID || !APNS_TEAM_ID) {
        console.warn('APNs disabled: APNS_KEY_PATH, APNS_KEY_ID or APNS_TEAM_ID is missing');
        return null;
    }

    provider = new apn.Provider({
        token: {
            key: path.resolve(__dirname, '..', APNS_KEY_PATH),
            keyId: APNS_KEY_ID,
            teamId: APNS_TEAM_ID
        },
        production: process.env.APNS_PRODUCTION === 'true'
    });

    return provider;
}

async function sendPush(tokens, { title, body, payload = {} }) {
    if (!tokens || tokens.length === 0) return [];

    const apnsProvider = getProvider();
    if (!apnsProvider) return [];

    const notification = new apn.Notification();
    notification.topic = process.env.APNS_BUNDLE_ID;
    notification.alert = { title, body };
    notification.sound = 'default';
    notification.payload = payload;
    notification.pushType = 'alert';
    notification.expiry = Math.floor(Date.now() / 1000) + 3600;

    const result = await apnsProvider.send(notification, tokens);

    return result.failed
        .filter(f => {
            const reason = f.response && f.response.reason;
            return Number(f.status) === 410
                || reason === 'Unregistered'
                || reason === 'BadDeviceToken';
        })
        .map(f => f.device);
}

function shutdown() {
    if (provider) provider.shutdown();
}

module.exports = { sendPush, shutdown };
