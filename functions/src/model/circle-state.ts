import {firestore} from 'firebase-admin';

export enum CircleStateType {
    SUPER = 'super',
    WELL = 'well',
    OKAY = 'okay',
    NOT_WELL = 'not_well',
    BAD = 'bad'
}

export enum CircleRequestType {
    COFFEE = 'coffee',
    HAND = 'hand',
    PHONE = 'phone',
    GOOD  = 'good'
}

export interface CircleStateDealWith {
    user?: firestore.DocumentReference;
    first_name: string;
}

export interface CircleRequest {
    type?: CircleRequestType;
    deal_with?: CircleStateDealWith;
}

export interface CircleEmergency {
    deal_with?: CircleStateDealWith;
}

export interface CircleStateData {
    state?: CircleStateType;

    request?: CircleRequest;

    emergency?: CircleEmergency;

    created_at?: firestore.Timestamp;
    updated_at?: firestore.Timestamp;
}

export interface CircleState {
    id: string;
    ref: firestore.DocumentReference;

    data: CircleStateData;
}
