"use client";

import { useState } from "react";

// Cognito のサインページの Amplify UI コンポーネント
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'
import { fetchAuthSession } from 'aws-amplify/auth';

// Congito サインインページ日本語化
import { I18n } from "aws-amplify/utils";
import { PT_BR } from "@/translations/pt-br/ja";
I18n.putVocabularies(PT_BR);
I18n.setLanguage('ja');

// Cognito のプール ID やクライアント ID を設定
import awsExports from '@/utils/aws-exports';
Amplify.configure(awsExports);


type Message = {
  id: number;
  text: string;
  isUser: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [token, setToken] = useState("")

  // 認証トークンの取得
  const getAuthToken =  () => {
        const fetchToken = async () => {
          const id_token: string = (await fetchAuthSession()).tokens?.idToken?.toString() || ""
          setToken(id_token)
        }
        fetchToken()
        return ""
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    
    const history = messages.length === 0 
      ? "（初回なので会話履歴なし）"
      : messages.map(msg => `${msg.isUser ? 'ユーザー' : 'システム'}: ${msg.text}`).join('\n');
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: currentInput,
          history: history
        })
      });
      const data = await response.json();
      
      const systemMessage: Message = {
        id: Date.now() + 1,
        text: data.output_text,
        isUser: false,
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "エラーが発生しました",
        isUser: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Authenticator loginMechanisms={['email']}>
    {({ signOut, user }) => (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Next Simple Chat</h1>
        <div style={{ textAlign: 'right' }}>
          <p>ユーザー ID :{user?.signInDetails?.loginId}</p>
          <div className="flex gap-2">
            <button onClick={clearMessages} className="clear-button">クリア</button>
            <button onClick={signOut} className="signout-button">サインアウト</button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-md px-4 py-2 rounded-lg break-words ${
                message.isUser
                  ? "bg-yellow-200 text-black"
                  : "bg-green-200 text-black"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            送信
          </button>
        </div>
      </div>
    </div>
    )}
    </Authenticator>
  );
}
