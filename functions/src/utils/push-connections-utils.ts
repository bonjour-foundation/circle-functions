import {CircleToken, Token} from './push-utils';

import {CircleData} from '../model/circle';
import {CircleConnection, CircleConnectionData} from '../model/circle-connection';
import * as admin from 'firebase-admin';

export function collectConnectionsTokens(circleId: string, circleData: CircleData | null, filterConnectionId?: string): Promise<CircleToken | null> {
    return new Promise<CircleToken | null>(async (resolve) => {
        if (!circleData || !circleData.center || !circleId) {
            resolve(null);
            return;
        }

        const enTokens: Token = {
            language: 'en',
            tokens: []
        };

        const deTokens: Token = {
            language: 'de',
            tokens: []
        };

        const circleConnections: CircleConnection[] | null = await findCircleConnections(circleId);

        if (circleConnections && circleConnections.length > 0) {
            circleConnections.forEach((circleConnection: CircleConnection | null) => {
                if (circleConnection && circleConnection.data && circleConnection.data.push && circleConnection.data.push.fcm_token &&
                    (!filterConnectionId || filterConnectionId === undefined || filterConnectionId !== circleConnection.id)) {
                    if (circleConnection.data.language && circleConnection.data.language.length >= 2 && circleConnection.data.language.toLowerCase().indexOf('de') === 0) {
                        deTokens.tokens.push(circleConnection.data.push.fcm_token);
                    } else {
                        enTokens.tokens.push(circleConnection.data.push.fcm_token);
                    }
                }
            });
        }

        const circleToken: CircleToken = {
            circleId: circleId,
            first_name: circleData.center.first_name ? circleData.center.first_name : '',
            tokens: []
        };

        if (deTokens && deTokens.tokens && deTokens.tokens.length > 0) {
            circleToken.tokens.push(deTokens);
        }

        if (enTokens && enTokens.tokens && enTokens.tokens.length > 0) {
            circleToken.tokens.push(enTokens);
        }

        resolve(circleToken);
    });
}


function findCircleConnections(circleId: string): Promise<CircleConnection[] | null> {
    return new Promise<CircleConnection[] | null>(async (resolve, reject) => {
        try {
            if (!circleId || circleId === undefined) {
                resolve(null);
                return;
            }

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('/circles/' + circleId + '/connections');

            const snapShot: admin.firestore.QuerySnapshot = await collectionRef
                .where('push.enabled', '==', true)
                .where('push.fcm_token', '>=', '')
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

                resolve(circleConnections);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}
