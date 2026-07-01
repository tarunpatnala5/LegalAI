import requests
from datetime import datetime
from config import settings


class AIService:
    def __init__(self):
        # Support multiple providers: Groq (free), Gemini, or Together AI
        self.groq_key = settings.GROQ_API_KEY or ""
        self.gemini_key = settings.GEMINI_API_KEY or ""
        self.together_key = settings.TOGETHER_API_KEY or ""

        # Auto-detect which provider to use
        if self.groq_key:
            self.provider = "groq"
            self.api_key = self.groq_key
            self.base_url = "https://api.groq.com/openai/v1/chat/completions"
            self.model = "llama-3.3-70b-versatile"
        elif self.gemini_key:
            self.provider = "gemini"
            self.api_key = self.gemini_key
            self.model = "gemini-2.0-flash"
            self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        elif self.together_key:
            self.provider = "together"
            self.api_key = self.together_key
            self.base_url = "https://api.together.xyz/v1/chat/completions"
            self.model = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        else:
            self.provider = "none"
            self.api_key = ""
            self.base_url = ""
            self.model = ""

        print(f"[AI Service] Using provider: {self.provider} | Model: {self.model}")

    def _build_system_prompt(self):
        """Build the default legal AI system prompt."""
        return (
            f"You are an advanced Legal AI Assistant designed for Indian Law. "
            f"Current Date: {datetime.now().strftime('%Y-%m-%d')}\n\n"
            f"**Guidelines:**\n"
            f"1. **Conversation**: For casual greetings (e.g., 'Hi', 'Hello'), respond naturally and briefly "
            f"without legal jargon. Do not hallucinate legal scenarios unless asked.\n"
            f"2. **Legal Knowledge**: When discussing legal matters, you MUST be well-versed with "
            f"**Bharatiya Nyaya Sanhita (BNS)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS)**, and "
            f"**Bharatiya Sakshya Adhiniyam (BSA)**. ALWAYS provide references to both these new laws "
            f"AND the corresponding old IPC/CrPC/IEA sections for clarity.\n"
            f"3. **Scheduling**: ONLY if the user EXPLICITLY asks to 'schedule', 'add to calendar', or "
            f"'remind me' of an event:\n"
            f"   - Check if the requested date is in the past relative to the Current Date. If it is, "
            f"DO NOT schedule; instead, ask for a valid future date.\n"
            f"   - If the date is valid or ambiguous, ask for clarification.\n"
            f"   - ONLY if strict 'title', 'date' (future), and 'time' are present, output a JSON block "
            f"at the end of your response in this format:\n"
            f'```json\n'
            f'{{\n'
            f'  "action": "schedule",\n'
            f'  "title": "Event Title",\n'
            f'  "date": "YYYY-MM-DD",\n'
            f'  "time": "HH:MM"\n'
            f'}}\n'
            f'```\n'
            f"Do NOT output this JSON for general questions, past dates, or if information is missing."
        )

    def _call_openai_compatible(self, messages, max_tokens):
        """Call OpenAI-compatible APIs (Groq, Together AI)."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Ensure system prompt is present
        if messages and messages[0]['role'] != 'system':
            messages.insert(0, {"role": "system", "content": self._build_system_prompt()})

        # Clean and merge consecutive same-role messages
        cleaned = []
        last_role = None
        for msg in messages:
            content = msg.get('content', '').strip()
            role = msg['role']
            if not content:
                continue
            if len(content) > 12000:
                content = content[:12000] + "...[truncated]"
            if role == last_role and cleaned:
                cleaned[-1]['content'] += "\n\n" + content
            else:
                cleaned.append({"role": role, "content": content})
            last_role = role

        payload = {
            "model": self.model,
            "messages": cleaned,
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.7,
        }

        response = requests.post(self.base_url, json=payload, headers=headers)

        if response.status_code != 200:
            print(f"{self.provider.upper()} API Error Status: {response.status_code}")
            print(f"{self.provider.upper()} API Error Body: {response.text}")

        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']

    def _call_gemini(self, messages, max_tokens):
        """Call Google Gemini API."""
        system_prompt = None
        conversation = []

        for msg in messages:
            content = msg.get('content', '').strip()
            if not content:
                continue
            if len(content) > 12000:
                content = content[:12000] + "...[truncated]"
            if msg['role'] == 'system':
                system_prompt = content
            else:
                role = "model" if msg['role'] == 'assistant' else "user"
                conversation.append({"role": role, "parts": [{"text": content}]})

        if not system_prompt:
            system_prompt = self._build_system_prompt()

        # Merge consecutive same-role messages (Gemini requires alternating turns)
        merged = []
        for msg in conversation:
            if merged and merged[-1]['role'] == msg['role']:
                merged[-1]['parts'][0]['text'] += "\n\n" + msg['parts'][0]['text']
            else:
                merged.append(msg)

        if merged and merged[0]['role'] == 'model':
            merged.pop(0)
        if not merged:
            merged = [{"role": "user", "parts": [{"text": "Hello"}]}]

        payload = {
            "contents": merged,
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.7,
                "maxOutputTokens": max_tokens,
            }
        }

        response = requests.post(
            f"{self.base_url}?key={self.api_key}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code != 200:
            print(f"GEMINI API Error Status: {response.status_code}")
            print(f"GEMINI API Error Body: {response.text}")

        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text']

    def get_chat_response(self, messages, max_tokens=1024):
        """
        messages: list of dicts [{"role": "user"|"assistant"|"system", "content": "..."}]
        Auto-routes to the configured AI provider.
        """
        if self.provider == "none":
            return "No AI provider is configured. Please set GROQ_API_KEY, GEMINI_API_KEY, or TOGETHER_API_KEY in your .env file."

        try:
            if self.provider == "gemini":
                return self._call_gemini(messages, max_tokens)
            else:
                return self._call_openai_compatible(messages, max_tokens)
        except Exception as e:
            print(f"Error calling {self.provider.upper()} AI: {e}")
            return ("I'm sorry, I'm unable to process your request right now. "
                    "The AI service may be temporarily unavailable. Please try again in a moment.")

    def draft_legal_document(self, topic, details):
        prompt = (
            f"Draft a detailed legal document regarding '{topic}'.\n\n"
            f"Details:\n{details}\n\n"
            f"Format strictly as a professional {topic} under Indian Law."
        )
        messages = [{"role": "user", "content": prompt}]
        return self.get_chat_response(messages, max_tokens=2048)


ai_service = AIService()
