"""
Backend функция для авторизации пользователей по email и паролю.
Регистрация, вход, проверка токена.
"""
import json
import os
import hashlib
import hmac
import base64
from datetime import datetime, timezone, timedelta

import psycopg2


def create_jwt(user_id: int, email: str) -> str:
    """Создание JWT токена"""
    secret = os.environ['JWT_SECRET']
    
    header = base64.urlsafe_b64encode(json.dumps({
        "alg": "HS256",
        "typ": "JWT"
    }).encode()).decode().rstrip('=')
    
    exp = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    payload = base64.urlsafe_b64encode(json.dumps({
        "user_id": user_id,
        "email": email,
        "exp": exp
    }).encode()).decode().rstrip('=')
    
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')
    
    return f"{header}.{payload}.{signature}"


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


def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """
    API для авторизации пользователей.
    Регистрация, вход и проверка токена.
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
    
    action = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        schema = os.environ['MAIN_DB_SCHEMA']
        
        # Регистрация
        if action == 'register' and method == 'POST':
            data = json.loads(event.get('body', '{}'))
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            name = data.get('name', '')
            
            if not email or not password or len(password) < 6:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и пароль (минимум 6 символов) обязательны'})
                }
            
            cursor.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'})
                }
            
            password_hash = hash_password(password)
            cursor.execute(
                f"INSERT INTO {schema}.users (email, password_hash, name, created_at) VALUES (%s, %s, %s, %s) RETURNING id",
                (email, password_hash, name, datetime.now(timezone.utc))
            )
            user_id = cursor.fetchone()[0]
            conn.commit()
            
            token = create_jwt(user_id, email)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'email': email, 'name': name}
                })
            }
        
        # Вход
        if action == 'login' and method == 'POST':
            data = json.loads(event.get('body', '{}'))
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и пароль обязательны'})
                }
            
            password_hash = hash_password(password)
            cursor.execute(
                f"SELECT id, email, name FROM {schema}.users WHERE email = %s AND password_hash = %s",
                (email, password_hash)
            )
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный email или пароль'})
                }
            
            user_id, user_email, user_name = user
            cursor.execute(
                f"UPDATE {schema}.users SET last_login_at = %s WHERE id = %s",
                (datetime.now(timezone.utc), user_id)
            )
            conn.commit()
            
            token = create_jwt(user_id, user_email)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'email': user_email, 'name': user_name}
                })
            }
        
        # Проверка токена
        if action == 'verify' and method == 'GET':
            auth_header = event.get('headers', {}).get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен не найден'})
                }
            
            token = auth_header.replace('Bearer ', '')
            payload = verify_jwt(token)
            
            if not payload:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен недействителен'})
                }
            
            cursor.execute(
                f"SELECT id, email, name FROM {schema}.users WHERE id = %s",
                (payload['user_id'],)
            )
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {'id': user[0], 'email': user[1], 'name': user[2]}
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
