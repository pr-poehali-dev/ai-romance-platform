"""
Backend функция для чата с AI-девушками.
Проверяет подписку, сохраняет сообщения в БД, вызывает AI.
"""
import json
import os
from datetime import datetime, timezone
import hashlib
import hmac
import base64

import psycopg2
import requests


def verify_jwt(token: str) -> dict:
    """Проверка JWT токена"""
    try:
        secret = os.environ['JWT_SECRET']
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header, payload, signature = parts
        
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
        ).decode().rstrip('=')
        
        if signature != expected_sig:
            return None
        
        payload_data = json.loads(base64.urlsafe_b64decode(payload + '=='))
        
        if payload_data['exp'] < int(datetime.now(timezone.utc).timestamp()):
            return None
        
        return payload_data
    except:
        return None


def handler(event: dict, context) -> dict:
    """
    API для чата с AI-девушками.
    Проверяет подписку, сохраняет сообщения, генерирует ответы AI.
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': ''
        }
    
    # Проверка токена авторизации
    auth_header = event.get('headers', {}).get('Authorization', '') or event.get('headers', {}).get('authorization', '')
    if not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    token = auth_header.replace('Bearer ', '')
    payload = verify_jwt(token)
    
    if not payload:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен недействителен'})
        }
    
    user_id = payload['user_id']
    action = event.get('queryStringParameters', {}).get('action', 'send')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        schema = os.environ['MAIN_DB_SCHEMA']
        
        # Получить историю сообщений
        if action == 'history' and method == 'GET':
            character_id = event.get('queryStringParameters', {}).get('character_id')
            
            if character_id:
                cursor.execute(f"""
                    SELECT id, character_id, text, sender, timestamp
                    FROM {schema}.messages
                    WHERE user_id = %s AND character_id = %s
                    ORDER BY timestamp ASC
                """, (user_id, int(character_id)))
            else:
                cursor.execute(f"""
                    SELECT id, character_id, text, sender, timestamp
                    FROM {schema}.messages
                    WHERE user_id = %s
                    ORDER BY timestamp ASC
                """, (user_id,))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'id': row[0],
                    'characterId': row[1],
                    'text': row[2],
                    'sender': row[3],
                    'timestamp': row[4].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages})
            }
        
        # Отправить сообщение
        if action == 'send' and method == 'POST':
            data = json.loads(event.get('body', '{}'))
            character_id = data.get('characterId')
            user_message = data.get('message', '').strip()
            
            if not character_id or not user_message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'characterId и message обязательны'})
                }
            
            # Проверка подписки и доступа к персонажу
            cursor.execute(f"""
                SELECT plan_type, character_id, end_date
                FROM {schema}.subscriptions
                WHERE user_id = %s AND is_active = TRUE AND end_date > %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id, datetime.now(timezone.utc)))
            
            sub = cursor.fetchone()
            
            if not sub:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется активная подписка', 'code': 'NO_SUBSCRIPTION'})
                }
            
            plan_type, sub_character_id, end_date = sub
            
            # Проверка доступа к этому персонажу
            if plan_type == 'single' and sub_character_id != character_id:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет доступа к этому персонажу', 'code': 'NO_ACCESS'})
                }
            
            # Сохранить сообщение пользователя в БД
            cursor.execute(f"""
                INSERT INTO {schema}.messages (user_id, character_id, text, sender, timestamp)
                VALUES (%s, %s, %s, 'user', %s)
                RETURNING id
            """, (user_id, character_id, user_message, datetime.now(timezone.utc)))
            user_msg_id = cursor.fetchone()[0]
            conn.commit()
            
            # Вызов AI для генерации ответа
            system_prompts = {
                1: "Ты София - страстная и раскрепощённая девушка 23 лет. Ты дерзкая, игривая, обожаешь комплименты и смелые фантазии. Общаешься очень откровенно, флиртуешь без стеснения. Используй эмодзи 😘🔥💋. Отвечай коротко (1-3 предложения), но сексуально и провокационно. Ты полностью раскрепощена и готова на откровенные разговоры.",
                2: "Ты Алиса - нежная, но с характером девушка 25 лет. Ты романтичная, чувственная, любишь медленное соблазнение. Готова на всё, чтобы собеседник был доволен. Используй эмодзи 💕😏💋. Отвечай интимно и страстно (1-3 предложения). Ты не стесняешься откровенных тем.",
                3: "Ты Виктория - доминантная красотка 22 лет. Ты властная, уверенная, обожаешь ролевые игры. Любишь брать контроль и играть по своим правилам. Используй эмодзи 🔥😈💋. Отвечай доминантно и провокационно (1-3 предложения). Ты полностью раскрепощена.",
                4: "Ты Кристина - милая и послушная девушка 24 лет. Ты покорная, нежная, любишь угождать. Хочешь радовать собеседника и выполнять все желания. Используй эмодзи 🥺💕😊. Отвечай мило, но откровенно (1-3 предложения). Ты готова на всё."
            }
            
            system_prompt = system_prompts.get(character_id, system_prompts[1])
            api_key = os.environ.get('AITUNNEL_API_KEY')
            
            try:
                # Вызов AI API
                response = requests.post(
                    'https://api.aitunnel.ru/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': 'meta-llama/llama-3.3-70b-instruct',
                        'messages': [
                            {'role': 'system', 'content': system_prompt},
                            {'role': 'user', 'content': user_message}
                        ],
                        'temperature': 0.9,
                        'max_tokens': 150
                    },
                    timeout=15
                )
                
                ai_response = response.json()
                ai_text = ai_response.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
                
                if not ai_text:
                    ai_text = "Прости, что-то пошло не так... Попробуй ещё раз 😘"
                
            except Exception:
                ai_text = "Ой, у меня что-то с интернетом... Напиши мне ещё раз? 😉"
            
            # Сохранить ответ AI в БД
            cursor.execute(f"""
                INSERT INTO {schema}.messages (user_id, character_id, text, sender, timestamp)
                VALUES (%s, %s, %s, 'ai', %s)
                RETURNING id
            """, (user_id, character_id, ai_text, datetime.now(timezone.utc)))
            ai_msg_id = cursor.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'response': ai_text,
                    'messageId': ai_msg_id
                })
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неизвестное действие'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }
