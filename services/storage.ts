import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
} from 'firebase/storage';
import { auth, db, storage } from './firebase';

export type Category = 'Tops' | 'Bottoms' | 'Shoes' | 'Outerwear' | 'Accessories';

export interface WardrobeItem {
    id: string;
    imageUri: string;
    category: Category;
    name?: string;
    label?: string;
    date: number;
    user_id?: string;
}

const WARDROBE_COLLECTION = 'wardrobe_items';
const HISTORY_COLLECTION = 'history';

// Helper to upload image to Firebase Storage
const uploadImage = async (uri: string): Promise<string> => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `${Date.now()}.jpg`;
        const storageRef = ref(storage, `wardrobe/${filename}`);

        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        return downloadUrl;
    } catch (error: any) {
        console.error('Upload Error:', error);
        throw new Error(error.message || 'Image upload process failed');
    }
};

// Helper to delete image from Firebase Storage
const deleteImage = async (downloadUrl: string) => {
    try {
        if (!downloadUrl) return;
        const storageRef = ref(storage, downloadUrl);
        await deleteObject(storageRef);
    } catch (e) {
        console.error('Error in deleteImage:', e);
    }
};

export const getWardrobe = async (): Promise<WardrobeItem[]> => {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, WARDROBE_COLLECTION),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                imageUri: data.image_uri,
                category: data.category as Category,
                name: data.name,
                date: data.created_at?.toMillis() || Date.now(),
                user_id: data.user_id
            };
        });

        // Sort on client side to avoid Firestore Index requirement
        return docs.sort((a, b) => b.date - a.date);
    } catch (e) {
        console.error('Failed to load wardrobe', e);
        return [];
    }
};

export const addToWardrobe = async (item: Omit<WardrobeItem, 'id' | 'date'>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        // 1. Upload Image
        const publicUrl = await uploadImage(item.imageUri);

        // 2. Insert into Firestore
        const docRef = await addDoc(collection(db, WARDROBE_COLLECTION), {
            user_id: user.uid,
            image_uri: publicUrl,
            category: item.category,
            name: item.name || '',
            created_at: serverTimestamp(),
        });

        return {
            id: docRef.id,
            imageUri: publicUrl,
            category: item.category,
            name: item.name,
            date: Date.now(),
            user_id: user.uid
        };
    } catch (e) {
        console.error('Failed to save item', e);
        throw e;
    }
};

export const updateWardrobeItem = async (id: string, updates: Partial<WardrobeItem>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        let imageUrl = updates.imageUri;

        // If image is being updated and it's a local URI, upload it
        if (updates.imageUri && !updates.imageUri.startsWith('http')) {
            const publicUrl = await uploadImage(updates.imageUri);
            imageUrl = publicUrl;

            // Optional: delete old image if needed, for now keeping it simple
        }

        const docRef = doc(db, WARDROBE_COLLECTION, id);
        const updateData: any = {
            category: updates.category,
            name: updates.name || '',
        };
        if (imageUrl) updateData.image_uri = imageUrl;

        await updateDoc(docRef, updateData);

        return {
            ...updates,
            id,
            imageUri: imageUrl || '',
            date: Date.now(),
            user_id: user.uid
        } as WardrobeItem;

    } catch (e) {
        console.error('Failed to update item', e);
        throw e;
    }
};

export const deleteFromWardrobe = async (id: string) => {
    try {
        // In a real app, delete the image from storage too
        await deleteDoc(doc(db, WARDROBE_COLLECTION, id));
    } catch (e) {
        console.error('Failed to delete item', e);
        throw e;
    }
};

// --- History & Persistence ---

export interface HistoryItem {
    id: string;
    type: 'analysis' | 'combination';
    data: any;
    score?: number;
    created_at: any;
}

export const saveHistory = async (type: 'analysis' | 'combination', data: any, score?: number) => {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, HISTORY_COLLECTION), {
            user_id: user.uid,
            type,
            data,
            score: score || null,
            created_at: serverTimestamp()
        });
    } catch (e) {
        console.error('Failed to save history', e);
    }
};

export const getHistory = async (type: 'analysis' | 'combination'): Promise<HistoryItem[]> => {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, HISTORY_COLLECTION),
            where('user_id', '==', user.uid),
            where('type', '==', type)
        );

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as HistoryItem));

        // Sort on client side to avoid Firestore Index requirement
        return docs.sort((a, b) => {
            const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
            const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
            return timeB - timeA;
        });
    } catch (e) {
        console.error('Failed to fetch history', e);
        return [];
    }
};

export const deleteHistory = async (id: string) => {
    try {
        await deleteDoc(doc(db, HISTORY_COLLECTION, id));
    } catch (e) {
        console.error('Failed to delete history item', e);
        throw e;
    }
};

