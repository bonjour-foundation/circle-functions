import {firestore} from 'firebase-admin';

export interface UserPush {
    enabled: boolean;
    fcm_token: string;
}

export interface UserData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;

    language?: string;
    platforms?: string[];

    push?: UserPush;

    circles_center?: firestore.DocumentReference[];
    circles_connections?: firestore.DocumentReference[];

    created_at?: firestore.Timestamp;
    updated_at?: firestore.Timestamp;
}

export interface User {
    id: string;
    ref: firestore.DocumentReference;

    data: UserData;
}
