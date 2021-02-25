import * as admin from 'firebase-admin';

import * as functions from 'firebase-functions';
import {Request} from 'firebase-functions/lib/providers/https';

import {addDays} from 'date-fns';

import {
    CircleReminderSearchRange,
    getSearchRange,
    pushNotification,
    Token,
    validBearer
} from '../utils/push-utils';

import {CircleData} from '../model/circle';

export async function sendPushDailyReminder(request: Request, response: any) {
    const isValidBearer: boolean = await validBearer(request);

    if (!isValidBearer) {
        response.status(400).json({
            error: 'Not Authorized'
        });
        return;
    }

    try {
        const now: Date = new Date();

        const promises = [];
        promises.push(sendNotificationsForDate(now));
        promises.push(sendNotificationsForDate(addDays(now, -1)));
        promises.push(sendNotificationsForDate(addDays(now, -2)));
        promises.push(sendNotificationsForDate(addDays(now, -3)));
        promises.push(sendNotificationsForDate(addDays(now, -4)));
        promises.push(sendNotificationsForDate(addDays(now, -5)));

        const results: number[] = await Promise.all(promises);

        if (results && results.length > 0) {
            const sum: number = results.reduce((a: number, b: number) => {
                return a + b;
            });

            response.json({
                result: `${sum} circles processed for notifications.`
            });
        } else {
            response.json({
                result: '0 circles found for notifications.'
            });
        }
    } catch (err) {
        response.status(500).json({
            error: err
        });
    }
}

function sendNotificationsForDate(selected: Date): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            const searchRange: CircleReminderSearchRange = await getSearchRange(selected);

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('circles');

            const circles: admin.firestore.QuerySnapshot = await collectionRef
                .where('reminder.next', '>=', searchRange.startAt)
                .where('reminder.next', '<', searchRange.endAt)
                .get();

            if (circles && circles.docs && circles.docs.length > 0) {
                await sendNotifications(circles.docs);

                resolve(circles.docs.length);
            } else {
                resolve(0);
            }
        } catch (err) {
            reject(err);
        }
    });
}

function sendNotifications(docs: Array< admin.firestore.DocumentData>): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const tokens: Token[] = await collectTokens(docs);

            if (tokens && tokens.length > 0) {
                const notificationsPromises: any[] = [];
                tokens.forEach((token: Token) => {
                    notificationsPromises.push(pushDailyReminderNotification(token));
                });

                await Promise.all(notificationsPromises);
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function collectTokens(docs: Array< admin.firestore.DocumentData>): Promise<Token[]> {
    return new Promise<Token[]>((resolve) => {
        const enTokens: Token = {
            language: 'en',
            tokens: []
        };

        const deTokens: Token = {
            language: 'de',
            tokens: []
        };

        for (const doc of docs) {
            const circle: CircleData = doc.data() as CircleData;

            if (circle.center && circle.center.push && circle.center.push.fcm_token) {
                if (circle.center.language && circle.center.language.length >= 2 && circle.center.language.toLowerCase().indexOf('de') === 0) {
                    deTokens.tokens.push(circle.center.push.fcm_token);
                } else {
                    enTokens.tokens.push(circle.center.push.fcm_token);
                }
            }
        }

        const results: Token[] = [];

        if (deTokens && deTokens.tokens && deTokens.tokens.length > 0) {
            results.push(deTokens);
        }

        if (enTokens && enTokens.tokens && enTokens.tokens.length > 0) {
            results.push(enTokens);
        }

        resolve(results);
    });
}

function pushDailyReminderNotification(token: Token): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const title: string = functions.config().circle.notifications.reminder[token.language].title;
        const body: string = functions.config().circle.notifications.reminder[token.language].body;

        try {
            await pushNotification(null, token, body, title);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
