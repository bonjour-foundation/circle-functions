import * as admin from 'firebase-admin';

import {Change} from 'firebase-functions';

import {UserData} from '../../model/user';
import {CircleData, CirclePush} from '../../model/circle';

import {needUpdate} from '../../utils/user-utils';

export async function updateUsersCenter(change: Change<admin.firestore.DocumentSnapshot>) {
    const newValue: UserData = change.after.data() as UserData;

    const previousValue: UserData = change.before.data() as UserData;

    const update: boolean = await needUpdate(previousValue, newValue);

    if (!update) {
        return;
    }

    try {
        await updateCenterCircles(change, newValue);
    } catch (err) {
        console.error(err);
    }
}

function updateCenterCircles(change: Change<admin.firestore.DocumentSnapshot>, newValue: UserData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!newValue || !newValue.circles_center || newValue.circles_center.length <= 0) {
                resolve();
                return;
            }

            for (const circleRef of newValue.circles_center) {
                const circleData: CircleData | null = await findCircleData(circleRef);

                if (circleData) {
                    const updateData: CircleData = {
                        updated_at: admin.firestore.Timestamp.now(),
                        center: {
                            first_name: newValue.first_name,
                            last_name: newValue.last_name,
                            phone_number: newValue.phone_number
                        }
                    };

                    if (newValue.language && updateData.center) {
                        updateData.center.language = newValue.language;
                    }

                    if (newValue.push) {
                        let push: CirclePush | null = null;

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

                        if (push && updateData.center) {
                            updateData.center.push = push;
                        }
                    }

                    await admin.firestore().collection('circles').doc(circleRef.id).set(updateData, {merge: true});
                }
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function findCircleData(circleRef: admin.firestore.DocumentReference): Promise<CircleData | null> {
    return new Promise<CircleData | null>(async (resolve, reject) => {
        try {
            if (!circleRef) {
                resolve(null);
                return;
            }

            const docSnapshot: admin.firestore.DocumentSnapshot = await admin.firestore().doc('/circles/' + circleRef.id).get();

            if (docSnapshot && docSnapshot.exists) {
                resolve(docSnapshot.data() as CircleData);
                return;
            }

            resolve(null);
        } catch (err) {
            reject(err);
        }
    })
}
