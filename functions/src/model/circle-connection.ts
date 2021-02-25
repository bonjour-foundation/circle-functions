import {firestore} from 'firebase-admin';

export interface CircleConnectionPush {
    enabled?: boolean;
    fcm_token?: string;
}

export enum CircleConnectionState {
    REQUESTED = 'requested',
    CONFIRMED = 'confirmed',
    DECLINED = 'declined'
}

export interface CircleConnectionData {
    user?: firestore.DocumentReference;
    state?: CircleConnectionState;

    first_name?: string;
    last_name?: string;
    phone_number?: string;

    language?: string;

    push?: CircleConnectionPush;

    created_at?: firestore.Timestamp;
    updated_at: firestore.Timestamp;
}

export interface CircleConnection {
    id: string;
    ref: firestore.DocumentReference;

    data: CircleConnectionData;
}
