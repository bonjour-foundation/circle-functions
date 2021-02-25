import * as admin from 'firebase-admin';

import * as functions from 'firebase-functions';
import {Request} from 'firebase-functions/lib/providers/https';

import {addHours, endOfMinute, getMinutes, setMinutes, startOfMinute} from 'date-fns';

import {PushResources} from './push-resources';

export interface Token {
    language: string;
    tokens: string[];
}

export interface CircleToken {
    circleId: string;
    first_name: string;
    tokens: Token[];
}

export interface CircleReminderSearchRange {
    startAt: admin.firestore.Timestamp;
    endAt: admin.firestore.Timestamp;
}

export function validBearer(request: Request) {
    return new Promise<boolean>((resolve) => {
        const key: string = functions.config().circle.key;

        const authorization: string | undefined = request.get('Authorization');
        const split: string[] = authorization ? authorization.split('Bearer ') : [];
        const bearerKey: string | undefined = split && split.length >= 2 ? split[1] : undefined;

        resolve(key === bearerKey);
    });
}

export function getSearchRange(selected: Date): Promise<CircleReminderSearchRange> {
    return new Promise<CircleReminderSearchRange>((resolve) => {
        const minutes: number = getMinutes(selected);

        let start: Date;
        let end: Date;

        if (minutes >= 45 && minutes <= 59) {
            // If 10:50 then from 10:45 (inclusive) to 10:00 (exclusive)
            start = setMinutes(selected, 45);
            end = setMinutes(addHours(selected, 1), 0);
        } else if (minutes >= 15 && minutes < 30) {
            // If 10:20 then from 10:15 (inclusive) to 10:30 (exclusive)
            start = setMinutes(selected, 15);
            end = setMinutes(selected, 30);
        } else if (minutes >= 30 && minutes < 45) {
            // If 10:35 then from 10:30 (inclusive) to 10:45 (exclusive)
            start = setMinutes(selected, 30);
            end = setMinutes(selected, 45);
        } else {
            // If 10:05 then from 10:00 (inclusive) to 10:15 (exclusive)
            start = setMinutes(selected, 0);
            end = setMinutes(selected, 15);
        }

        start = startOfMinute(start);
        end = endOfMinute(end);

       resolve({
            startAt: admin.firestore.Timestamp.fromDate(startOfMinute(start)),
            endAt: admin.firestore.Timestamp.fromDate(startOfMinute(end))
        });

    });
}

// https://firebase.google.com/docs/cloud-messaging/send-message
// sendMultiCast to max 100 recipients
export function limitLength(tokens: string[]): Promise<string[][] | null> {
    return new Promise<string[][] | null>((resolve) => {
        if (!tokens || tokens.length <= 0) {
            resolve(null);
            return;
        }

        const results: string[][] = [];

        while (tokens.length) {
            results.push(tokens.splice(0, 100));
        }

        resolve(results);
    });
}

export function pushNotification(circleFirstName: string | null, token: Token, bodyLabel: string, titleLabel: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (!token || !token.tokens || token.tokens.length <= 0) {
            resolve();
            return;
        }

        const splitTokens: string[][] | null = await limitLength(token.tokens);

        if (!splitTokens || splitTokens.length <= 0) {
            resolve();
            return;
        }

        try {
            const promises: any[] = [];
            splitTokens.forEach((sendTokens: string[]) => {

                let body: string = bodyLabel;
                if (body && body.indexOf('{0}') > -1 && circleFirstName) {
                    body = body.replace('{0}', circleFirstName);
                }

                const message: admin.messaging.MulticastMessage = {
                    notification: {
                        title: titleLabel,
                        body: body
                    },
                    android: {
                        notification: {
                            icon: PushResources.Constants.MSG.ICON,
                            color: PushResources.Constants.MSG.COLOR
                        }
                    },
                    tokens: sendTokens
                };

                promises.push(admin.messaging().sendMulticast(message));
            });

            // In case we want to count the failure: admin.messaging.BatchResponse[]
            await Promise.all(promises);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
