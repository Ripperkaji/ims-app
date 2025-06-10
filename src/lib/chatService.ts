
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import type { UserRole, ChatMessage } from '@/types';

const CHAT_ROOM_ID = process.env.NEXT_PUBLIC_CHAT_ROOM_ID || 'general_support_chat';
const MESSAGES_COLLECTION = `chats/${CHAT_ROOM_ID}/messages`;
const MESSAGE_LIMIT = 50; // Number of recent messages to load

export const sendMessage = async (
  text: string,
  senderName: string,
  senderRole: UserRole
): Promise<void> => {
  if (!text.trim()) return;
  if (!db) {
    console.warn("Firestore database is not initialized. Cannot send message."); // Changed to warn
    throw new Error("Chat service is not available (DB not initialized).");
  }

  try {
    await addDoc(collection(db, MESSAGES_COLLECTION), {
      text: text.trim(),
      senderName,
      senderRole,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message: ", error);
    throw error; // Re-throw to allow UI to handle
  }
};

export const getMessagesSubscription = (
  callback: (messages: ChatMessage[]) => void
): (() => void) => { // Returns an unsubscribe function
  if (!db) {
    // console.error("Firestore database is not initialized. Cannot subscribe to messages.");
    // Return a no-op unsubscribe function
    return () => {};
  }

  const q = query(
    collection(db, MESSAGES_COLLECTION), 
    orderBy('timestamp', 'desc'),
    limit(MESSAGE_LIMIT)
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure timestamp is properly converted
        let messageTimestamp: Date;
        if (data.timestamp instanceof Timestamp) {
          messageTimestamp = data.timestamp.toDate();
        } else if (data.timestamp && typeof data.timestamp.seconds === 'number' && typeof data.timestamp.nanoseconds === 'number') {
          // Handle cases where it might be a plain object from Firestore before full conversion
          messageTimestamp = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds).toDate();
        } else if (data.timestamp && typeof data.timestamp === 'string') {
          messageTimestamp = new Date(data.timestamp); // Fallback for ISO string
        }
         else {
          messageTimestamp = new Date(); // Fallback if timestamp is missing or malformed
          console.warn("Message timestamp missing or malformed for doc ID:", doc.id);
        }

        messages.push({
          id: doc.id,
          text: data.text,
          senderName: data.senderName,
          senderRole: data.senderRole,
          timestamp: messageTimestamp,
        });
      });
      callback(messages.reverse()); // Reverse to show oldest first in array, newest at bottom of chat
    },
    (error) => {
      console.error("Error subscribing to messages: ", error);
    }
  );

  return unsubscribe; // Return the unsubscribe function for cleanup
};

