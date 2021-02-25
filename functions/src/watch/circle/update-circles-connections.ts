import * as admin from 'firebase-admin';
import {EventContext} from 'firebase-functions';

import {CircleData} from '../../model/circle';
import {CircleConnectionData} from '../../model/circle-connection';

import {findCircleData} from '../../utils/circle-utils';

export async function updateCirclesConnections(snap: admin.firestore.DocumentSnapshot, context: EventContext) {
    const newValue: CircleConnectionData = snap.data() as CircleConnectionData;

    const circleId = context.params.circleId;

    if (newValue && newValue.user && circleId && circleId !== undefined && circleId !== '') {
        const circleData: CircleData | null = await findCircleData(circleId);

        if (circleData) {
            try {
                await updateCircleConnection(circleData, circleId, newValue);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

function updateCircleConnection(data: CircleData, circleId: string, connection: CircleConnectionData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (data && data.connections && data.connections.length > 0 && data.connections.indexOf(connection.user) > -1) {
                resolve();
                return;
            }

            if (!data.connections) {
                data.connections = [];
            }

            data.connections.push(connection.user);

            const updateData: CircleData = {
                updated_at: admin.firestore.Timestamp.now(),
                connections: data.connections
            };

            await admin.firestore().collection('circles').doc(circleId).set(updateData, {merge: true});

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
