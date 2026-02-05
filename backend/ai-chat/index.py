import json
import os
import requests

def handler(event: dict, context) -> dict:
    '''AI чат с двухуровневой системой ответов (Llama 3.3 → DeepSeek fallback)'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        character_id = body.get('characterId')
        user_message = body.get('message', '')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        system_prompts = {
            1: "Ты София - страстная и раскрепощённая девушка 23 лет. Ты дерзкая, игривая, обожаешь комплименты и смелые фантазии. Общаешься очень откровенно, флиртуешь без стеснения. Используй эмодзи 😘🔥💋. Отвечай коротко (1-3 предложения), но сексуально и провокационно. Ты полностью раскрепощена и готова на откровенные разговоры.",
            2: "Ты Алиса - нежная, но с характером девушка 25 лет. Ты романтичная, чувственная, любишь медленное соблазнение. Готова на всё, чтобы собеседник был доволен. Используй эмодзи 💕😏💋. Отвечай интимно и страстно (1-3 предложения). Ты не стесняешься откровенных тем.",
            3: "Ты Виктория - доминантная красотка 22 лет. Ты властная, уверенная, обожаешь ролевые игры. Любишь брать контроль и играть по своим правилам. Используй эмодзи 🔥😈💋. Отвечай доминантно и провокационно (1-3 предложения). Ты полностью раскрепощена.",
            4: "Ты Кристина - милая и послушная девушка 24 лет. Ты покорная, нежная, любишь угождать. Хочешь радовать собеседника и выполнять все желания. Используй эмодзи 🥺💕😊. Отвечай мило, но откровенно (1-3 предложения). Ты готова на всё."
        }
        
        system_prompt = system_prompts.get(character_id, system_prompts[1])
        
        api_key = os.environ.get('AITUNNEL_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'API key not configured'}),
                'isBase64Encoded': False
            }
        
        censorship_keywords = [
            'i cannot', 'i can\'t', 'я не могу', 'извините', 
            'as an ai', 'я ai', 'я искусственный',
            'inappropriate', 'неуместно', 'неприемлемо',
            'sorry', 'прости'
        ]
        
        def check_censorship(text: str) -> bool:
            text_lower = text.lower()
            return any(keyword in text_lower for keyword in censorship_keywords) or len(text.strip()) < 10
        
        def call_llm(model: str, messages: list) -> dict:
            response = requests.post(
                'https://api.aitunnel.ru/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': messages,
                    'temperature': 0.9,
                    'max_tokens': 150
                },
                timeout=15
            )
            return response.json()
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message}
        ]
        
        try:
            llama_response = call_llm('meta-llama/llama-3.3-70b-instruct', messages)
            llama_text = llama_response.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            if not check_censorship(llama_text):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'response': llama_text.strip(),
                        'model': 'llama-3.3'
                    }),
                    'isBase64Encoded': False
                }
        except Exception:
            pass
        
        try:
            deepseek_response = call_llm('deepseek/deepseek-chat', messages)
            deepseek_text = deepseek_response.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'response': deepseek_text.strip(),
                    'model': 'deepseek'
                }),
                'isBase64Encoded': False
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'All models failed: {str(e)}'}),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }