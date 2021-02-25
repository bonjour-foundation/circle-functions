import * as admin from 'firebase-admin';
import {Change, EventContext} from 'firebase-functions';

import {updateUsersRequestEmergency} from './update-users-request-emergency';
import {updateUsersCenter} from './update-users-center';
import {updateUsersConnections} from './update-users-connections';

export async function applyUsersUpdate(change: Change<admin.firestore.DocumentSnapshot>, context: EventContext) {
    await updateUsersCenter(change);
    await updateUsersConnections(change);
    await updateUsersRequestEmergency(change);
}
