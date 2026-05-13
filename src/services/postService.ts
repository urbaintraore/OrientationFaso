import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EstablishmentPost } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase';

const COLLECTION_NAME = 'establishment_posts';

export const postService = {
  async getAllPosts(limitCount = 20) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EstablishmentPost[];
    } catch (error) {
      console.error("Error fetching all posts:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async getPostsByEstablishment(establishmentId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('establishmentId', '==', establishmentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EstablishmentPost[];
    } catch (error) {
      console.error("Error fetching establishment posts:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async addPost(post: Omit<EstablishmentPost, 'id' | 'likesCount' | 'commentsCount' | 'sharesCount'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...post,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async likePost(postId: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async deletePost(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  }
};
