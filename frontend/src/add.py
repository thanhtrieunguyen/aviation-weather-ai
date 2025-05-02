import hashlib
import base58
import bip39
from mnemonic import Mnemonic
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from Crypto.Protocol.KDF import scrypt
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from flask import Flask, jsonify, request
from flask_cors import CORS
from Crypto.PublicKey import ECC
from pymongo import MongoClient

try:
    uri = "mongodb+srv://admin1:a67RqW9HDY8Fj4Sh@cluster0.nyw26.mongodb.net/"
    client = MongoClient(uri)
    db = client["Airport_Weather"]['users']
    print("Kết nối MongoDB thành công!")
except Exception as e:
    print(f"Kết nối MongoDB thất bại: {e}")
def AddDataDB(address_wallet):
    try:
        user_data = {
            "address_wallet": address_wallet,
        }
        db.insert_one(user_data)
        print("✅ Dữ liệu đã được thêm vào MongoDB!")
    except Exception as e:
        print(f"Lỗi khi thêm dữ liệu vào MongoDB: {e}")