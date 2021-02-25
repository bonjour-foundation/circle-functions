import * as admin from 'firebase-admin';

import {CircleConnection, CircleConnectionData} from '../model/circle-connection';

export function findCircleConnection(circleRef: admin.firestore.DocumentReference, userRef: admin.firestore.DocumentReference): Promise<CircleConnection | null> {
    return new Promise<CircleConnection | null>(async (resolve, reject) => {
        try {
            if (!circleRef || !userRef) {
                resolve(null);
                return;
            }

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('/circles/' + circleRef.id + '/connections');

            const snapShot: admin.firestore.QuerySnapshot = await collectionRef
                .where('user', '==', userRef)
                .get();

            if (snapShot && snapShot.docs && snapShot.docs.length > 0) {
                const circleConnections: CircleConnection[] = snapShot.docs.map((doc) => {
                    const data: Object = doc.data() as CircleConnectionData;
                    const id = doc.id;
                    const ref = doc.ref;

                    return {
                        id: id,
                        ref: ref,
                        data: data
                    } as CircleConnection;
                });

                resolve(circleConnections && circleConnections.length > 0 ? circleConnections[0] : null);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}

export function findCircleConnections(circleRef: admin.firestore.DocumentReference): Promise<CircleConnection[] | null> {
    return new Promise<CircleConnection[] | null>(async (resolve, reject) => {
        try {
            if (!circleRef) {
                resolve(null);
                return;
            }

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('/circles/' + circleRef.id + '/connections');

            const snapShot: admin.firestore.QuerySnapshot = await collectionRef.get();

            if (snapShot && snapShot.docs && snapShot.docs.length > 0) {
                const circleConnections: CircleConnection[] = snapShot.docs.map((doc) => {
                    const data: Object = doc.data() as CircleConnectionData;
                    const id = doc.id;
                    const ref = doc.ref;

                    return {
                        id: id,
                        ref: ref,
                        data: data
                    } as CircleConnection;
                });

                resolve(circleConnections && circleConnections.length > 0 ? circleConnections : null);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}
