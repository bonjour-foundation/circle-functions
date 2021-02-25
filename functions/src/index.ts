import * as functions from 'firebase-functions';

import "firebase-functions/lib/logger/compat";

import * as admin from 'firebase-admin';
const app: admin.app.App = admin.initializeApp();
app.firestore().settings({timestampsInSnapshots: true});

import {sendPushDailyReminder} from './push/push-daily-reminder';
import {sendPushEmergency} from './push/push-emergency';

import {applyUsersUpdate} from './watch/user/watch-users-update';
import {applyUsersDelete} from './watch/user/watch-users-delete';

import {sendPushState} from './push/push-state';

import {applyCirclesConnectionsCreate} from './watch/circle/watch-circles-connections-create';

export const pushDailyReminder = functions.https.onRequest(sendPushDailyReminder);

export const pushEmergency = functions.https.onRequest(sendPushEmergency);

export const pushState = functions.firestore.document('circles/{circleId}/states/{connectionId}').onCreate(sendPushState);

export const watchUsersUpdate = functions.firestore.document('users/{userId}').onUpdate(applyUsersUpdate);

export const watchCirclesConnectionsCreate = functions.firestore.document('circles/{circleId}/connections/{connectionId}').onCreate(applyCirclesConnectionsCreate);

export const watchUsersDelete = functions.auth.user().onDelete(applyUsersDelete);
