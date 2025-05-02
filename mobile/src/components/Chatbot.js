import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = 'your-api-key';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      _id: Date.now().toString(),
      text: inputText,
      createdAt: new Date(),
      user: { _id: 1, name: 'User' },
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInputText('');
    setIsLoading(true);

    flatListRef.current?.scrollToIndex({ index: 0, animated: true });

    try {
      const response = await axios.post(
        `${API_URL}?key=${API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Bạn là chatbot hỗ trợ khách hàng cho ứng dụng quản lý chuyến bay. Trả lời bằng tiếng Việt, ngắn gọn và hữu ích. Câu hỏi: ${userMessage.text}`,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const botMessage = {
        _id: Date.now().toString() + '-bot',
        text: response.data.candidates[0].content.parts[0].text.trim(),
        createdAt: new Date(),
        user: { _id: 2, name: 'Chatbot' },
      };

      setMessages((prev) => [botMessage, ...prev]);
    } catch (error) {

      let errorText = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!';
      if (error.code === 'ECONNABORTED') {
        errorText = 'Hết thời gian chờ, vui lòng thử lại!';
      } else if (error.response?.status === 401) {
        errorText = 'API Key không hợp lệ!';
      } else if (error.response?.status === 429) {
        errorText = 'Quá nhiều yêu cầu, vui lòng thử lại sau!';
      } else if (error.response?.status === 400) {
        errorText = 'Yêu cầu không hợp lệ, vui lòng kiểm tra lại!';
      }

      const errorMessage = {
        _id: Date.now().toString() + '-error',
        text: errorText,
        createdAt: new Date(),
        user: { _id: 2, name: 'Chatbot' },
      };
      setMessages((prev) => [errorMessage, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.user._id === 1;

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Animated.View>
    );
  };

  return (
    <>
      {!isVisible && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setIsVisible(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#6B7280', '#374151']}
            style={styles.chatButtonGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={35} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {isVisible && (
        <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Trợ Lý Hàng Không</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContent}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              inverted
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang xử lý...</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Hỏi về chuyến bay..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1E3A8A']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="paper-plane" size={28} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
chatButton: {
  position: 'absolute',
  bottom: 90, 
  right: 10,
  borderRadius: 40, 
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
},
chatButtonGradient: {
  padding: 12, 
  borderRadius: 40, 
  justifyContent: 'center',
  alignItems: 'center',
  
},
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesList: {
    padding: 20,
    paddingBottom: 30,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 8,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 6,
    fontWeight: '300',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 20,
    marginLeft: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    fontSize: 16,
    marginRight: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sendButtonGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Chatbot;