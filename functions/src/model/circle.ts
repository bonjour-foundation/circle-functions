import {firestore} from 'firebase-admin';

export interface CircleEmergency {
    name: string;
    phone_number: string;
}

export interface CircleReminder {
    next: firestore.Timestamp;
    alarm_at: firestore.Timestamp;
}

export interface CirclePush {
    enabled?: boolean;
    fcm_token?: string;
}

export interface CircleCenter {
    user?: firestore.DocumentReference;

    first_name?: string;
    last_name?: string;
    phone_number?: string;

    language?: string;

    push?: CirclePush;
}

export interface CircleData {
    connections?: (firestore.DocumentReference | undefined)[];

    emergency?: CircleEmergency;

    reminder?: CircleReminder;

    center?: CircleCenter;

    created_at?: firestore.Timestamp;
    updated_at?: firestore.Timestamp;
}

export interface Circle {
    id: string;
    ref: firestore.DocumentReference;

    data: CircleData;
}
