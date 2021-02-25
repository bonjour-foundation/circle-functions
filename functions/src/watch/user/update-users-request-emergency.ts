import * as admin from 'firebase-admin';

import {Change} from 'firebase-functions';

import {UserData} from '../../model/user';
import {CircleState, CircleStateData} from '../../model/circle-state';

enum CirclesStateField {
    REQUEST,
    EMERGENCY
}

export async function updateUsersRequestEmergency(change: Change<admin.firestore.DocumentSnapshot>) {
    const newValue: UserData = change.after.data() as UserData;

    const previousValue: UserData = change.before.data() as UserData;

    if (!newValue || !previousValue || newValue.first_name === previousValue.first_name) {
        return;
    }

    try {
        await updateCirclesConnections(change, newValue, CirclesStateField.REQUEST);
        await updateCirclesConnections(change, newValue, CirclesStateField.EMERGENCY);
    } catch (err) {
        console.error(err);
    }
}

function updateCirclesConnections(change: Change<admin.firestore.DocumentSnapshot>, newValue: UserData, field: CirclesStateField): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
       try {
           if (!newValue || !newValue.circles_connections || newValue.circles_connections.length <= 0 || !newValue.first_name) {
               resolve();
               return;
           }

           for (const circleRef of newValue.circles_connections) {
               const circleStates: CircleState[] | null = await findCirclesStates(circleRef, change.after.ref, field);

               if (circleStates && circleStates.length > 0) {
                   const promises = [];

                   for (const circleState of circleStates) {
                       promises.push(updateDealWithFirstName(circleRef, circleState.id, newValue.first_name, field));
                   }

                   if (promises && promises.length > 0) {
                       await Promise.all(promises);
                   }
               }
           }

           resolve();
       } catch (err) {
           reject(err);
       }
    });
}

function findCirclesStates(circleRef: admin.firestore.DocumentReference, userRef: admin.firestore.DocumentReference, field: CirclesStateField): Promise<CircleState[] | null> {
    return new Promise<CircleState[] | null>(async (resolve, reject) => {
        try {
            if (!circleRef || !userRef) {
                resolve(null);
                return;
            }

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('/circles/' + circleRef.id + '/states');

            const snapShot: admin.firestore.QuerySnapshot = await collectionRef
                .where((field === CirclesStateField.EMERGENCY ? 'emergency.deal_with.user' : 'request.deal_with.user'), '==', userRef)
                .get();

            if (snapShot && snapShot.docs && snapShot.docs.length > 0) {
                const circlesStates: CircleState[] = snapShot.docs.map((doc) => {
                    const data: Object = doc.data() as CircleStateData;
                    const id = doc.id;
                    const ref = doc.ref;

                    return {
                        id: id,
                        ref: ref,
                        data: data
                    } as CircleState;
                });

                resolve(circlesStates);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}

function updateDealWithFirstName(circleRef: admin.firestore.DocumentReference, circleStateId: string, newFirstName: string, field: CirclesStateField): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!circleRef || !circleStateId || !newFirstName) {
                resolve();
                return;
            }

            let updateData: CircleStateData;

            if (field === CirclesStateField.EMERGENCY) {
                updateData = {
                    emergency: {
                        deal_with: {
                            first_name: newFirstName
                        }
                    }
                };
            } else {
                updateData = {
                    request: {
                        deal_with: {
                            first_name: newFirstName
                        }
                    }
                };
            }

            updateData.updated_at = admin.firestore.Timestamp.now();

            await admin.firestore().collection('/circles/' + circleRef.id + '/states').doc(circleStateId).set(updateData, {merge: true});

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
