import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {CircleStateData, CircleStateType} from '../model/circle-state';
import {CircleData} from '../model/circle';

import {findCircleData} from '../utils/circle-utils';
import {CircleToken, pushNotification, Token} from '../utils/push-utils';
import {collectConnectionsTokens} from '../utils/push-connections-utils';

export async function sendPushState(snap: admin.firestore.DocumentSnapshot, context: functions.EventContext) {
    const newState: CircleStateData = snap.data() as CircleStateData;

    const circleId = context.params.circleId;

    if (circleId && circleId !== undefined && circleId !== '') {
        const circleData: CircleData | null = await findCircleData(circleId);

        if (circleData && circleData.connections && circleData.connections.length > 0) {
            try {
                await sendNotifications(circleId, circleData, newState);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

function sendNotifications(circleId: string, circleData: CircleData | null, state: CircleStateData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const circleToken: CircleToken | null = await collectConnectionsTokens(circleId, circleData);

            if (circleToken && circleToken.tokens && circleToken.tokens.length > 0) {
                const notificationsPromises: any[] = [];

                if (circleToken.tokens && circleToken.tokens.length > 0) {
                    circleToken.tokens.forEach((token: Token) => {
                        notificationsPromises.push(pushStateNotification(circleToken.first_name, token, state));
                    });
                }

                if (notificationsPromises && notificationsPromises.length > 0) {
                    await Promise.all(notificationsPromises);
                }
            }
        } catch (err) {
            reject(err);
        }
    });
}

function pushStateNotification(circleFirstName: string, token: Token, state: CircleStateData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const bodyLabel: string | null = getBody(token, state);
        if (!bodyLabel || bodyLabel === '' || bodyLabel === undefined) {
            resolve();
            return;
        }

        const title: string = functions.config().circle.notifications.state[token.language].title;

        try {
            await pushNotification(circleFirstName, token, bodyLabel, title);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function getBody(token: Token, state: CircleStateData): string | null {
    if (state && state.state === CircleStateType.SUPER) {
        return functions.config().circle.notifications.state[token.language].body.super;
    } else if (state && state.state === CircleStateType.WELL) {
        return functions.config().circle.notifications.state[token.language].body.well;
    } else if (state && state.state === CircleStateType.OKAY) {
        return functions.config().circle.notifications.state[token.language].body.okay;
    } else if (state && state.state === CircleStateType.NOT_WELL) {
        return functions.config().circle.notifications.state[token.language].body.not_well;
    } else if (state && state.state === CircleStateType.BAD) {
        return functions.config().circle.notifications.state[token.language].body.bad;
    } else {
        return null;
    }
}
