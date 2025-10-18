// Chat Widget with configurable parameters
// To use this widget, you need to configure it with an API key from your backend
// Example usage (matches admin_app.py format):
// <script>
//   window.chatWidgetConfig = {
//     apiKey: "your-api-key-here",
//     apiEndpoint: 'https://yourdomain.com/api/chat',
//     title: 'AI Assistant',
//     subtitle: 'Powered by Our Service',
//     primaryColor: '#4F46E5',
//     secondaryColor: '#F3F4F6',
//     welcomeMessage: `Hello! I'm your AI assistant. How can I help you today?`,
//     temperature: 0.3,
//     maxTokens: 800,
//     model: 'gemini-2.0-flash'
//   };
// </script>
// <script src="widget.js"></script>
(function(config) {
    // Default configuration
    const defaultConfig = {
      // API Configuration
      apiEndpoint: 'https://jackbot-widget-backend.onrender.com/api/chat/',
      apiKey: null, // Required API key for authentication
      model: 'gemini-2.5-flash', // AI model to use
  
      // UI Configuration
      title: 'AI Assistant',
      titleColor: '#FFFFFF', // Title text color
      subtitle: 'Powered by Our Service',
      logoUrl: null, // Optional logo URL
      primaryColor: '#4F46E5',
      secondaryColor: '#F3F4F6',
      position: { bottom: '40px', right: '100px' },
      
      // Chat Configuration
      welcomeMessage: "Hello! I'm your AI assistant. How can I help you today?",
      storageKey: 'chat_widget_history',
      maxMessages: 50,
      
      // AI Configuration (matches admin_app.py structure)
      temperature: 0.2,
      maxTokens: 1600, // Note: this matches admin_app.py's maxTokens field
      
      // External Libraries
      markedJsUrl: 'https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js',
      tailwindCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css',

      // Voice Input Configuration
      enableVoice: true,
      voiceAutoSend: true,
      voiceLanguage: (navigator.language || 'en-US'),
      voiceInterimResults: true
      ,
      // Text-To-Speech Configuration
      enableTts: true,
      ttsAutoSpeak: true,
      ttsRate: 1.0,
      ttsPitch: 1.0,
      ttsVolume: 1.0,
      ttsVoiceName: null // optional exact voice name match
    };
    
    // Merge provided config with defaults
    config = Object.assign({}, defaultConfig, config || {});
    
    // Add marked library and wait for it to load
    const markedScript = document.createElement('script');
    markedScript.src = config.markedJsUrl;
    markedScript.onload = () => {
      // Initialize marked options once loaded
      marked.setOptions({
        breaks: true, // Adds <br> on single line breaks
        gfm: true,    // GitHub Flavored Markdown
        sanitize: false // Allow HTML in the input
      });
    };
    document.head.appendChild(markedScript);
  
    document.head.insertAdjacentHTML('beforeend', `<link href="${config.tailwindCssUrl}" rel="stylesheet">`);
  
    // Inject the CSS
    const style = document.createElement('style');
    style.innerHTML = `
    .hidden {
      display: none;
    }
    #chat-widget-container {
      position: fixed;
      bottom: ${config.position.bottom || '40px'};
      right: ${config.position.right || '100px'};
      flex-direction: column;
    }
    #chat-popup {
      height: 70vh;
      max-height: 70vh;
      transition: all 0.3s;
      overflow: hidden;
    }
    .loading-spinner {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      margin-left: 12px;
    }
    .loading-spinner .dots {
      display: flex;
      gap: 4px;
    }
    .loading-spinner .dot {
      width: 8px;
      height: 8px;
      background-color: #4B5563;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }
    .loading-spinner .dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-spinner .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    /* Markdown Styles */
    .markdown-content {
      line-height: 1.5;
    }
    .markdown-content p {
      margin-bottom: 0.5rem;
    }
    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .markdown-content ul, .markdown-content ol {
      margin-left: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .markdown-content ul {
      list-style-type: disc;
    }
    .markdown-content ol {
      list-style-type: decimal;
    }
    .markdown-content code {
      background-color: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.9em;
    }
    .markdown-content pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 0.5rem 0;
    }
    .markdown-content pre code {
      background-color: transparent;
      padding: 0;
    }
    .markdown-content a {
      color: #3b82f6;
      text-decoration: underline;
    }
    .markdown-content blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 1rem;
      margin: 0.5rem 0;
      color: #4b5563;
    }
    .tts-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.25rem 0.5rem;
      background-color: #ffffff;
      color: #374151;
      cursor: pointer;
    }
    .tts-button:hover { background-color: #f9fafb; }
    .tts-button.playing { background-color: #dbeafe; border-color: #60a5fa; color: #1e40af; }
    /* Citation Styles */
    .citation-list {
      margin-top: 1rem;
      font-size: 0.8rem;
      border-top: 1px solid #e5e7eb;
      padding-top: 0.5rem;
    }
    .citation-list a {
      display: block;
      color: #3b82f6;
      text-decoration: underline;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .error-message {
      background-color: #fee2e2;
      color: #b91c1c;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    @media (max-width: 768px) {
      #chat-popup {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
    /* Microphone button */
    .mic-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      background-color: #ffffff;
      color: #374151;
      cursor: pointer;
    }
    .mic-button:hover {
      background-color: #f9fafb;
    }
    .mic-button.recording {
      background-color: #fee2e2;
      border-color: #ef4444;
      color: #991b1b;
      animation: mic-pulse 1.2s infinite;
    }
    @keyframes mic-pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    /* Sign language button */
    .sign-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      background-color: #ffffff;
      color: #374151;
      cursor: pointer;
    }
    .sign-button:hover {
      background-color: #f9fafb;
    }
    `;
  
    document.head.appendChild(style);
  
    // Add chat history management functions
    const chatHistory = {
      storageKey: config.storageKey,
      maxMessages: config.maxMessages,
      welcomeMessage: config.welcomeMessage,
  
      initialize: function() {
        // Only initialize if there's no history
        if (this.load().length === 0) {
          this.save(this.welcomeMessage, false);
        }
      },
  
      save: function(message, isUser = false, citations = []) {
        try {
          let history = this.load();
          const newMessage = {
            message: message,
            isUser: isUser,
            timestamp: new Date().toISOString(),
            order: history.length, // Add order index
            citations: citations || [] // Store citations if available
          };
  
          // Ensure alternating pattern
          if (history.length > 0) {
            const lastMessage = history[history.length - 1];
            if (lastMessage.isUser === isUser) {
              console.warn('Attempting to save message with same sender twice in a row');
              return;
            }
          }
  
          history.push(newMessage);
  
          // Keep only the last maxMessages
          if (history.length > this.maxMessages) {
            history = history.slice(history.length - this.maxMessages);
            // Reorder remaining messages
            history = history.map((msg, index) => ({
              ...msg,
              order: index
            }));
          }
  
          localStorage.setItem(this.storageKey, JSON.stringify(history));
          console.log('Saved message to history:', newMessage);
          console.log('Current history:', history);
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      },
  
      load: function() {
        try {
          const history = localStorage.getItem(this.storageKey);
          let parsedHistory = history ? JSON.parse(history) : [];
          
          // Sort by order and ensure each message has an order property
          parsedHistory = parsedHistory
            .map((msg, index) => ({
              ...msg,
              order: msg.order ?? index,
              citations: msg.citations || []
            }))
            .sort((a, b) => a.order - b.order);
  
          console.log('Loaded chat history:', parsedHistory);
          return parsedHistory;
        } catch (error) {
          console.error('Error loading chat history:', error);
          return [];
        }
      },
  
      clear: function() {
        try {
          localStorage.removeItem(this.storageKey);
          console.log('Chat history cleared');
          // Reinitialize with welcome message after clearing
          this.initialize();
          return true;
        } catch (error) {
          console.error('Error clearing chat history:', error);
          return false;
        }
      }
    };
  
    // Create chat widget container
    const chatWidgetContainer = document.createElement('div');
    chatWidgetContainer.id = 'chat-widget-container';
    document.body.appendChild(chatWidgetContainer);
    
    // Prepare logo HTML if provided
    const logoHtml = config.logoUrl ? 
      `<img src="${config.logoUrl}" alt="Logo" class="h-6 mr-2">` : 
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>`;
    
    // Inject the HTML
    chatWidgetContainer.innerHTML = `
      <div id="chat-bubble" class="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer text-3xl" 
           style="background-color: ${config.primaryColor}">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div id="chat-popup" class="hidden absolute bottom-20 right-0 w-96 bg-white rounded-md shadow-md flex flex-col transition-all text-sm">
        <div id="chat-header" class="flex justify-between items-center p-4 rounded-t-md" 
             style="background-color: ${config.primaryColor}">
          <h3 class="m-0 text-lg flex items-center" style="color: ${config.titleColor}">${logoHtml}${config.title}</h3>
          <div class="flex items-center">
            <button id="clear-history" class="bg-transparent border-none cursor-pointer mx-2" title="Clear Chat History" style="color: ${config.titleColor}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button id="close-popup" class="bg-transparent border-none cursor-pointer" style="color: ${config.titleColor}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div id="chat-messages" class="flex-1 p-4 overflow-y-auto"></div>
        <div id="chat-input-container" class="p-4 border-t border-gray-200">
          <div class="flex space-x-2 items-center">
            <input type="text" id="chat-input" class="flex-1 border border-gray-300 rounded-md px-4 py-2 outline-none w-3/4" placeholder="Type your message...">
            <button id="chat-mic" class="mic-button" title="Voice input" aria-label="Voice input" style="display:none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"/>
                <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0011 5.292V20h-2a1 1 0 100 2h6a1 1 0 100-2h-2v-3.708A7 7 0 0019 11z"/>
              </svg>
            </button>
            <button id="chat-sign" class="sign-button" title="Sign language" aria-label="Sign language">ASL</button>
            <button id="chat-submit" class="text-white rounded-md px-4 py-2 cursor-pointer" 
                    style="background-color: ${config.primaryColor}">Send</button>
          </div>
          <div class="flex text-center text-xs pt-4">
            <span class="flex-1">${config.subtitle}</span>
          </div>
        </div>
      </div>
    `;
  
    // Initialize elements after DOM is ready
    const chatInput = document.getElementById('chat-input');
    const chatSubmit = document.getElementById('chat-submit');
    const chatMessages = document.getElementById('chat-messages');
    const chatBubble = document.getElementById('chat-bubble');
    const chatPopup = document.getElementById('chat-popup');
    const closePopup = document.getElementById('close-popup');
    const clearHistoryBtn = document.getElementById('clear-history');
    const chatMic = document.getElementById('chat-mic');
    const chatSign = document.getElementById('chat-sign');

    // Voice recognition runtime state
    let recognition = null;
    let isRecording = false;
    let interimTranscript = '';
  
    // Initialize chat history with welcome message if needed
    chatHistory.initialize();
  
    // Load chat history immediately
    loadChatHistory();
  
    // Add event listeners
    chatSubmit.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (!message) return;
      onUserRequest(message);
    });
  
    chatInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        chatSubmit.click();
      }
    });
  
    chatBubble.addEventListener('click', togglePopup);
    closePopup.addEventListener('click', togglePopup);
    
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the chat history?')) {
        if (chatHistory.clear()) {
          chatMessages.innerHTML = '';
          loadChatHistory(); // Reload history with welcome message
        }
      }
    });
    
    if (chatSign) {
      chatSign.addEventListener('click', () => {
        alert('Sign language mode is coming soon.');
      });
    }
  
    function togglePopup() {
      chatPopup.classList.toggle('hidden');
      if (!chatPopup.classList.contains('hidden')) {
        chatInput.focus();
      }
    }

    // Setup voice input if supported and enabled
    (function setupVoice() {
      try {
        if (!config.enableVoice) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          // No support; quietly do nothing; could show tooltip later
          return;
        }
        recognition = new SpeechRecognition();
        recognition.lang = config.voiceLanguage || 'en-US';
        recognition.interimResults = !!config.voiceInterimResults;
        recognition.continuous = false;

        if (chatMic) {
          chatMic.style.display = 'inline-flex';
          chatMic.addEventListener('click', () => {
            if (isRecording) {
              try { recognition.stop(); } catch (e) {}
              return;
            }
            startRecording();
          });
        }

        recognition.onstart = () => {
          isRecording = true;
          if (chatMic) chatMic.classList.add('recording');
          interimTranscript = '';
        };

        recognition.onerror = (event) => {
          isRecording = false;
          if (chatMic) chatMic.classList.remove('recording');
          if (event && event.error) {
            console.warn('Voice recognition error:', event.error);
          }
        };

        recognition.onend = () => {
          isRecording = false;
          if (chatMic) chatMic.classList.remove('recording');
          // If there is content, either send or leave in input
          const text = chatInput.value.trim();
          if (text && config.voiceAutoSend) {
            onUserRequest(text);
          }
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          const combined = [chatInput.value, finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
          chatInput.value = combined;
        };

        function startRecording() {
          try {
            interimTranscript = '';
            recognition.start();
          } catch (e) {
            // start can throw if already started; attempt to stop and restart
            try { recognition.stop(); } catch (e2) {}
            setTimeout(() => {
              try { recognition.start(); } catch (e3) { console.warn('Failed to start recognition', e3); }
            }, 150);
          }
        }
      } catch (err) {
        console.warn('Voice setup failed', err);
      }
    })();
  
    // Also load chat history on window load for safety
    window.addEventListener('load', () => {
      if (chatMessages.children.length === 0) {
        loadChatHistory();
        console.log('Chat history loaded on window load');
      }
    });
  
    function onUserRequest(message) {
      // Check if API key is configured
      if (!config.apiKey) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'API key is not configured. Please contact support.';
        chatMessages.appendChild(errorDiv);
        return;
      }

      // Save user message to history
      chatHistory.save(message, true);
      
      // Display user message immediately
      const messageElement = document.createElement('div');
      messageElement.className = 'flex justify-end mb-3';
      messageElement.innerHTML = `
        <div style="background-color: ${config.primaryColor}" class="text-white rounded-lg py-2 px-4 max-w-[70%]">
          ${message}
        </div>
      `;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Clear input field
      chatInput.value = '';
      
      // Show loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-spinner';
      loadingDiv.innerHTML = '<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
      chatMessages.appendChild(loadingDiv);
      
      // Make API request with proper headers and format for app.py
      fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        },
        body: JSON.stringify({
          // Send the entire chat history in the 'messages' field
          // as expected by the backend.
          messages: chatHistory.load().map(item => ({
              role: item.isUser ? 'user' : 'model', // CRITICAL FIX: 'assistant' changed to 'model'
              content: item.message
          }))
        })
      })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key');
          } else if (response.status === 403) {
            throw new Error('API key not authorized or chatbot not active');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        return response.json();
      })
      .then(data => {
        // Remove loading spinner
        loadingDiv.remove();
        
        // Process and display the response
        const response = data.response || 'No response received';
        const citations = data.citations || [];
        
        // Save assistant response to history
        chatHistory.save(response, false, citations);
        
        // Display the response
        reply(response, citations);
      })
      .catch(error => {
        console.error('Error:', error);
        loadingDiv.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = error.message || 'Sorry, there was an error processing your request. Please try again.';
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
    
    function reply(message, citations) {
      const chatMessages = document.getElementById('chat-messages');
      const replyElement = document.createElement('div');
      replyElement.className = 'flex mb-3';
      
      // Wait for marked to be loaded
      if (typeof marked === 'undefined') {
        const checkMarked = setInterval(() => {
          if (typeof marked !== 'undefined') {
            clearInterval(checkMarked);
            renderMessage();
          }
        }, 100);
      } else {
        renderMessage();
      }
  
      function renderMessage() {
        try {
          // Use marked.parse() instead of direct marked() call
          const htmlContent = marked.parse(message);
          
          const container = document.createElement('div');
          container.style.backgroundColor = config.secondaryColor;
          container.className = 'text-black rounded-lg py-2 px-4 max-w-[70%] flex items-start';

          const contentDiv = document.createElement('div');
          contentDiv.className = 'markdown-content flex-1';
          contentDiv.innerHTML = htmlContent;

          const ttsBtn = createTtsButton(message);

          container.appendChild(contentDiv);
          if (ttsBtn) container.appendChild(ttsBtn);

          replyElement.appendChild(container);
          chatMessages.appendChild(replyElement);
          chatMessages.scrollTop = chatMessages.scrollHeight;

          // Auto-speak if enabled
          if (config.enableTts && config.ttsAutoSpeak) {
            speakText(message);
          }
        } catch (error) {
          console.error('Markdown parsing error:', error);
          // Fallback to plain text if markdown parsing fails
          const container = document.createElement('div');
          container.style.backgroundColor = config.secondaryColor;
          container.className = 'text-black rounded-lg py-2 px-4 max-w-[70%] flex items-start';
          const contentDiv = document.createElement('div');
          contentDiv.className = 'markdown-content flex-1';
          contentDiv.textContent = message;
          const ttsBtn = createTtsButton(message);
          container.appendChild(contentDiv);
          if (ttsBtn) container.appendChild(ttsBtn);
          replyElement.appendChild(container);
          chatMessages.appendChild(replyElement);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
    }

    // TTS Helpers
    let ttsVoices = [];
    function loadVoices() {
      try {
        ttsVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : [];
      } catch (_) { ttsVoices = []; }
    }
    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    function pickVoice() {
      if (!window.speechSynthesis) return null;
      if (config.ttsVoiceName) {
        const match = ttsVoices.find(v => v.name === config.ttsVoiceName);
        if (match) return match;
      }
      // Prefer a voice matching language
      const lang = (config.voiceLanguage || navigator.language || 'en-US').toLowerCase();
      const byLang = ttsVoices.find(v => (v.lang || '').toLowerCase().startsWith(lang.split('-')[0]));
      return byLang || ttsVoices[0] || null;
    }

    function speakText(text) {
      try {
        if (!config.enableTts || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) utter.voice = voice;
        utter.rate = Number(config.ttsRate || 1.0);
        utter.pitch = Number(config.ttsPitch || 1.0);
        utter.volume = Number(config.ttsVolume || 1.0);
        window.speechSynthesis.speak(utter);
      } catch (e) { console.warn('TTS speak failed', e); }
    }

    function stopSpeaking() {
      try {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    function createTtsButton(text) {
      if (!config.enableTts || !window.speechSynthesis) return null;
      const btn = document.createElement('button');
      btn.className = 'tts-button';
      btn.title = 'Play response';
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4a1 1 0 001.555.832L9 12.8V11.2L4.555 9.168A1 1 0 003 10z"/><path d="M14 7.05a7 7 0 010 9.9l1.414 1.414a9 9 0 000-12.728L14 7.05z"/><path d="M11 4a11 11 0 010 16l1.414 1.414a13 13 0 000-18.828L11 4z"/></svg>`;
      btn.addEventListener('click', () => {
        const isPlaying = btn.classList.contains('playing');
        if (isPlaying) {
          stopSpeaking();
          btn.classList.remove('playing');
          btn.title = 'Play response';
        } else {
          stopSpeaking();
          speakText(text);
          btn.classList.add('playing');
          btn.title = 'Stop';
          // Try to detect end and reset button style
          const interval = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              btn.classList.remove('playing');
              btn.title = 'Play response';
              clearInterval(interval);
            }
          }, 300);
        }
      });
      return btn;
    }
  
    // Function to load and display chat history
    function loadChatHistory() {
      let history = chatHistory.load();
      chatMessages.innerHTML = ''; // Clear existing messages
      
      if (history.length === 0) {
        // Initialize with welcome message if history is empty
        chatHistory.initialize();
        history = chatHistory.load();
      }
  
      // Sort history by order
      const sortedHistory = history.sort((a, b) => a.order - b.order);
  
      // Display messages sequentially
      function displayMessages(index) {
        if (index >= sortedHistory.length) return;
  
        const item = sortedHistory[index];
        
        if (item.isUser) {
          const messageElement = document.createElement('div');
          messageElement.className = 'flex justify-end mb-3';
          messageElement.innerHTML = `
            <div style="background-color: ${config.primaryColor}" class="text-white rounded-lg py-2 px-4 max-w-[70%]">
              ${item.message}
            </div>
          `;
          chatMessages.appendChild(messageElement);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          // Move to next message after a short delay
          setTimeout(() => displayMessages(index + 1), 100);
        } else {
          const replyElement = document.createElement('div');
          replyElement.className = 'flex mb-3';
          
          try {
            const htmlContent = marked ? marked.parse(item.message) : item.message;
            replyElement.innerHTML = `
              <div style="background-color: ${config.secondaryColor}" class="text-black rounded-lg py-2 px-4 max-w-[70%]">
                <div class="markdown-content">${htmlContent}</div>
              </div>
            `;
          } catch (error) {
            replyElement.innerHTML = `
              <div style="background-color: ${config.secondaryColor}" class="text-black rounded-lg py-2 px-4 max-w-[70%]">
                <div class="markdown-content">${item.message}</div>
              </div>
            `;
          }
          chatMessages.appendChild(replyElement);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          // Move to next message after a short delay
          setTimeout(() => displayMessages(index + 1), 100);
        }
      }
  
      // Start displaying messages
      displayMessages(0);
    }
  })(window.chatWidgetConfig || {});
  
