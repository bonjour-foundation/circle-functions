import * as admin from 'firebase-admin';

import {User} from '../model/user';
import {CircleData} from '../model/circle';
import {CircleConnection} from '../model/circle-connection';

import {findCircleData} from './circle-utils';
import {findCircleConnection} from './circle-connection-utils';

export function deleteCircleConnections(user: User): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!user || !user.data || !user.data.circles_connections || user.data.circles_connections.length <= 0) {
                resolve();
                return;
            }

            const promises = [];

            for (let i: number = 0; i < user.data.circles_connections.length; i++) {
                promises.push(deleteCircleConnection(user, user.data.circles_connections[i]));
            }

            if (promises) {
                await Promise.all(promises);
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function deleteCircleConnection(user: User, circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await deleteCircleConnectionCollection(user, circleRef);
            await deleteCircleConnectionList(user, circleRef);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function deleteCircleConnectionList(user: User, circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (!circleRef) {
            resolve();
            return;
        }

        try {
            const circleData: CircleData | null = await findCircleData(circleRef.id);

            if (!circleData || !circleData.connections || circleData.connections.length <= 0) {
                resolve();
                return;
            }

            const index: number = circleData.connections.findIndex((connection: admin.firestore.DocumentReference | undefined) => {
                return connection && connection.isEqual(user.ref);
            });

            if (index < 0) {
                resolve();
                return;
            }

            circleData.connections.splice(index, 1);

            const updateData: CircleData = {
                updated_at: admin.firestore.Timestamp.now(),
                connections: circleData.connections
            };

            await admin.firestore().collection('circles').doc(circleRef.id).set(updateData, {merge: true});

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function deleteCircleConnectionCollection(user: User, circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!circleRef) {
                resolve();
                return;
            }

            const circleConnection: CircleConnection | null = await findCircleConnection(circleRef, user.ref);

            if (circleConnection) {
                await circleConnection.ref.delete();
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
