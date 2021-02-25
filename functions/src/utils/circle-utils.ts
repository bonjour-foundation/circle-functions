import * as admin from 'firebase-admin';

import {CircleData} from '../model/circle';

export function findCircleData(circleId: string): Promise<CircleData | null> {
    return new Promise<CircleData | null>(async (resolve, reject) => {
        try {
            if (!circleId || circleId === '' || circleId === undefined) {
                resolve(null);
                return;
            }

            const docSnapshot: admin.firestore.DocumentSnapshot = await admin.firestore().doc('/circles/' + circleId).get();

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
