import * as admin from 'firebase-admin';

function findAllDocReferences(circleRef: admin.firestore.DocumentReference, collection: string): Promise<admin.firestore.QueryDocumentSnapshot[] | null> {
    return new Promise<admin.firestore.QueryDocumentSnapshot[] | null>(async (resolve, reject) => {
        try {
            if (!circleRef || !collection) {
                resolve(null);
                return;
            }

            const collectionRef: admin.firestore.CollectionReference = admin.firestore().collection('/circles/' + circleRef.id + '/' + collection);

            const snapShot: admin.firestore.QuerySnapshot = await collectionRef.get();

            if (snapShot && snapShot.docs && snapShot.docs.length > 0) {
                resolve(snapShot.docs);
            } else {
                resolve(null);
            }
        } catch (err) {
            reject(err);
        }
    })
}

export function deleteCircleSubCollection(circleRef: admin.firestore.DocumentReference, collection: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!circleRef || !collection) {
                resolve();
                return;
            }

            const docs: admin.firestore.QueryDocumentSnapshot[] | null = await findAllDocReferences(circleRef, collection);

            if (docs && docs.length > 0) {
                const promises = [];

                for (let i: number = 0; i < docs.length; i++) {
                    promises.push(docs[i].ref.delete());
                }

                if (promises && promises.length) {
                    await Promise.all(promises);
                }
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

