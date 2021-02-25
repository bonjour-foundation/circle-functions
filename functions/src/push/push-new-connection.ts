import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {CircleData} from '../model/circle';
import {CircleConnectionData} from '../model/circle-connection';

import {findCircleData} from '../utils/circle-utils';
import {CircleToken, pushNotification, Token} from '../utils/push-utils';
import {collectConnectionsTokens} from '../utils/push-connections-utils';

export async function sendPushNewConnection(snap: admin.firestore.DocumentSnapshot, context: functions.EventContext) {
    const newValue: CircleConnectionData = snap.data() as CircleConnectionData;

    if (!newValue || !newValue.first_name || newValue.first_name === undefined || newValue.first_name === '') {
        return;
    }

    const circleId = context.params.circleId;
    const connectionId = context.params.connectionId;

    if (circleId && circleId !== undefined && circleId !== '') {
        const circleData: CircleData | null = await findCircleData(circleId);

        if (circleData) {
            const circleToken: CircleToken = {
                circleId: circleId,
                first_name: newValue.first_name,
                tokens: []
            };

            try {
                const circleTokens: Token[] | null = await collectCircleConnectionsTokens(circleId, circleData, connectionId);

                if (circleTokens && circleTokens.length > 0) {
                    circleToken.tokens = circleToken.tokens.concat(circleTokens);
                }

                const centerToken: Token | null = await collectCircleCenterToken(circleData);
                if (centerToken && centerToken.tokens && centerToken.tokens.length > 0) {
                    if (circleToken.tokens && circleToken.tokens.length > 0) {
                        const tokenIndex: number = circleToken.tokens.findIndex((token: Token) => {
                            return token.language === centerToken.language;
                        });

                        if (tokenIndex >= 0) {
                            circleToken.tokens[tokenIndex].tokens.push(centerToken.tokens[0]);
                        } else {
                            circleToken.tokens.push(centerToken);
                        }
                    } else {
                        circleToken.tokens.push(centerToken);
                    }
                }

                await sendNotifications(circleToken);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

function collectCircleCenterToken(circleData: CircleData | null): Promise<Token | null> {
    return new Promise<Token|null>((resolve) => {
        if (circleData && circleData.center && circleData.center.push && circleData.center.push.fcm_token) {
            const centerToken: Token = {
                language: circleData.center.language && circleData.center.language.length >= 2 && circleData.center.language.toLowerCase().indexOf('de') === 0 ? 'de' : 'en',
                tokens: []
            };

            centerToken.tokens.push(circleData.center.push.fcm_token);

            resolve(centerToken);
        } else {
            resolve(null);
        }
    });
}

function collectCircleConnectionsTokens(circleId: string, circleData: CircleData | null, connectionId: string): Promise<Token[] | null> {
    return new Promise<Token[]|null>(async (resolve, reject) => {
        try {
            const circleConnectionsToken: CircleToken | null = await collectConnectionsTokens(circleId, circleData, connectionId);

            if (circleConnectionsToken && circleConnectionsToken.tokens && circleConnectionsToken.tokens.length > 0) {
                resolve(circleConnectionsToken.tokens);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    });
}

async function sendNotifications(circleToken: CircleToken) {
    const notificationsPromises: any[] = [];

    if (circleToken.tokens && circleToken.tokens.length > 0) {
        circleToken.tokens.forEach((token: Token) => {
            notificationsPromises.push(pushConnectionNotification(circleToken.first_name, token));
        });
    }

    if (notificationsPromises && notificationsPromises.length > 0) {
        await Promise.all(notificationsPromises);
    }
}

function pushConnectionNotification(circleFirstName: string, token: Token): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const title: string = functions.config().circle.notifications.connection[token.language].title;
        const body: string = functions.config().circle.notifications.connection[token.language].body;

        try {
            await pushNotification(circleFirstName, token, body, title);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
