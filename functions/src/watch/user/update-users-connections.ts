import * as admin from 'firebase-admin';

import {Change} from 'firebase-functions';

import {UserData} from '../../model/user';
import {CircleConnection, CircleConnectionData, CircleConnectionPush} from '../../model/circle-connection';

import {findCircleConnection} from '../../utils/circle-connection-utils';

import {needUpdate} from '../../utils/user-utils';

export async function updateUsersConnections(change: Change<admin.firestore.DocumentSnapshot>) {
    const newValue: UserData = change.after.data() as UserData;

    const previousValue: UserData = change.before.data() as UserData;

    const update: boolean = await needUpdate(previousValue, newValue);

    if (!update) {
        return;
    }

    try {
        await updateCirclesConnections(change, newValue);
    } catch (err) {
        console.error(err);
    }
}

function updateCirclesConnections(change: Change<admin.firestore.DocumentSnapshot>, newValue: UserData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!newValue || !newValue.circles_connections || newValue.circles_connections.length <= 0) {
                resolve();
                return;
            }

            for (const circleRef of newValue.circles_connections) {
                const circleConnection: CircleConnection | null = await findCircleConnection(circleRef, change.after.ref);

                if (circleConnection) {
                    let push: CircleConnectionPush | null = null;

                    if (newValue.push) {
                        if (newValue.push.fcm_token) {
                            push = {
                                // @ts-ignore
                                fcm_token: newValue.push.fcm_token
                            };
                        }

                        if (newValue.push.hasOwnProperty('enabled')) {
                            if (!push) {
                                push = {
                                    // @ts-ignore
                                    enabled: newValue.push.enabled
                                };
                            } else {
                                push['enabled'] = newValue.push.enabled;
                            }
                        }
                    }

                    const updateData: CircleConnectionData = {
                        updated_at: admin.firestore.Timestamp.now()
                    };

                    if (push) {
                        updateData.push = push;
                    }

                    if (newValue.language) {
                        updateData.language = newValue.language;
                    }

                    updateData.first_name = newValue.first_name;
                    updateData.last_name = newValue.last_name;
                    updateData.phone_number = newValue.phone_number;

                    await admin.firestore().collection('/circles/' + circleRef.id + '/connections').doc(circleConnection.id).set(updateData, {merge: true});
                }
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
