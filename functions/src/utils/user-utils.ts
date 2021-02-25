import * as admin from 'firebase-admin';

import {UserData} from '../model/user';

export function findUserData(userId: string): Promise<UserData | null> {
    return new Promise<UserData | null>(async (resolve, reject) => {
        try {
            if (!userId || userId === '' || userId === undefined) {
                resolve(null);
                return;
            }

            const docSnapshot: admin.firestore.DocumentSnapshot = await admin.firestore().doc('/users/' + userId).get();

            if (docSnapshot && docSnapshot.exists) {
                resolve(docSnapshot.data() as UserData);
                return;
            }

            resolve(null);
        } catch (err) {
            reject(err);
        }
    })
}

export function needUpdate(previousValue:  UserData, newValue: UserData): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        if (!previousValue || !newValue) {
            resolve(false);
            return;
        }

        let samePush: boolean = true;
        if (newValue.push && previousValue.push) {
            samePush = previousValue.push.enabled === newValue.push.enabled && previousValue.push.fcm_token === newValue.push.fcm_token;
        } else if ((newValue.push && !previousValue.push) || (!newValue.push && previousValue.push)) {
            samePush = false;
        }

        const sameFirstName: boolean = newValue.first_name === previousValue.first_name;
        const sameLastName: boolean = newValue.last_name === previousValue.last_name;
        const samePhoneNumber: boolean = newValue.phone_number === previousValue.phone_number;
        const sameLanguage: boolean = newValue.language === previousValue.language;

        let sameCenter: boolean = true;
        if ((!newValue.circles_center && previousValue.circles_center) || (newValue.circles_center && !previousValue.circles_center)) {
            sameCenter = false;
        }

        let sameConnections: boolean = true;
        if ((!newValue.circles_connections && previousValue.circles_connections) || (newValue.circles_connections && !previousValue.circles_connections)) {
            sameConnections = false;
        }

        const notModified = samePush && sameFirstName && sameLastName && samePhoneNumber && sameLanguage && sameCenter && sameConnections;

        resolve(!notModified);
    });
}
