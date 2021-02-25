import {EventContext} from 'firebase-functions';
import {UserRecord} from 'firebase-functions/lib/providers/auth';

import * as admin from 'firebase-admin';

import {User, UserData} from '../../model/user';

import {deleteCircleConnections} from '../../utils/circle-delete-connections';
import {deleteCircleCenters} from '../../utils/circle-delete-centers';

export async function applyUsersDelete(userRecord: UserRecord, context: EventContext) {
    if (!userRecord || !userRecord.uid || userRecord.uid === undefined || userRecord.uid === '') {
        return;
    }

    try {
        const user: User = await findUser(userRecord.uid);

        if (!user) {
            return;
        }

        await deleteCircleConnections(user);
        await deleteCircleCenters(user);
        await deleteUser(userRecord.uid);
    } catch (err) {
        console.error(err);
    }
}

function findUser(id: string): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
        try {
            const doc: admin.firestore.DocumentReference = admin.firestore().collection('users').doc(id);

            const docSnapshot: admin.firestore.DocumentSnapshot = await doc.get();

            if (!docSnapshot) {
                reject('User not found');
                return;
            }

            resolve({
                id: id,
                ref: docSnapshot.ref,
                data: docSnapshot.data() as UserData
            });
        } catch (err) {
            reject(err);
        }
    });
}

function deleteUser(id: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
       try {
           const doc: admin.firestore.DocumentReference = admin.firestore().collection('users').doc(id);

           await doc.delete();

           resolve();
       } catch (err) {
           reject(err);
       }
    });
}
