"""
Backend функция для управления подписками.
Покупка тарифа, проверка активности, получение информации.
"""
import json
import os
from datetime import datetime, timezone, timedelta

import psycopg2


def verify_jwt(token: str) -> dict:
    """Проверка JWT токена (упрощенная версия)"""
    import hashlib
    import hmac
    import base64
    
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
    API для управления подписками.
    Покупка тарифов, проверка доступа к девушкам.
    """
    method = event.get('httpMethod', 'GET')
    
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
    action = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        schema = os.environ['MAIN_DB_SCHEMA']
        
        # Получить активную подписку
        if action == 'get' and method == 'GET':
            cursor.execute(f"""
                SELECT id, plan_type, character_id, start_date, end_date, is_active
                FROM {schema}.subscriptions
                WHERE user_id = %s AND is_active = TRUE AND end_date > %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id, datetime.now(timezone.utc)))
            
            sub = cursor.fetchone()
            
            if not sub:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'subscription': None})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'subscription': {
                        'id': sub[0],
                        'plan_type': sub[1],
                        'character_id': sub[2],
                        'start_date': sub[3].isoformat(),
                        'end_date': sub[4].isoformat(),
                        'is_active': sub[5]
                    }
                })
            }
        
        # Покупка подписки
        if action == 'purchase' and method == 'POST':
            data = json.loads(event.get('body', '{}'))
            plan_type = data.get('plan_type')  # 'single' или 'all'
            character_id = data.get('character_id')  # Только для 'single'
            
            if plan_type not in ['single', 'all']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный тип тарифа'})
                }
            
            if plan_type == 'single' and not character_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Для тарифа "Одна девушка" нужно указать character_id'})
                }
            
            # Деактивировать старые подписки
            cursor.execute(f"""
                UPDATE {schema}.subscriptions
                SET is_active = FALSE
                WHERE user_id = %s AND is_active = TRUE
            """, (user_id,))
            
            # Создать новую подписку на 24 часа
            start_date = datetime.now(timezone.utc)
            end_date = start_date + timedelta(hours=24)
            
            cursor.execute(f"""
                INSERT INTO {schema}.subscriptions
                (user_id, plan_type, character_id, start_date, end_date, is_active)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING id
            """, (user_id, plan_type, character_id, start_date, end_date))
            
            sub_id = cursor.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'subscription': {
                        'id': sub_id,
                        'plan_type': plan_type,
                        'character_id': character_id,
                        'start_date': start_date.isoformat(),
                        'end_date': end_date.isoformat(),
                        'price': 990 if plan_type == 'single' else 1490
                    }
                })
            }
        
        # Проверка доступа к персонажу
        if action == 'check-access' and method == 'POST':
            data = json.loads(event.get('body', '{}'))
            character_id = data.get('character_id')
            
            if not character_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется character_id'})
                }
            
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
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'has_access': False, 'reason': 'no_subscription'})
                }
            
            plan_type, sub_character_id, end_date = sub
            
            # Проверка истечения
            if end_date <= datetime.now(timezone.utc):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'has_access': False, 'reason': 'expired'})
                }
            
            # Проверка доступа
            if plan_type == 'all':
                has_access = True
            elif plan_type == 'single':
                has_access = (sub_character_id == character_id)
            else:
                has_access = False
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'has_access': has_access,
                    'plan_type': plan_type,
                    'end_date': end_date.isoformat()
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
