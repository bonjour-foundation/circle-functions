import * as admin from 'firebase-admin';

import * as functions from 'firebase-functions';
import {Request} from 'firebase-functions/lib/providers/https';

import {
    CircleReminderSearchRange,
    CircleToken,
    getSearchRange,
    pushNotification,
    Token,
    validBearer
} from '../utils/push-utils';
import {collectConnectionsTokens} from '../utils/push-connections-utils';

import {CircleData} from '../model/circle';

export async function sendPushEmergency(request: Request, response: any) {
    const isValidBearer: boolean = await validBearer(request);

    if (!isValidBearer) {
        response.status(400).json({
            error: 'Not Authorized'
        });
        return;
    }

    try {
        const now: Date = new Date();

        const searchRange: CircleReminderSearchRange = await getSearchRange(now);

        const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('circles');

        const circles: admin.firestore.QuerySnapshot = await collectionRef
            .where('reminder.alarm_at', '>=', searchRange.startAt)
            .where('reminder.alarm_at', '<', searchRange.endAt)
            .get();

        if (circles && circles.docs && circles.docs.length > 0) {
            await sendNotifications(circles.docs);

            response.json({
                result: `${circles.docs.length} circles processed for alarm notifications.`
            });
        } else {
            response.json({
                result: '0 circles found for alarm notifications.'
            });
        }
    } catch (err) {
        response.status(500).json({
            error: err
        });
    }
}

function sendNotifications(docs: Array<admin.firestore.DocumentData>): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const circleTokens: CircleToken[] = await collectTokens(docs);

            if (circleTokens && circleTokens.length > 0) {
                const notificationsPromises: any[] = [];

                circleTokens.forEach((circleToken: CircleToken) => {

                    if (circleToken.tokens && circleToken.tokens.length > 0) {
                        circleToken.tokens.forEach((token: Token) => {
                            notificationsPromises.push(pushEmergencyNotification(circleToken.first_name, token));
                        });
                    }

                });

                if (notificationsPromises && notificationsPromises.length > 0) {
                    await Promise.all(notificationsPromises);
                }
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function collectTokens(docs: Array<admin.firestore.DocumentData>): Promise<CircleToken[]> {
    return new Promise<CircleToken[]>(async (resolve) => {

        const results: CircleToken[] = [];

        for (const doc of docs) {
            const circleData: CircleData = doc.data() as CircleData;

            const circleToken: CircleToken | null = await collectConnectionsTokens(doc.id, circleData);

            if (circleToken && circleToken.tokens && circleToken.tokens.length > 0) {
                results.push(circleToken);
            }
        }

        resolve(results);
    });
}

function pushEmergencyNotification(circleFirstName: string, token: Token): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const title: string = functions.config().circle.notifications.emergency[token.language].title;
        const body: string = functions.config().circle.notifications.emergency[token.language].body;

        try {
            await pushNotification(circleFirstName, token, body, title);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
