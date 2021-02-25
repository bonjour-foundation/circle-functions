import * as admin from 'firebase-admin';

import {User, UserData} from '../model/user';
import {CircleConnection} from '../model/circle-connection';

import {deleteCircleSubCollection} from './circle-delete-utils';
import {findCircleConnections} from './circle-connection-utils';
import {findUserData} from './user-utils';

export function deleteCircleCenters(user: User): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!user || !user.data || !user.data.circles_center || user.data.circles_center.length <= 0) {
                resolve();
                return;
            }

            const promises = [];

            for (let i: number = 0; i < user.data.circles_center.length; i++) {
                promises.push(deleteCircleCenter(user.data.circles_center[i]));
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

function deleteCircleCenter(circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await removeCircleFromConnectedUsers(circleRef);

            await deleteCircleSubCollection(circleRef, 'connections');
            await deleteCircleSubCollection(circleRef, 'states');
            await deleteCircle(circleRef);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function deleteCircle(circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await circleRef.delete();

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function removeCircleFromConnectedUsers(circleRef: admin.firestore.DocumentReference): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const circleConnections: CircleConnection[] | null = await findCircleConnections(circleRef);

            if (circleConnections && circleConnections.length > 0) {
                const promises = [];

                for (let i: number = 0; i < circleConnections.length; i++) {
                    promises.push(deleteCircleFromUserConnectionList(circleRef, circleConnections[i]));
                }

                if (promises && promises.length > 0) {
                    await Promise.all(promises);
                }
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function deleteCircleFromUserConnectionList(circleRef: admin.firestore.DocumentReference, circleConnection: CircleConnection): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (!circleConnection || !circleConnection.data || !circleConnection.data.user || !circleRef) {
            resolve();
            return;
        }

        try {
            const userData: UserData | null = await findUserData(circleConnection.data.user.id);

            if (!userData || !userData.circles_connections || userData.circles_connections.length <= 0) {
                resolve();
                return;
            }

            const index: number = userData.circles_connections.findIndex((connection: admin.firestore.DocumentReference | undefined) => {
                return connection && connection.isEqual(circleRef);
            });

            if (index < 0) {
                resolve();
                return;
            }

            userData.circles_connections.splice(index, 1);

            const updateData: UserData = {
                updated_at: admin.firestore.Timestamp.now(),
                circles_connections: userData.circles_connections
            };

            await admin.firestore().collection('users').doc(circleConnection.data.user.id).set(updateData, {merge: true});

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
