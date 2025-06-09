
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

const CHAT_ROOM_ID = 'general_support_chat'; // Single chat room for V1
const MESSAGES_COLLECTION = `chats/${CHAT_ROOM_ID}/messages`;
const MESSAGE_LIMIT = 50; // Number of recent messages to load

export const sendMessage = async (
  text: string,
  senderName: string,
  senderRole: UserRole
): Promise<void> => {
  if (!text.trim()) return;

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
        messages.push({
          id: doc.id,
          text: data.text,
          senderName: data.senderName,
          senderRole: data.senderRole,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp), // Convert Firestore Timestamp to JS Date
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
