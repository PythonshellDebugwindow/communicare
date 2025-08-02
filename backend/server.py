# CommuniCare: Backend 
# Author: Dan Shan
# Date: 2025-08-01
# Updated: 2025-08-02
from flask import Flask, request, jsonify
from google import genai
from dotenv import load_dotenv
import os
from flask_cors import CORS
from base64 import b64decode
import random
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, verify_jwt_in_request
)
from hashlib import sha256
from pymongo import MongoClient

load_dotenv(".backend.env")

app = Flask('app')
gemini_client=genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
CORS(app, origins=['http://localhost:7979'], methods=['POST', 'GET'])

secret_key = os.getenv("SECRET_KEY")

app.config['SECRET_KEY'] = secret_key
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

mongo_client = MongoClient(os.getenv("MONGO_STRING"))
db = mongo_client['communicare']
doctors = db["doctors"]
patients = db["patients"]


@app.route('/body', methods=['POST'])
def body_route():
    image = request.json.get('image') # image of the body
    symptoms = request.json.get('symptoms') # list containing all symptoms
    assert isinstance(image, str) and isinstance(symptoms, list)
    b64_string = "data:image/png;base64,"
    assert image.startswith(b64_string)
    # create randomly named file
    filename = f"body_{random.randint(100_000, 999_999)}.png"
    with open(filename, "wb") as f:
        f.write(bytes(b64decode(image[len(b64_string):])))

    file = gemini_client.files.upload(file=filename)

    res = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[file, "Return the body parts of this image that have red bull's-eyes as a python list (only the list please)"],
    )

    os.remove(filename)
    response = jsonify({ "message": res.text })
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:7979')
    return response


# Use mongodb to store patient information
@app.route('/add-patient-data', methods=['POST'])
def add_patient_data_route():
    print(request.headers)
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("name"):
        return {"message": "Please provide a patient name."}, 400
    
    the_id = patients.insert_one({
        "name": json.get("name"),
        "unique_id": random.randint(100_000, 999_999),
        "doctor_id": get_jwt_identity()
    }).inserted_id
    return {"patient_id": the_id}, 200

# Use mongodb to query user information
@app.route('/user-data', methods=['GET'])
def user_data_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    user_id = get_jwt_identity()
    
    user_data = {"name": "Test " + str(user_id)} # GET_THE_MONGO(user_id)

    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "Invalid user ID"}), 400

# delete patient info from db through id
@app.route('/delete-data', methods=['GET'])
def delete_data_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    user_id = get_jwt_identity()
    db.delete_one({"id": user_id})

# Sign up the user
@app.route('/sign-up', methods=['POST'])
def sign_up_route():
    # don't need to be logged in to access this
    verify_jwt_in_request(optional=True)
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("username"):
        return {"message": "Please provide a username."}, 400
    if not json.get("password"):
        return {"message": "Please provide a password."}, 400

    # currently inserts test data, should insert user data
    the_id = "temporary" #doctors.insert_one({
        # "name": json["username"],
        # "pass": hash_password(json["password"])
    # }).inserted_id
    print(the_id, "inserted")

    # make auth token
    auth_token = create_access_token(identity=the_id)
    return {"token": auth_token}, 200


def hash_password(password: str):
    return sha256(password.encode('utf-8')).hexdigest()


app.run(port=2)
