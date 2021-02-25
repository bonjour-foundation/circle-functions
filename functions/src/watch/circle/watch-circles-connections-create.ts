import * as admin from 'firebase-admin';
import {EventContext} from 'firebase-functions';

import {updateCirclesConnections} from './update-circles-connections';
import {sendPushNewConnection} from '../../push/push-new-connection';

export async function applyCirclesConnectionsCreate(snap: admin.firestore.DocumentSnapshot, context: EventContext) {
    await updateCirclesConnections(snap, context);
    await sendPushNewConnection(snap, context);
}
